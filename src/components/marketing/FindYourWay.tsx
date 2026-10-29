import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconClose } from "@/components/ui/icons";
import { districts, districtStatusLabel } from "@/lib/districts";
import type { DistrictLotStatus } from "@/components/vael/status";
import { communityHref } from "@/lib/communityStore";
import { useCitySession } from "@/lib/citySession";
import { routeForGoVisibleEntry } from "@/lib/goVisible";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { isMarketplaceDistrict, marketplaceHref, vaelRouteForDistrict, type MarketplaceDistrictId } from "@/lib/marketplace";

type Chip = { id: string; label: string };

type Action = { label: string; href: string };

type Step =
  | { kind: "question"; question: string; chips: Chip[] }
  | { kind: "result"; title: string; description: string; primary: Action; secondary?: Action };

type Ctx = { signedIn: boolean; handle: string };

const ROOT_CHIPS: Chip[] = [
  { id: "vael-in", label: "I'm available to work" },
  { id: "vael-out", label: "I'm looking to hire" },
  { id: "opportunities", label: "Find opportunities" },
  { id: "talent", label: "See who's available" },
  { id: "district", label: "Explore a district" },
  { id: "community", label: "Join the community" },
];

const OPPORTUNITY_CHIPS: Chip[] = [
  { id: "open", label: "Open opportunities" },
  { id: "hiring", label: "People looking for talent" },
  { id: "community", label: "Community posts" },
];

const statusSuffix = (status: DistrictLotStatus) => (status === "live" ? "" : ` · ${districtStatusLabel(status)}`);
const DISTRICT_CHIPS: Chip[] = districts.map((district) => ({ id: district.id, label: `${district.name}${statusSuffix(district.status)}` }));
const DISTRICT_CHIPS_WITH_ANY: Chip[] = [{ id: "any", label: "All districts" }, ...DISTRICT_CHIPS];

function districtOf(id: string) {
  return districts.find((district) => district.id === id);
}

function districtName(id: string) {
  return districtOf(id)?.name ?? id;
}

function districtRoute(id: string) {
  return districtOf(id)?.route ?? "/districts";
}

/** Where a member lands to see matches. Only live districts have a matching board. */
function matchesHref(id: string) {
  return id !== "any" && isMarketplaceDistrict(id) ? marketplaceHref(id) : "/matches";
}

/** Sign in, then come straight back to the page the visitor asked for. */
function signInThen(intent: "in" | "out", next: string) {
  return `/sign-in?intent=${intent}&next=${encodeURIComponent(next)}`;
}

/** Districts that are not live yet have no board, availability or hiring flow. Send them to the status page. */
function notOpenYet(id: string): Step | null {
  const district = districtOf(id);
  if (!district || district.status === "live") return null;
  return {
    kind: "result",
    title: "Not open yet.",
    description: `${district.name} is ${district.status === "soon" ? "coming soon" : "in early access"}. See where it stands.`,
    primary: { label: "See the district", href: district.route },
  };
}

