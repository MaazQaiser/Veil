import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconClose } from "@/components/ui/icons";
import { primaryDistricts, districts } from "@/lib/districts";
import { communityHref } from "@/lib/communityStore";
import { useCitySession } from "@/lib/citySession";
import { routeForGoVisibleEntry, type GoVisibleEntry } from "@/lib/goVisible";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { marketplaceHref, vaelRouteForDistrict, type MarketplaceDistrictId } from "@/lib/marketplace";

type Chip = { id: string; label: string };

type Step =
  | { kind: "question"; question: string; chips: Chip[] }
  | { kind: "result"; title: string; description: string; ctaLabel: string; href: string; entry?: GoVisibleEntry; secondary?: { label: string; href: string } };

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
  { id: "find-people", label: "Find talent" },
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

function districtRoute(id: string) {
  return districts.find((district) => district.id === id)?.route ?? "/districts";
}

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
      description: `Search talent in ${districtName(third)}, or head straight to the district.`,
      ctaLabel: "Continue to search →",
      href: marketplaceHref(third as MarketplaceDistrictId),
      secondary: { label: `Go to ${districtName(third)}`, href: districtRoute(third) },
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
    const route = districtRoute(second);
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
          <stop offset="0.55" stopColor="#EE8A4A" />
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


function ChoiceRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left font-sans text-body-sm font-medium text-white/90 motion-safe:transition-colors hover:border-[#EE8A4A]/60 hover:bg-[#EE8A4A]/10 hover:text-white"
    >
      {label}
      <span aria-hidden className="text-white/35 motion-safe:transition-transform group-hover:translate-x-0.5 group-hover:text-[#EE8A4A]">
        →
      </span>
    </button>
  );
}

/** A guided picker, not a chat: one question at a time, tap an option to move on. */
export function FindYourWay() {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string[]>([]);
  const [teaser, setTeaser] = useState(false);
  const { session } = useCitySession();
  const step = getStep(path);

  function hrefFor(result: { href: string; entry?: GoVisibleEntry }) {
    if (!result.entry) return result.href;
    return session.signedIn ? routeForGoVisibleEntry(session.handle, result.entry) : `${JOIN_ROUTE}?entry=${result.entry}`;
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The "Find your way here" note shows on every page load until it is closed.
  useEffect(() => {
    const id = window.setTimeout(() => setTeaser(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  function dismissTeaser() {
    setTeaser(false);
  }

  function openPanel() {
    dismissTeaser();
    setOpen(true);
  }

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-6 sm:right-6">
      {!open ? (
        <div className="relative">
          {teaser ? (
            <div className="absolute bottom-full right-0 mb-3 w-52 motion-safe:animate-[fyw-in_0.3s_ease-out]">
              <div className="relative rounded-2xl rounded-br-md bg-[#1B1B1B] p-3.5 pr-8 font-sans text-body-sm text-white shadow-[0_14px_34px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
                Find your way here
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
            <span aria-hidden className="absolute inset-x-2 top-1 h-10 rounded-full bg-[#EE8A4A]/30 motion-safe:animate-ping" />
            <ChatIcon className="relative h-full w-full drop-shadow-[0_10px_16px_rgba(238,138,74,0.35)] motion-safe:transition-transform motion-safe:duration-200 group-hover:-translate-y-1 group-hover:scale-105 group-active:scale-95" />
            {teaser ? (
              <span aria-hidden className="absolute -right-0.5 top-0 h-3.5 w-3.5 rounded-full border-2 border-[#0B0C0C] bg-[#4ADE80]" />
            ) : null}
          </button>
        </div>
      ) : (
        <div
          role="dialog"
          aria-label="Find your way"
          className="flex max-h-[calc(100dvh-6rem)] w-[calc(100vw-2rem)] max-w-[27rem] origin-bottom-right flex-col overflow-hidden rounded-2xl motion-safe:animate-[fyw-pop_0.2s_ease-out] border border-white/10 bg-[#121212] shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <ChatIcon className="h-9 w-8 shrink-0" />
            <p className="min-w-0 flex-1 font-sans text-body font-medium text-white">Find your way</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-white/45 hover:text-white">
              <IconClose className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {path.length > 0 ? (
              <div className="mb-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPath((current) => current.slice(0, -1))}
                  className="text-caption font-medium text-white/55 hover:text-white"
                >
                  ← Back
                </button>
                <button type="button" onClick={() => setPath([])} className="text-caption font-medium text-white/55 hover:text-white">
                  Start over
                </button>
              </div>
            ) : null}

            {path.length > 0 ? (
              <p className="mb-2 font-sans text-caption text-white/45">
                {path.map((_, index) => chipLabel(path, index)).join("  ›  ")}
              </p>
            ) : null}

            {step.kind === "question" ? (
              <>
                <h2 className="font-sans text-h4 font-medium text-white">{step.question}</h2>
                <div className="mt-4 space-y-2">
                  {step.chips.map((chip) => (
                    <ChoiceRow key={chip.id} label={chip.label} onClick={() => setPath((current) => [...current, chip.id])} />
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="font-sans text-h4 font-medium text-white">{step.title}</h2>
                <p className="mt-1.5 text-body-sm text-white/65">{step.description}</p>
                <div className="mt-5 space-y-2">
                  <Link
                    to={hrefFor(step)}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-full bg-[#EE8A4A] px-5 py-3 font-sans text-body-sm font-medium text-[#0B0C0C] motion-safe:transition-colors hover:bg-[#F4A56C]"
                  >
                    {step.ctaLabel.replace(/\s*→\s*$/, "")}
                    <span aria-hidden>→</span>
                  </Link>
                  {step.secondary ? (
                    <Link
                      to={step.secondary.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-3 rounded-full border border-white/15 px-5 py-3 font-sans text-body-sm font-medium text-white/85 motion-safe:transition-colors hover:border-[#EE8A4A]/60 hover:text-white"
                    >
                      {step.secondary.label}
                      <span aria-hidden>→</span>
                    </Link>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
