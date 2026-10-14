import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCitySession } from "@/lib/citySession";
import { onboardingComplete, onboardingRoute } from "@/lib/onboarding";
import { PRODUCT_HOME } from "@/lib/providerJourney";

/** Old “what are you here to do?” fork. Sends people into their onboarding, or home once it is done. */
export function JoinIntentPage() {
  const { session } = useCitySession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session.signedIn) {
      navigate("/join", { replace: true });
      return;
    }
    navigate(onboardingComplete(session.handle) ? PRODUCT_HOME : onboardingRoute(session.handle), { replace: true });
  }, [navigate, session.handle, session.signedIn]);

  return null;
}
