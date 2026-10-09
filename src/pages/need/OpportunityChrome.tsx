import { useLayoutEffect, useRef, useState, type ReactNode, type SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { IconLock } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { RxProjectCategory } from "@/lib/cxProjectStore";
import { NeedFooter } from "./NeedLayout";

export const opportunityTitleClass =
  "font-sans text-[clamp(1.875rem,3.4vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.025em] text-foreground";

export const OPPORTUNITY_STEPS = 8;

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

export function OpportunityFrame({
  step,
  backTo,
  onBack,
  backLabel,
  showProgress = true,
  action,
  children,
}: {
  step?: number;
  category?: string;
  backTo?: string;
  onBack?: () => void;
  backLabel?: string;
  showProgress?: boolean;
  action?: ReactNode;
  eyebrow?: string;
  children: ReactNode;
}) {
  const currentStep = Math.min(OPPORTUNITY_STEPS, Math.max(0, step ?? 0));
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
  }, [showProgress]);
  return (
    <div>
      {showProgress ? (
      <div
        ref={barRef}
        style={{ top: navHeight }}
        className="fixed inset-x-0 z-30 border-b border-white/10 bg-[#0B0C0C]/95 backdrop-blur"
      >
        <div className="site-container py-4">
          <div className="flex items-center justify-between gap-4 text-body-sm text-muted">
            <p>
              Step {step} of {OPPORTUNITY_STEPS}
            </p>
            <p className="inline-flex items-center gap-1.5">
              <IconLock className="h-3.5 w-3.5" />
              Saved as you go
            </p>
          </div>
          <div className="mt-2 flex gap-1.5" role="img" aria-label={`Step ${currentStep} of ${OPPORTUNITY_STEPS}`}>
            {Array.from({ length: OPPORTUNITY_STEPS }, (_, index) => (
              <span
                key={index}
                className={cn("h-1 flex-1 rounded-full", index < currentStep ? "bg-primary" : "bg-white/15")}
              />
            ))}
          </div>
        </div>
      </div>
      ) : null}
      <div aria-hidden style={{ height: barHeight }} />
      <div className="mx-auto mt-6 w-full max-w-3xl rounded-lg border border-white/15 bg-[#141414] px-6 py-8 sm:px-8 sm:py-10">{children}</div>
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
