import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCitySession } from "@/lib/citySession";
import { getOnboardingDraft, onboardingComplete, patchOnboarding } from "@/lib/onboarding";
import { PRODUCT_HOME } from "@/lib/providerJourney";

/** Old “what are you here to do?” fork. Account creation now lands on the dashboard. */
export function JoinIntentPage() {
  const { session } = useCitySession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session.signedIn) {
      navigate("/join", { replace: true });
      return;
    }
    const draft = getOnboardingDraft(session.handle);
    if (!onboardingComplete(session.handle)) {
      const intent = draft?.intent === "out" ? "out" : "in";
      patchOnboarding(session.handle, {
        intent,
        completedStep: "Done",
        completedAt: new Date().toISOString(),
        ...(intent === "out" ? { outStep: "submitted" as const } : {}),
      });
    }
    navigate(PRODUCT_HOME, { replace: true });
  }, [navigate, session.handle, session.signedIn]);

  return null;
}
