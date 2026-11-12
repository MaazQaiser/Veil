import { useLayoutEffect, useRef, useState, type ReactNode, type SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { IconCheck, IconLock } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { RxProjectCategory } from "@/lib/cxProjectStore";
import { NeedFooter } from "./NeedLayout";

export const opportunityTitleClass =
  "font-sans text-[clamp(1.875rem,3.4vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.025em] text-foreground";

export const OPPORTUNITY_STEPS = 4;

/** The surface every posting step sits on: a soft dark card with a faint top highlight. */
export const WIZARD_CARD =
  "rounded-2xl border border-white/10 bg-gradient-to-b from-[#1A1A1A] to-[#121212] px-6 py-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-10 sm:py-10";

export const TIMING_CHOICES = [
  { label: "As soon as possible", value: "ASAP" },
  { label: "Within 30 days", value: "Within 30 days" },
  { label: "In 1 to 3 months", value: "1–3 months" },
  { label: "Just planning", value: "Just planning" },
] as const;

export function timingLabel(value: string) {
  return TIMING_CHOICES.find((choice) => choice.value === value)?.label ?? value;
}

function Mark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5" {...props} />
  );
}

export function CategoryMark({ category }: { category: string }) {
  switch (category as RxProjectCategory) {
    case "Kitchen":
      return (
        <Mark>
          <path d="M4 10h16" />
          <path d="M6 10v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7" />
          <path d="M9 6a3 3 0 0 1 6 0" />
        </Mark>
      );
    case "Bathroom":
      return (
        <Mark>
          <path d="M4 13h16" />
          <path d="M6 13v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-3" />
          <path d="M7 13V8a2 2 0 0 1 2-2" />
          <path d="M9 6v2" />
        </Mark>
      );
    case "Flooring":
      return (
        <Mark>
          <path d="M4 8h16M4 12h16M4 16h16M8 8v8M16 8v8" />
        </Mark>
      );
    case "Roofing":
      return (
        <Mark>
          <path d="M4 11 12 4l8 7" />
          <path d="M7 11v8h10v-8" />
        </Mark>
      );
    case "Doors & Windows":
      return (
        <Mark>
          <path d="M6 4h12v16H6z" />
          <path d="M12 4v16M6 12h12" />
        </Mark>
      );
    case "Painting":
      return (
        <Mark>
          <path d="M4 7h12v5H4z" />
          <path d="M16 9h2a2 2 0 0 1 0 4h-2" />
          <path d="M8 12v6" />
        </Mark>
      );
    case "Electrical":
      return (
        <Mark>
          <path d="M13 3 6 14h6l-1 7 7-11h-6l1-7Z" />
        </Mark>
      );
    case "Plumbing":
      return (
        <Mark>
          <path d="M12 3s5 5.2 5 9a5 5 0 0 1-10 0c0-3.8 5-9 5-9Z" />
        </Mark>
      );
    case "HVAC":
      return (
        <Mark>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        </Mark>
      );
    case "Addition":
      return (
        <Mark>
          <path d="M12 5v14M5 12h14" />
        </Mark>
      );
    case "New Construction":
      return (
        <Mark>
          <path d="M14 5 8 8l2 2-4 4 2 2 4-4 2 2 3-6" />
          <path d="M5 19h8" />
        </Mark>
      );
    default:
      return (
        <Mark>
          <path d="M6 12h.01M12 12h.01M18 12h.01" />
        </Mark>
      );
  }
}

/** The step names of "Post an Opportunity", in order. */
export const OPPORTUNITY_STEP_LABELS = ["Job", "Where and when", "Contact", "Review"] as const;

/**
 * The fixed progress bar under the top nav: where you are, a note, and one marker per step.
 * Wide screens show a numbered track with the step names; narrow screens show a slim segmented bar.
 * Leaves a spacer of its own height so the page below is not covered.
 */
