import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { useCitySession } from "@/lib/citySession";
import { resetClientDemoData } from "@/lib/demoJourney";

export function DemoResetPage() {
  const { signOut } = useCitySession();
  const navigate = useNavigate();

  useEffect(() => {
    resetClientDemoData();
    signOut();
    navigate("/", { replace: true });
  }, [navigate, signOut]);

  return (
    <CityPage width="narrow">
      <p className="text-body text-muted">Resetting the demo on this device…</p>
    </CityPage>
  );
}
