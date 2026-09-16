import { useState } from "react";
import { JOURNEY_STEPS, type JourneyStep } from "@/lib/providerJourney";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/onboarding";
import { cn } from "@/lib/cn";

/** Full provider journey — compact on mobile, expanded on desktop. */
export function JourneyProgress({ step }: { step: JourneyStep }) {
  return <StepStrip steps={[...JOURNEY_STEPS]} step={step} />;
}

/** Onboarding wizard progress: numbered circles + connectors, VAEL gold. */
export function JoinProgress({ step }: { step: OnboardingStep }) {
  const steps = ONBOARDING_STEPS;
  const current = steps.indexOf(step);
  const total = steps.length;
  const percent = Math.round(((Math.max(current, 0) + 1) / total) * 100);

  return (
    <div className="mb-7">
      <div className="md:hidden">
        <p className="text-caption font-medium text-foreground">
          Step {current + 1} of {total} · {step}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="hidden items-center gap-4 md:flex" role="group" aria-label={`Step ${current + 1} of ${total}`}>
        <span
          aria-current="step"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-body-sm font-medium tabular-nums text-background shadow-sm"
        >
          {current + 1}
        </span>
        <div className="relative h-px flex-1 rounded-full bg-border" aria-hidden>
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-body-sm font-medium tabular-nums text-quiet">
          {total}
        </span>
      </div>
    </div>
  );
}

function StepStrip({ steps, step }: { steps: readonly string[]; step: string }) {
  const current = steps.indexOf(step);
  const [open, setOpen] = useState(false);
  const total = steps.length;
  const percent = Math.round(((Math.max(current, 0) + 1) / total) * 100);

  return (
    <div className="mb-8">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left md:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="text-caption font-medium text-foreground">
          Step {current + 1} of {total} · {step}
        </span>
        <span className="text-caption text-quiet">{open ? "Hide" : "Show"}</span>
      </button>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-muted md:hidden">
        <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
      <ol
        className={cn(
          "mt-4 flex-wrap items-center gap-x-3 gap-y-2 text-caption md:mt-0 md:flex",
          open ? "flex" : "hidden md:flex",
        )}
      >
        {steps.map((label, index) => {
          const done = index < current;
          const here = index === current;
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                aria-current={here ? "step" : undefined}
                className={here ? "font-medium text-foreground" : done ? "text-muted" : "text-quiet"}
              >
                <span className="tabular-nums">{done ? "✓" : String(index + 1).padStart(2, "0")}</span> {label}
              </span>
              {index < steps.length - 1 ? (
                <span className="text-quiet" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Legacy alias — onboarding only (Account → Profile → District). */
const SETUP_STEPS = ["Account", "Your profile", "District"];

export function SetupProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-3 text-caption">
      {SETUP_STEPS.map((label, index) => {
        const position = index + 1;
        const current = position === step;
        const done = position < step;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              aria-current={current ? "step" : undefined}
              className={current ? "font-medium text-foreground" : "text-muted"}
            >
              <span className="tabular-nums text-quiet">
                {done ? "✓" : String(position).padStart(2, "0")}
              </span>{" "}
              {label}
            </span>
            {index < SETUP_STEPS.length - 1 ? (
              <span className="text-quiet" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