/** A small, hand-authored decision tree — not a model call. Every leaf lands on a real route. */
function getStep(path: string[], ctx: Ctx): Step {
  const [root, second, third] = path;

  if (!root) {
    return { kind: "question", question: "What are you here to do?", chips: ROOT_CHIPS };
  }

  // Vael In: I'm available to work.
  if (root === "vael-in") {
    if (!second) return { kind: "question", question: "Which district do you work in?", chips: DISTRICT_CHIPS };
    const closed = notOpenYet(second);
    if (closed) return closed;
    const name = districtName(second);
    if (ctx.signedIn) {
      return {
        kind: "result",
        title: `Go visible in ${name}.`,
        description: "Set your availability so people who are hiring can find you. You stay visible for 24 hours.",
        primary: { label: "Set my availability", href: vaelRouteForDistrict(second as MarketplaceDistrictId) },
        secondary: { label: "More ways to go visible", href: "/go-visible" },
      };
    }
    return {
      kind: "result",
      title: `Show your availability in ${name}.`,
      description: "Create an account, build your profile, then Vael In to be matched by fit.",
      primary: { label: "Create account", href: `${JOIN_ROUTE}?intent=in` },
      secondary: { label: "I already have an account", href: "/sign-in?intent=in" },
    };
  }

  // Vael Out: I'm looking to hire.
  if (root === "vael-out") {
    if (!second) return { kind: "question", question: "Which district do you want to hire in?", chips: DISTRICT_CHIPS };
    const closed = notOpenYet(second);
    if (closed) return closed;
    const name = districtName(second);
    if (ctx.signedIn) {
      return {
        kind: "result",
        title: `Hire in ${name}.`,
        description: "Post who you need and see people who are available, ranked by fit.",
        primary: { label: "Post what I need", href: routeForGoVisibleEntry(ctx.handle, "out") },
        secondary: { label: "More ways to go visible", href: "/go-visible" },
      };
    }
    return {
      kind: "result",
      title: `Hire in ${name}.`,
      description: "Create an account and post who you need. People who are available are matched by fit.",
      primary: { label: "Create account", href: `${JOIN_ROUTE}?intent=out` },
      secondary: { label: "I already have an account", href: "/sign-in?intent=out" },
    };
  }

  // Opportunities: work other people have posted.
  if (root === "opportunities") {
    if (!second) return { kind: "question", question: "What kind of opportunities?", chips: OPPORTUNITY_CHIPS };

    if (second === "open") {
      return ctx.signedIn
        ? {
            kind: "result",
            title: "Open opportunities.",
            description: "Browse the opportunities other people have posted, or post your own.",
            primary: { label: "Browse opportunities", href: "/opportunities?tab=browse" },
            secondary: { label: "Your opportunities", href: "/opportunities?tab=mine" },
          }
        : {
            kind: "result",
            title: "Open opportunities.",
            description: "See what is live now. Sign in to see the full details and show interest.",
            primary: { label: "See opportunities", href: "/projects" },
            secondary: { label: "Sign in", href: signInThen("in", "/opportunities?tab=browse") },
          };
    }

    if (second === "hiring") {
      if (!third) return { kind: "question", question: "Which district?", chips: DISTRICT_CHIPS_WITH_ANY };
      const closed = notOpenYet(third);
      if (closed) return closed;
      const where = third === "any" ? "VAEL" : districtName(third);
      const target = matchesHref(third);
      return ctx.signedIn
        ? {
            kind: "result",
            title: `See who's hiring in ${where}.`,
            description: "People looking for talent, ranked by how well you fit.",
            primary: { label: "See matches", href: target },
            secondary: { label: "Browse opportunities", href: "/opportunities?tab=browse" },
          }
        : {
            kind: "result",
            title: `See who's hiring in ${where}.`,
            description: "Sign in to see the people looking for talent and how well you fit.",
            primary: { label: "Sign in", href: signInThen("in", target) },
            secondary: { label: "Create account", href: `${JOIN_ROUTE}?intent=in` },
          };
    }

    // Community posts
    if (!third) return { kind: "question", question: "Which district?", chips: DISTRICT_CHIPS_WITH_ANY };
    return communityResult(third);
  }

  // See who's available.
  if (root === "talent") {
    if (!second) return { kind: "question", question: "Which district?", chips: DISTRICT_CHIPS_WITH_ANY };
    const closed = notOpenYet(second);
    if (closed) return closed;
    const where = second === "any" ? "VAEL" : districtName(second);
    return {
      kind: "result",
      title: `See who's available in ${where}.`,
      description: "People open for work right now, ranked by fit.",
      primary: {
        label: "See who's available",
        href: second === "any" ? "/explore" : `/explore?district=${encodeURIComponent(districtName(second))}`,
      },
      secondary: ctx.signedIn
        ? { label: "Open my matches", href: matchesHref(second) }
        : { label: "Create an account to reach out", href: `${JOIN_ROUTE}?intent=out` },
    };
  }

  // Explore a district.
  if (root === "district") {
    if (!second) return { kind: "question", question: "Which district?", chips: DISTRICT_CHIPS };
    return {
      kind: "result",
      title: `Take a look around ${districtName(second)}.`,
      description: "See what the district is for and who it serves.",
      primary: { label: "Explore district", href: districtRoute(second) },
    };
  }

  // Community.
  if (!second) return { kind: "question", question: "Which district?", chips: DISTRICT_CHIPS_WITH_ANY };
  return communityResult(second);
}

/** Each live district has its own community; everything else shares the main feed. */
function communityResult(id: string): Step {
  const own = id !== "any" && isMarketplaceDistrict(id);
  const where = id === "any" ? "VAEL" : districtName(id);
  return {
    kind: "result",
    title: "Join the conversation.",
    description: own
      ? `See what people in ${where} are sharing.`
      : id === "any"
        ? "See what people across VAEL are sharing."
        : `${where} has no community of its own yet. See what everyone is sharing.`,
    primary: { label: "Open community", href: own ? communityHref(id) : "/feed" },
  };
}

function chipLabel(path: string[], index: number, ctx: Ctx): string {
  const step = getStep(path.slice(0, index), ctx);
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
  const ctx: Ctx = { signedIn: session.signedIn, handle: session.handle };
  const step = getStep(path, ctx);

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
                {path.map((_, index) => chipLabel(path, index, ctx)).join("  ›  ")}
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
                    to={step.primary.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-full bg-[#EE8A4A] px-5 py-3 font-sans text-body-sm font-medium text-[#0B0C0C] motion-safe:transition-colors hover:bg-[#F4A56C]"
                  >
                    {step.primary.label}
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
