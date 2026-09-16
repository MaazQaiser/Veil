import { Navigate } from "react-router-dom";
import { useCitySession } from "@/lib/citySession";
import { PRODUCT_HOME } from "@/lib/providerJourney";

/** Signed-in users skip auth screens and land on product home. */
export function AuthRedirect() {
  const { session } = useCitySession();
  if (!session.signedIn) return null;
  return <Navigate to={PRODUCT_HOME} replace />;
}
