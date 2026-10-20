import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { IconClose } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { primaryDistricts, districts } from "@/lib/districts";
import { communityHref } from "@/lib/communityStore";
import { useCitySession } from "@/lib/citySession";
import { routeForGoVisibleEntry, type GoVisibleEntry } from "@/lib/goVisible";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { marketplaceHref, vaelRouteForDistrict, type MarketplaceDistrictId } from "@/lib/marketplace";

type Chip = { id: string; label: string };

type Step =
  | { kind: "question"; question: string; chips: Chip[] }
  | { kind: "result"; title: string; description: string; ctaLabel: string; href: string; entry?: GoVisibleEntry };

/** Intents from the home page "Go Visible" list. Each lands in the same flow as there. */
const INTENT_OPTIONS: Array<{ id: string; label: string; entry: GoVisibleEntry; description: string; ctaLabel: string }> = [
  { id: "networking", label: "I am open to networking", entry: "in", description: "Show you're open to connecting and let people reach you.", ctaLabel: "Get started →" },
  { id: "equipment-have", label: "I have equipment available", entry: "in", description: "List your equipment so people who need it can find you.", ctaLabel: "Get started →" },
  { id: "equipment-need", label: "I need equipment", entry: "out", description: "Tell us what you need and we'll look for matches.", ctaLabel: "Get started →" },
  { id: "freight-seek", label: "I am seeking freight or transportation", entry: "out", description: "Post what needs moving and see who can take it.", ctaLabel: "Get started →" },
  { id: "freight-offer", label: "I am available to transport", entry: "in", description: "Show your availability to haul and get matched with loads.", ctaLabel: "Get started →" },
  { id: "funding", label: "I am looking for funding", entry: "out", description: "Share what you're raising for and find people who can help.", ctaLabel: "Get started →" },
];

const ROOT_CHIPS: Chip[] = [
  { id: "find-people", label: "Find people" },
  { id: "find-opportunities", label: "Find opportunities" },
  { id: "show-availability", label: "Show my availability" },
  { id: "explore-district", label: "Explore a district" },
  { id: "connect-people", label: "Connect with people" },
  ...INTENT_OPTIONS.map(({ id, label }) => ({ id: `intent-${id}`, label })),
];

const FIND_PEOPLE_CHIPS: Chip[] = [
  { id: "skill", label: "A specific skill" },
  { id: "professional", label: "A professional" },
  { id: "team", label: "A team" },
  { id: "collaborator", label: "A collaborator" },
];

const FIND_OPPORTUNITIES_CHIPS: Chip[] = [
  { id: "projects", label: "Projects" },
  { id: "collaborations", label: "Collaborations" },
  { id: "people-looking", label: "People looking for talent" },
  { id: "community-posts", label: "Community posts" },
];

const DISTRICT_CHIPS: Chip[] = primaryDistricts.map((district) => ({ id: district.id, label: district.name }));
const DISTRICT_CHIPS_WITH_ANY: Chip[] = [{ id: "any", label: "Any district" }, ...DISTRICT_CHIPS];

function districtName(id: string) {
  return primaryDistricts.find((district) => district.id === id)?.name ?? id;
}

