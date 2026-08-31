import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { PageHeader } from "@/components/ui/headers";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { useCitySession } from "@/lib/citySession";

export function RequireMember({ children, title }: { children: ReactNode; title: string }) {
  const { session } = useCitySession();
  if (session.signedIn) return <>{children}</>;
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="The City of VAEL"
        title={title}
        description="Join VAEL to continue your provider journey on this device."
      />
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={JOIN_ROUTE} className={buttonClassName({ size: "lg" })}>
          Join VAEL
        </Link>
        <Link to="/sign-in" className={buttonClassName({ variant: "outline", size: "lg" })}>
          Sign in
        </Link>
      </div>
    </CityPage>
  );
}