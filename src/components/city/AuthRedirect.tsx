import { Navigate } from "react-router-dom";
import { useCitySession } from "@/lib/citySession";
import { signedInLanding } from "@/lib/onboarding";

/** Signed-in users skip auth screens and land where their account belongs. */
export function AuthRedirect() {
  const { session } = useCitySession();
  if (!session.signedIn) return null;
  return <Navigate to={signedInLanding(session.handle)} replace />;
}
