import { useNavigate } from "react-router-dom";
import { DISTRICT_CARDS } from "@/lib/marketingDirectory";
import { useCitySession } from "@/lib/citySession";
import { districtProfileEditRoute, finishOnboarding, patchOnboarding } from "@/lib/onboarding";
import { primaryDistricts } from "@/lib/districts";
import { JoinHead } from "./JoinLayout";
import { cn } from "@/lib/cn";

export function JoinDistrictPage() {
  const { session } = useCitySession();
  const navigate = useNavigate();

  function choose(districtId: string) {
    if (districtId === "media-technology") {
      patchOnboarding(session.handle, { districtId, completedStep: "District" });
      navigate("/join/identity");
      return;
    }
    patchOnboarding(session.handle, { districtId, completedStep: "District" });
    finishOnboarding(session.handle);
    navigate(districtProfileEditRoute(districtId, session.handle));
  }

  return (
    <div>
      <JoinHead
        title="Choose your district"
        lede="Your district shapes the opportunities, matches, and community you see."
      />
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {primaryDistricts.map((district) => {
          const card = DISTRICT_CARDS.find((item) => item.id === district.id);
          return (
            <li key={district.id}>
              <button
                type="button"
                onClick={() => choose(district.id)}
                className={cn(
                  "site-card flex h-full w-full flex-col overflow-hidden border border-border bg-surface text-left",
                  "hover:border-foreground focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(11,12,12,0.12)]",
                )}
              >
                {card ? (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={card.image} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="px-6 py-6">
                  <p className="site-meta text-success">LIVE</p>
                  <h2 className="site-h3 mt-3">{district.name}</h2>
                  <p className="mt-3 text-body-sm text-muted">{card?.blurb ?? district.blurb}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
