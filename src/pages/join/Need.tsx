import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCitySession } from "@/lib/citySession";
import { setActiveDistrict } from "@/lib/myDistricts";
import { CONTRACTOR_BUSINESS_PATH, CONTRACTOR_HOME_PATH } from "@/lib/cxRoutes";
import {
  finishOnboarding,
  getOnboardingDraft,
  isNeedIntent,
  patchOnboarding,
  type OnboardingNeedPlace,
} from "@/lib/onboarding";
import { setContractorExperience } from "@/lib/rxExperience";
import { cn } from "@/lib/cn";
import { JoinFooterBar, JoinHead } from "./JoinLayout";

const PLACES = [
  {
    id: "home" as const,
    title: "For my home",
    body: "A project at a house or apartment — kitchen, plumbing, painting, and similar work.",
  },
  {
    id: "business" as const,
    title: "For my business",
    body: "Work for a company, office, or commercial space.",
  },
];

export function JoinNeedPage() {
  const { session } = useCitySession();
  const navigate = useNavigate();
  const draft = getOnboardingDraft(session.handle);
  const [place, setPlace] = useState<OnboardingNeedPlace>(draft?.needPlace ?? "");

  if (!isNeedIntent(draft)) {
    return <Navigate to="/join/intent" replace />;
  }

  function onContinue() {
    if (!place || !session.handle) return;
    setContractorExperience(session.handle, place === "home" ? "residential" : "business");
    setActiveDistrict(session.handle, "construction");
    patchOnboarding(session.handle, {
      needPlace: place,
      districtId: "construction",
      profileType: place === "home" ? "individual" : "business",
    });
    finishOnboarding(session.handle);
    navigate(place === "home" ? CONTRACTOR_HOME_PATH : CONTRACTOR_BUSINESS_PATH);
  }

  return (
    <div className="flex flex-1 flex-col">
      <JoinHead title="Where do you need this done?" lede="We'll take you to the right people from here." />

      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {PLACES.map((option) => {
          const selected = place === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => setPlace(option.id)}
                aria-pressed={selected}
                className={cn(
                  "site-card flex h-full w-full flex-col items-start rounded-lg border bg-surface px-6 py-6 text-left motion-safe:transition-all motion-safe:duration-200",
                  "hover:border-[#DE7C40] hover:bg-[#DE7C40]/[0.08] hover:-translate-y-0.5",
                  selected ? "border-foreground" : "border-border",
                )}
              >
                <h2 className="text-h4 font-medium text-foreground">{option.title}</h2>
                <p className="mt-2 text-body-sm text-muted">{option.body}</p>
              </button>
            </li>
          );
        })}
      </ul>

      <JoinFooterBar>
        <Button type="button" size="lg" className="rounded-lg px-10" disabled={!place} onClick={onContinue}>
          Continue
        </Button>
      </JoinFooterBar>
    </div>
  );
}