/** A small, hand-authored decision tree — not a model call. Every leaf lands on a real route. */
function getStep(path: string[]): Step {
  const [root, second, third] = path;

  if (!root) {
    return { kind: "question", question: "What are you here to do?", chips: ROOT_CHIPS };
  }

  const intent = INTENT_OPTIONS.find((option) => `intent-${option.id}` === root);
  if (intent) {
    return {
      kind: "result",
      title: "Let's get you set up.",
      description: intent.description,
      ctaLabel: intent.ctaLabel,
      href: "",
      entry: intent.entry,
    };
  }

  if (root === "find-people") {
    if (!second) return { kind: "question", question: "What are you looking for?", chips: FIND_PEOPLE_CHIPS };
    if (!third) return { kind: "question", question: "Where?", chips: DISTRICT_CHIPS };
    return {
      kind: "result",
      title: "You're ready to explore.",
      description: `Start with Matches in ${districtName(third)}.`,
      ctaLabel: "View Matches →",
      href: marketplaceHref(third as MarketplaceDistrictId),
    };
  }

  if (root === "find-opportunities") {
    if (!second) return { kind: "question", question: "What interests you?", chips: FIND_OPPORTUNITIES_CHIPS };
    if (!third) return { kind: "question", question: "Where?", chips: DISTRICT_CHIPS_WITH_ANY };
    const inCommunity = second === "collaborations" || second === "community-posts";
    const where = third === "any" ? "VAEL" : districtName(third);
    if (inCommunity) {
      return {
        kind: "result",
        title: "Start exploring.",
        description: `See what people in ${where} are sharing.`,
        ctaLabel: "Explore Community →",
        href: third === "any" ? "/feed" : communityHref(third as MarketplaceDistrictId),
      };
    }
    return {
      kind: "result",
      title: "People are available.",
      description: `See who's open for work in ${where}.`,
      ctaLabel: "See who's available →",
      href: third === "any" ? "/explore" : `/explore?district=${encodeURIComponent(districtName(third))}`,
    };
  }

  if (root === "show-availability") {
    if (!second) return { kind: "question", question: "Which district?", chips: DISTRICT_CHIPS };
    return {
      kind: "result",
      title: "You're set.",
      description: `Go show your availability in ${districtName(second)}.`,
      ctaLabel: "Set Availability →",
      href: vaelRouteForDistrict(second as MarketplaceDistrictId),
    };
  }

  if (root === "explore-district") {
    if (!second) return { kind: "question", question: "Which district?", chips: DISTRICT_CHIPS };
    const route = districts.find((district) => district.id === second)?.route ?? "/districts";
    return {
      kind: "result",
      title: "Take a look around.",
      description: `Here's what's happening in ${districtName(second)}.`,
      ctaLabel: "Explore District →",
      href: route,
    };
  }

  // connect-people
  if (!second) return { kind: "question", question: "Where?", chips: DISTRICT_CHIPS };
  return {
    kind: "result",
    title: "You're ready to connect.",
    description: `Start a Handshake with matches in ${districtName(second)}.`,
    ctaLabel: "View Matches →",
    href: marketplaceHref(second as MarketplaceDistrictId),
  };
}

const ROOT_KEYWORDS: Array<[string, string[]]> = [
  ["find-people", ["people", "person", "hire", "hiring", "talent", "team", "freelanc", "someone"]],
  ["find-opportunities", ["opportunit", "job", "work", "project", "gig"]],
  ["show-availability", ["availab", "visible", "show", "offer"]],
  ["explore-district", ["district", "explore", "browse"]],
  ["connect-people", ["connect", "handshake", "network", "meet"]],
];

/** Matches typed text to one of the current choices. No model: just labels and a few keywords. */
function matchChip(text: string, chips: Chip[], atRoot: boolean): string | null {
  const value = text.trim().toLowerCase();
  if (!value) return null;
  const byLabel = chips.find((chip) => {
    const label = chip.label.toLowerCase();
    return label.includes(value) || value.includes(label);
  });
  if (byLabel) return byLabel.id;
  if (atRoot) {
    const hit = ROOT_KEYWORDS.find(([, words]) => words.some((word) => value.includes(word)));
    if (hit) return hit[0];
  }
  return null;
}

function chipLabel(path: string[], index: number): string {
  const step = getStep(path.slice(0, index));
  if (step.kind !== "question") return path[index];
  return step.chips.find((chip) => chip.id === path[index])?.label ?? path[index];
}

