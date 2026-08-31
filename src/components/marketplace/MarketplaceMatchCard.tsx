import { Link } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MarketplaceMatch } from "@/lib/marketplace";

export function MarketplaceMatchCard({
  match,
  showDistrict,
}: {
  match: MarketplaceMatch;
  showDistrict?: boolean;
}) {
  return (
    <Card className="flex h-full flex-col">
      <p className="text-h3 font-semibold tracking-[-0.03em]">{Math.round(match.percent)}% Match</p>
      <h3 className="mt-4 text-body font-medium">{match.title}</h3>
      {showDistrict ? <p className="mt-1 text-body-sm text-muted">{match.districtLabel}</p> : null}
      {match.locationLine ? <p className="mt-1 text-body-sm">{match.locationLine}</p> : null}

      {match.whyMatch.length > 0 ? (
        <div className="mt-5">
          <p className="vael-kicker">Why you match</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-body-sm">
            {match.whyMatch.map((reason) => (
              <li key={reason}>✓ {reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-auto pt-6">
        <Link to={match.href} className={buttonClassName()}>
          View Match
        </Link>
      </div>
    </Card>
  );
}