export function StepProgressBar({
  step,
  total,
  labels,
  note,
  showNoteIcon = false,
}: {
  step: number;
  total: number;
  labels?: readonly string[];
  note?: ReactNode;
  showNoteIcon?: boolean;
}) {
  const currentStep = Math.min(total, Math.max(0, step));
  const barRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(0);
  const [navHeight, setNavHeight] = useState(0);
  useLayoutEffect(() => {
    const bar = barRef.current;
    const header = document.querySelector("header");
    const measure = () => {
      if (bar) setBarHeight(bar.offsetHeight);
      setNavHeight(header ? header.getBoundingClientRect().height : 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (bar) observer.observe(bar);
    if (header) observer.observe(header);
    return () => observer.disconnect();
  }, [labels]);
  const currentLabel = labels?.[currentStep - 1];
  return (
    <>
      <div
        ref={barRef}
        style={{ top: navHeight }}
        className="fixed inset-x-0 z-30 border-b border-white/10 bg-[#0B0C0C]/95 backdrop-blur"
      >
        <div className="site-container py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4 text-body-sm md:hidden">
            <p className="text-muted">
              Step <span className="font-semibold text-foreground">{step}</span> of {total}
              {currentLabel ? (
                <>
                  <span aria-hidden className="mx-2 text-white/25">
                    /
                  </span>
                  <span className="font-medium text-accent">{currentLabel}</span>
                </>
              ) : null}
            </p>
            {note ? (
              <p className="inline-flex items-center gap-1.5 text-muted">
                {showNoteIcon ? <IconLock className="h-3.5 w-3.5" /> : null}
                {note}
              </p>
            ) : null}
          </div>

          <div className="mt-2.5 flex gap-1.5 md:hidden" role="img" aria-label={`Step ${currentStep} of ${total}`}>
            {Array.from({ length: total }, (_, index) => (
              <span
                key={index}
                className={cn("h-1 flex-1 rounded-full", index < currentStep ? "bg-primary" : "bg-white/15")}
              />
            ))}
          </div>

          <ol className={cn("mt-1 hidden items-center md:flex", labels ? "pb-6" : "pb-1")} aria-label="Progress">
            {Array.from({ length: total }, (_, index) => {
              const number = index + 1;
              const done = number < currentStep;
              const current = number === currentStep;
              const label = labels?.[index];
              return (
                <li
                  key={number}
                  aria-current={current ? "step" : undefined}
                  className={cn("relative flex items-center", number < total && "flex-1")}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-caption font-semibold motion-safe:transition-colors",
                      done && "border-accent bg-accent text-[#0B0C0C]",
                      current && "border-accent bg-accent/15 text-accent shadow-[0_0_0_4px_rgba(238,138,74,0.14)]",
                      !done && !current && "border-white/20 text-muted",
                    )}
                  >
                    {done ? <IconCheck className="h-3.5 w-3.5" /> : number}
                  </span>
                  {label ? (
                    <span
                      className={cn(
                        "absolute top-full mt-1.5 whitespace-nowrap text-caption",
                        number === 1 ? "left-0" : number === total ? "right-0" : "left-3.5 -translate-x-1/2",
                        current ? "font-semibold text-foreground" : done ? "text-muted" : "text-quiet",
                      )}
                    >
                      {label}
                    </span>
                  ) : null}
                  {number < total ? (
                    <span aria-hidden className={cn("mx-2 h-px flex-1", done ? "bg-accent" : "bg-white/15")} />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <div aria-hidden style={{ height: barHeight }} />
    </>
  );
}

export function OpportunityFrame({
  step,
  backTo,
  onBack,
  backLabel,
  showProgress = true,
  center = false,
  width = "md",
  action,
  children,
}: {
  step?: number;
  category?: string;
  backTo?: string;
  onBack?: () => void;
  backLabel?: string;
  showProgress?: boolean;
  /** Narrow card in the middle of the page, for short steps with one question. */
  center?: boolean;
  /** Card width when centred: "md" for one question, "lg" for a short form. */
  width?: "md" | "lg";
  action?: ReactNode;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div>
      {showProgress ? (
        <StepProgressBar step={step ?? 0} total={OPPORTUNITY_STEPS} labels={OPPORTUNITY_STEP_LABELS} note="Saved as you go" showNoteIcon />
      ) : (
        <div aria-hidden />
      )}
      <div className={cn(center && "flex min-h-[calc(100dvh-17rem)] items-center justify-center")}>
        <div
          className={cn(
            WIZARD_CARD + " mx-auto mt-6 w-full",
            center ? (width === "lg" ? "max-w-2xl" : "max-w-xl") : "max-w-3xl",
          )}
        >
          {children}
        </div>
      </div>
      {backTo || onBack || action ? (
        <NeedFooter backTo={backTo} onBack={onBack} backLabel={backLabel}>
          {action}
        </NeedFooter>
      ) : null}
    </div>
  );
}

export function OpportunityAction({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" size="lg" disabled={disabled} onClick={onClick} className="rounded-lg px-10">
      {children}
    </Button>
  );
}

export function OpportunityChoice({
  label,
  selected = false,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex w-full rounded-lg border bg-surface px-5 py-4 text-left text-body text-foreground",
        "motion-safe:transition-colors hover:border-white/50",
        selected ? "border-white" : "border-white/15",
      )}
    >
      {label}
    </button>
  );
}