/** A simple glossy chat bubble with a V. Shaded with gradients so it reads as a small 3D object. */
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 68" className={className} aria-hidden>
      <defs>
        <linearGradient id="fyw-body" x1="14" y1="4" x2="50" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F9AE74" />
          <stop offset="0.55" stopColor="#DE7C40" />
          <stop offset="1" stopColor="#B65A24" />
        </linearGradient>
        <linearGradient id="fyw-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fyw-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8F4210" stopOpacity="0" />
          <stop offset="1" stopColor="#8F4210" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="64" rx="16" ry="2.6" fill="#000" opacity="0.35" />
      <path
        d="M17 4h30a13 13 0 0 1 13 13v21a13 13 0 0 1-13 13H36l-11 11v-11h-8A13 13 0 0 1 4 38V17A13 13 0 0 1 17 4z"
        fill="url(#fyw-body)"
      />
      <path
        d="M17 4h30a13 13 0 0 1 13 13v21a13 13 0 0 1-13 13H36l-11 11v-11h-8A13 13 0 0 1 4 38V17A13 13 0 0 1 17 4z"
        fill="url(#fyw-edge)"
      />
      <path d="M17 6h30a11 11 0 0 1 11 11v4H6v-4A11 11 0 0 1 17 6z" fill="url(#fyw-shine)" />
      <path d="M21 17l11 20 11-20" fill="none" stroke="#7A3510" strokeOpacity="0.35" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 1.6)" />
      <path d="M21 17l11 20 11-20" fill="none" stroke="#FFF3E6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bubble({ from, children }: { from: "bot" | "user"; children: React.ReactNode }) {
  return (
    <div className={cn("flex motion-safe:animate-[fyw-in_0.25s_ease-out]", from === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] px-3.5 py-2.5 font-sans text-body-sm leading-snug",
          from === "user"
            ? "rounded-2xl rounded-br-md bg-[#DE7C40] text-[#1A1410]"
            : "rounded-2xl rounded-bl-md bg-white/[0.07] text-white/90",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start" aria-label="Typing">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white/[0.07] px-4 py-3.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-white/60 motion-safe:animate-bounce"
            style={{ animationDelay: `${index * 140}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function FindYourWay() {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [notes, setNotes] = useState<Array<{ user: string; bot: string }>>([]);
  const [draft, setDraft] = useState("");
  const [greeted, setGreeted] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timer = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const { session } = useCitySession();
  const step = getStep(path);

  function hrefFor(result: { href: string; entry?: GoVisibleEntry }) {
    if (!result.entry) return result.href;
    return session.signedIn ? routeForGoVisibleEntry(session.handle, result.entry) : `${JOIN_ROUTE}?entry=${result.entry}`;
  }

  function pause(ms = 650) {
    setTyping(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTyping(false), ms);
  }

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [path, typing, notes, greeted, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // A small hello appears once per visit, a few seconds after the page loads.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("vael_fyw_teaser") === "1";
    } catch {
      /* ignore */
    }
    if (seen) return;
    const id = window.setTimeout(() => setTeaser(true), 2500);
    return () => window.clearTimeout(id);
  }, []);

  function dismissTeaser() {
    setTeaser(false);
    try {
      sessionStorage.setItem("vael_fyw_teaser", "1");
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (open && greeted && !typing) inputRef.current?.focus();
  }, [open, greeted, typing]);

  function openPanel() {
    dismissTeaser();
    setOpen(true);
    if (!greeted) {
      setGreeted(true);
      pause(800);
    }
  }

  function choose(chipId: string) {
    if (typing) return;
    setNotes([]);
    setPath((current) => [...current, chipId]);
    pause();
  }

  function goBack() {
    if (timer.current) window.clearTimeout(timer.current);
    setTyping(false);
    setNotes([]);
    setPath((current) => current.slice(0, -1));
  }

  function reset() {
    if (timer.current) window.clearTimeout(timer.current);
    setTyping(false);
    setNotes([]);
    setPath([]);
    pause(450);
  }

  function closePanel() {
    setOpen(false);
  }

  function onSend(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || typing) return;
    setDraft("");
    if (step.kind !== "question") {
      setNotes((current) => [...current, { user: text, bot: "Tap the button above to continue, or start over." }]);
      return;
    }
    const hit = matchChip(text, step.chips, path.length === 0);
    if (hit) {
      choose(hit);
      return;
    }
    setNotes((current) => [...current, { user: text, bot: "I can only help with the choices below. Tap one to go on." }]);
  }

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-6 sm:right-6">
      {!open ? (
        <div className="relative">
          {teaser ? (
            <div className="absolute bottom-full right-0 mb-3 w-56 motion-safe:animate-[fyw-in_0.3s_ease-out]">
              <div className="relative rounded-2xl rounded-br-md bg-[#1B1B1B] p-3.5 pr-8 font-sans text-body-sm text-white shadow-[0_14px_34px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
                Hey! Need a hand finding your way around VAEL?
                <button
                  type="button"
                  onClick={dismissTeaser}
                  aria-label="Dismiss"
                  className="absolute right-2.5 top-2.5 text-white/40 hover:text-white"
                >
                  <IconClose className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={openPanel}
            aria-label="Find your way"
            title="Find your way"
            className="group relative block h-[4.5rem] w-[4.25rem] motion-safe:animate-[fyw-float_3.2s_ease-in-out_infinite] focus-visible:outline-none"
          >
            <span aria-hidden className="absolute inset-x-2 top-1 h-10 rounded-full bg-[#DE7C40]/30 motion-safe:animate-ping" />
            <ChatIcon className="relative h-full w-full drop-shadow-[0_10px_16px_rgba(222,124,64,0.35)] motion-safe:transition-transform motion-safe:duration-200 group-hover:-translate-y-1 group-hover:scale-105 group-active:scale-95" />
            {teaser ? (
              <span aria-hidden className="absolute -right-0.5 top-0 h-3.5 w-3.5 rounded-full border-2 border-[#0B0C0C] bg-[#4ADE80]" />
            ) : null}
          </button>
        </div>
      ) : (
        <div
          role="dialog"
          aria-label="Find your way"
          className="flex h-[34rem] max-h-[calc(100dvh-6rem)] w-[calc(100vw-2rem)] max-w-[22rem] origin-bottom-right flex-col overflow-hidden rounded-2xl motion-safe:animate-[fyw-pop_0.2s_ease-out] border border-white/10 bg-[#121212] shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <ChatIcon className="h-9 w-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-sans text-body-sm font-medium text-white">Find your way</p>
              <p className="flex items-center gap-1.5 font-sans text-caption text-white/50">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
                Here to help
              </p>
            </div>
            {path.length > 0 ? (
              <>
                <button type="button" onClick={goBack} className="text-caption font-medium text-white/55 hover:text-white">
                  ← Back
                </button>
                <button type="button" onClick={reset} className="text-caption font-medium text-white/55 hover:text-white">
                  Restart
                </button>
              </>
            ) : null}
            <button type="button" onClick={closePanel} aria-label="Close chat" className="text-white/45 hover:text-white">
              <IconClose className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <Bubble from="bot">
              Hey! Find your way. Answer a few quick questions and we'll point you to the right place in VAEL.
            </Bubble>
            {!greeted || (typing && path.length === 0) ? <TypingBubble /> : null}

            {(!typing || path.length > 0) && greeted
              ? Array.from({ length: path.length + 1 }).map((_, index) => {
                  const here = getStep(path.slice(0, index));
                  const answered = index < path.length;
                  const isLast = index === path.length;
                  if (isLast && typing) return null;
                  return (
                    <div key={index} className="space-y-3">
                      {here.kind === "question" ? (
                        <Bubble from="bot">
                          {index > 0 ? "Got it. " : ""}
                          {here.question}
                        </Bubble>
                      ) : (
                        <Bubble from="bot">
                          <span className="block font-medium text-white">{here.title}</span>
                          <span className="mt-1 block text-white/70">{here.description}</span>
                          <Link
                            to={hrefFor(here)}
                            onClick={closePanel}
                            className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#DE7C40] px-4 py-2.5 font-sans text-caption font-medium text-[#0B0C0C] motion-safe:transition-colors hover:bg-[#E89E6E]"
                          >
                            {here.ctaLabel.replace(/\s*→\s*$/, "")}
                            <span aria-hidden>→</span>
                          </Link>
                        </Bubble>
                      )}
                      {answered ? <Bubble from="user">{chipLabel(path, index)}</Bubble> : null}
                    </div>
                  );
                })
              : null}

            {typing && path.length > 0 ? <TypingBubble /> : null}

            {notes.map((note, index) => (
              <div key={index} className="space-y-3">
                <Bubble from="user">{note.user}</Bubble>
                <Bubble from="bot">{note.bot}</Bubble>
              </div>
            ))}

            {!typing && greeted ? (
              step.kind === "question" ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {step.chips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => choose(chip.id)}
                      className="rounded-full border border-[#DE7C40]/60 px-3.5 py-1.5 font-sans text-caption font-medium text-[#F2BA8B] motion-safe:transition-colors hover:bg-[#DE7C40]/15 hover:text-white"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button type="button" onClick={reset} className="rounded-full border border-white/15 px-3.5 py-1.5 font-sans text-caption font-medium text-white/70 hover:border-[#DE7C40]/60 hover:text-white">
                    Start over
                  </button>
                </div>
              )
            ) : null}
            <div ref={endRef} />
          </div>

          <form onSubmit={onSend} className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message…"
              aria-label="Type a message"
              className="h-10 min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.05] px-4 font-sans text-body-sm text-white placeholder:text-white/40 focus:border-[#DE7C40]/60 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!draft.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DE7C40] text-[#1A1410] motion-safe:transition-opacity disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
