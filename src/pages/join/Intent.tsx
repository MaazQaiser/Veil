import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { findAccountByHandle } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import { getOnboardingDraft, ONBOARDING_PATH, patchOnboarding } from "@/lib/onboarding";
import { cn } from "@/lib/cn";
import { JoinHead } from "./JoinLayout";

const OPTIONS = [
  {
    id: "in" as const,
    label: "Vael In",
    title: "I'm available.",
    body: "I offer my skills, services, or availability to be matched.",
  },
  {
    id: "out" as const,
    label: "Vael Out",
    title: "I'm looking to hire.",
    body: "I need someone available for a role or opportunity.",
  },
];

export function JoinIntentPage() {
  const { session } = useCitySession();
  const navigate = useNavigate();
  const [choice, setChoice] = useState<"in" | "out" | "">(
    () => getOnboardingDraft(session.handle)?.intent ?? "",
  );
  const displayName = findAccountByHandle(session.handle)?.displayName || session.handle;
  const firstName = displayName.split(" ")[0];

  function onNext() {
    if (!choice) return;
    patchOnboarding(session.handle, { intent: choice, completedStep: "Intent" });
    navigate(ONBOARDING_PATH.Welcome);
  }

  return (
    <div className="flex flex-1 flex-col">
      <JoinHead
        title={`${firstName}, your account has been created! What brings you to VAEL?`}
        lede="We'll tailor your next steps to fit."
      />

      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = choice === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => setChoice(option.id)}
                aria-pressed={selected}
                className={cn(
                  "site-card group relative flex h-full w-full flex-col items-start border bg-surface px-6 py-6 text-left motion-safe:transition-all motion-safe:duration-200",
                  "hover:border-[#CA8A04] hover:bg-[#FFC555]/[0.08] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(11,12,12,0.08)]",
                  selected ? "border-foreground" : "border-border",
                )}
              >
                <span className="inline-flex w-fit items-center rounded-full bg-[#FFC555]/20 px-3 py-1 text-[0.75rem] font-bold uppercase tracking-[0.04em] text-[#8A6D00]">
                  {option.label}
                </span>
                <h2 className="mt-3 text-h4 font-medium text-foreground">{option.title}</h2>
                <p
                  className={cn(
                    "overflow-hidden text-body-sm text-muted motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
                    selected ? "mt-2 max-h-16 opacity-100" : "mt-0 max-h-0 opacity-0 group-hover:mt-2 group-hover:max-h-16 group-hover:opacity-100",
                  )}
                >
                  {option.body}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <Button
        type="button"
        size="lg"
        className="mt-auto w-full rounded-full"
        disabled={!choice}
        onClick={onNext}
      >
        Next
      </Button>
    </div>
  );
}
