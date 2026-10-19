import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCitySession } from "@/lib/citySession";
import { cn } from "@/lib/cn";
import { getOnboardingDraft, isNeedIntent, onboardingRoute, patchOnboarding, vaelOutResume } from "@/lib/onboarding";
import { JoinFooterBar, JoinHead } from "./JoinLayout";

const PROFILE_KINDS = [
  { id: "media-professional", title: "Media professional", body: "Editors, DPs, sound engineers, designers, journalists.", type: "individual" },
  { id: "technology-professional", title: "Technology professional", body: "Developers, data/AI specialists, IT engineers.", type: "individual" },
  { id: "studio", title: "Studio", body: "Design, audio, or creative studio.", type: "business" },
  { id: "production-company", title: "Production company", body: "Broadcast or production house staffing a shoot or build.", type: "business" },
  { id: "buyer", title: "Buyer", body: "Brand or agency commissioning work.", type: "business" },
  { id: "project-owner", title: "Project owner", body: "Posting a project brief to find talent.", type: "individual" },
] as const;

/** Onboarding step after Welcome, for both Vael In and Vael Out. */
export function JoinProfileTypePage() {
  const { session } = useCitySession();
  const navigate = useNavigate();
  const draft = getOnboardingDraft(session.handle);
  const [kind, setKind] = useState(draft?.profileKind ?? "");

  if (isNeedIntent(draft)) {
    return <Navigate to={onboardingRoute(session.handle)} replace />;
  }

  function onContinue() {
    const chosen = PROFILE_KINDS.find((item) => item.id === kind);
    if (!chosen) return;
    if (draft?.intent === "out") {
      patchOnboarding(session.handle, { profileKind: chosen.id, profileType: chosen.type });
      navigate(vaelOutResume(getOnboardingDraft(session.handle)));
      return;
    }
    patchOnboarding(session.handle, { profileKind: chosen.id, profileType: chosen.type, completedStep: "Profile Type" });
    navigate("/join/setup");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <JoinHead title="Select your profile type" lede="Tell the exchange who you are. You can change this anytime." center />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {PROFILE_KINDS.map((item) => {
          const selected = kind === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setKind(item.id)}
                className={cn(
                  "flex h-full w-full flex-col items-start justify-start rounded-lg border bg-surface px-5 py-4 text-left motion-safe:transition-colors motion-safe:duration-150",
                  "hover:border-[#DE7C40] hover:bg-[#DE7C40]/[0.06]",
                  selected ? "border-[#DE7C40] bg-[#DE7C40]/[0.08]" : "border-border",
                )}
              >
                <p className="text-body-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-0.5 text-caption text-muted">{item.body}</p>
              </button>
            </li>
          );
        })}
      </ul>
      <JoinFooterBar>
        <Button type="button" size="lg" className="rounded-lg px-10" disabled={!kind} onClick={onContinue}>
          Continue
        </Button>
      </JoinFooterBar>
    </div>
  );
}
