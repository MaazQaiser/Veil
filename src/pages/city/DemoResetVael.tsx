import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { useCitySession } from "@/lib/citySession";
import { resetVaelDemoAccounts } from "@/lib/demoReset";

/**
 * Wipes the two named Vael In / Vael Out client-demo accounts so the demo can be
 * re-run from scratch. Signs out first, on its own render pass, before purging —
 * `VaelCoreProvider` re-creates a blank profile for whichever handle is currently
 * signed in on every render where it sees one, so purging while still signed in
 * as one of the two demo accounts would immediately leave a stray blank profile
 * behind for that handle.
 */
export function DemoResetVaelPage() {
  const { session, signOut } = useCitySession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session.signedIn) {
      signOut();
      return;
    }
    resetVaelDemoAccounts();
    navigate("/", { replace: true });
  }, [session.signedIn, signOut, navigate]);

  return (
    <CityPage width="narrow">
      <p className="text-body text-muted">Resetting the Vael In / Vael Out demo accounts on this device…</p>
    </CityPage>
  );
}
