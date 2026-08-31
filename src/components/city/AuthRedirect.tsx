import { Navigate } from "react-router-dom";
import { useCitySession } from "@/lib/citySession";
import { onboardingComplete, onboardingRoute } from "@/lib/onboarding";
import { PRODUCT_HOME } from "@/lib/providerJourney";

/** Signed-in users skip auth screens — resume onboarding or land on product home. */
export function AuthRedirect() {
  const { session } = useCitySession();
  if (!session.signedIn) return null;
  if (!onboardingComplete(session.handle)) {
    return <Navigate to={onboardingRoute(session.handle)} replace />;
  }
  return <Navigate to={PRODUCT_HOME} replace />;
}
