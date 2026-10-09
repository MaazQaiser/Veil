import { useState } from "react";
import { Link } from "react-router-dom";
import { IconClose, IconMessage } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { primaryDistricts, districts } from "@/lib/districts";
import { communityHref } from "@/lib/communityStore";
import { marketplaceHref, vaelRouteForDistrict, type MarketplaceDistrictId } from "@/lib/marketplace";

type Chip = { id: string; label: string };

type Step =
  | { kind: "question"; question: string; chips: Chip[] }
  | { kind: "result"; title: string; description: string; ctaLabel: string; href: string };

const ROOT_CHIPS: Chip[] = [
  { id: "find-people", label: "Find people" },
  { id: "find-opportunities", label: "Find opportunities" },
  { id: "show-availability", label: "Show my availability" },
  { id: "explore-district", label: "Explore a district" },
  { id: "connect-people", label: "Connect with people" },
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

const MAX_STEPS = 3;

export function FindYourWay() {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);

  const step = getStep(path);

  function selectChip(chipId: string) {
    setPending(chipId);
    window.setTimeout(() => {
      setPath((current) => [...current, chipId]);
      setPending(null);
    }, 180);
  }

  function goBack() {
    setPending(null);
    setPath((current) => current.slice(0, -1));
  }

  function reset() {
    setPending(null);
    setPath([]);
  }

  function closePanel() {
    setOpen(false);
    window.setTimeout(reset, 200);
  }

  return (
    <div className="absolute bottom-10 right-4 z-[3] sm:bottom-20 sm:right-10">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="New to VAEL? Find your way"
          className="flex w-64 items-start gap-3 rounded-md border border-[#DE7C40]/50 bg-[#141414]/90 p-4 text-left shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md motion-safe:transition-colors hover:border-[#DE7C40] sm:w-80"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#DE7C40] text-[#DE7C40]">
            <IconMessage className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-sans text-body-sm font-medium text-white">Find Your Way</span>
            <span className="mt-1 block font-sans text-caption text-white/60">
              Answer a few quick questions and we&apos;ll point you to the right place in VAEL.
            </span>
          </span>
        </button>
      ) : (
        <div className="w-72 rounded-md border border-white/10 bg-[#141414]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:w-80">
          <div className="flex h-5 items-center justify-between">
            {path.length > 0 && step.kind === "question" ? (
              <button
                type="button"
                onClick={goBack}
                className="text-[0.75rem] font-medium text-white/55 hover:text-white"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close"
              className="text-white/45 hover:text-white"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex gap-1" aria-hidden>
            {Array.from({ length: MAX_STEPS }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  index <= path.length && step.kind === "question" ? "bg-[#DE7C40]/70" : "bg-white/12",
                )}
              />
            ))}
          </div>

          {step.kind === "question" ? (
            <>
              <p className="mt-4 font-sans text-body-sm font-medium text-white">{step.question}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {step.chips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => selectChip(chip.id)}
                    className={cn(
                      "rounded-md border px-3.5 py-1.5 font-sans text-caption font-medium motion-safe:transition-colors motion-safe:duration-150",
                      pending === chip.id
                        ? "border-[#DE7C40] bg-[#DE7C40]/20 text-white"
                        : "border-white/15 bg-white/[0.05] text-white/80 hover:border-[#DE7C40]/50 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 font-sans text-body-sm font-medium text-white">{step.title}</p>
              <p className="mt-1.5 font-sans text-caption text-white/70">{step.description}</p>
              <Link
                to={step.href}
                onClick={closePanel}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#DE7C40] px-4 py-2 font-sans text-caption font-medium text-[#0B0C0C] motion-safe:transition-colors hover:bg-[#E89E6E]"
              >
                {step.ctaLabel}
              </Link>
              <button
                type="button"
                onClick={reset}
                className="mt-3 block text-[0.75rem] font-medium text-white/50 hover:text-white/80"
              >
                Start over
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
