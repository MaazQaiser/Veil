import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardFooter, CardMeta } from "@/components/ui/card";
import { MatchPercent } from "@/components/vael/match";
import { VeilStatus, VerificationState } from "@/components/vael/status";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { hoursLeft, placeLabel, type RankedResidentialMatch } from "@/lib/residentialStore";
import type { ResidentialRelevance } from "@/lib/residentialMatching";

export function ResidentialServiceBadge({ service }: { service: string }) {
  return <Badge tone="outline">{service}</Badge>;
}

export function ResidentialNeedSummary({
  side,
  service,
  description,
}: {
  side: "in" | "out";
  service: string;
  description: string;
}) {
  return (
    <Card>
      <p className="vael-kicker">{side === "out" ? "Your need" : "What they can help with"}</p>
      <p className="vael-h4 mt-2">{service || "Not listed"}</p>
      <CardBody className="mt-2">{description || "No description listed."}</CardBody>
    </Card>
  );
}

export function ResidentialLocationSummary({ area, postalCode }: { area: string; postalCode?: string }) {
  return (
    <Card>
      <p className="vael-kicker">Where</p>
      <p className="vael-h4 mt-2">{area || "Not listed"}</p>
      {postalCode ? <CardMeta className="mt-1">{postalCode}</CardMeta> : null}
    </Card>
  );
}

export function ResidentialTimingSummary({ availability }: { availability: string }) {
  return (
    <Card>
      <p className="vael-kicker">When</p>
      <p className="vael-h4 mt-2">{availability || "Not listed"}</p>
    </Card>
  );
}

export function ResidentialTrustCard({
  credentials,
  insuranceListed,
}: {
  credentials: string[];
  insuranceListed?: boolean;
}) {
  return (
    <Card>
      <p className="vael-kicker">Trust</p>
      <div className="mt-2">
        <VerificationState kind="unverified" />
      </div>
      <CardMeta className="mt-2">
        {credentials.length ? credentials.join(" · ") : "No credential labels listed."}
        {insuranceListed ? " · Insurance document listed on this device" : ""}
      </CardMeta>
      <p className="mt-2 text-caption text-muted">
        This kit does not verify licenses or insurance. Unverified is the honest state.
      </p>
    </Card>
  );
}

const relevanceCopy: Record<ResidentialRelevance, string> = {
  relevant: "Relevant",
  partial: "Partial",
  missing: "Does not overlap",
  "not-listed": "Not listed",
};

export function ResidentialMatchBreakdown({
  items,
}: {
  items: { label: string; relevance: ResidentialRelevance }[];
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-baseline justify-between gap-4 text-body-sm">
          <span>{item.label}</span>
          <span className="text-caption font-medium text-muted">
            {item.relevance === "relevant" ? "✓ " : item.relevance === "partial" ? "~ " : item.relevance === "missing" ? "— " : ""}
            {relevanceCopy[item.relevance]}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ResidentialAvailabilityCard({
  side,
  hours,
  service,
  area,
  availability,
}: {
  side: "in" | "out" | "expiring" | "expired";
  hours?: number;
  service: string;
  area: string;
  availability: string;
}) {
  return (
    <Card>
      <VeilStatus kind={side} hoursLeft={hours} />
      <p className="vael-h4 mt-3">{side === "out" || side === "expired" ? "Needs someone" : "Available"}</p>
      <CardMeta className="mt-1">
        {service} · {area} · {availability}
      </CardMeta>
    </Card>
  );
}

export function ResidentialMatchCard({
  match,
  viewerSide,
  action,
}: {
  match: RankedResidentialMatch;
  viewerSide: "in" | "out";
  action?: ReactNode;
}) {
  const listing = match.listing;
  const profileFirst = viewerSide === "out";
  const relevant = match.breakdown.filter((item) => item.applied && item.relevance === "relevant");
  return (
    <Card className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <div className="flex flex-col items-center">
        <MatchPercent value={match.percent} />
        <p className="mt-1 text-caption text-muted">{match.percent}% match</p>
      </div>
      <div className="min-w-0">
        <VeilStatus kind={listing.side} hoursLeft={hoursLeft(listing.expiresAt)} />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ResidentialServiceBadge service={listing.service} />
        </div>
        <h3 className="vael-h4 mt-2">
          {profileFirst
            ? listing.side === "in"
              ? `@${listing.handle}`
              : `Needs ${listing.service}`
            : listing.side === "in"
              ? "Available for home work"
              : `Needs ${listing.service}`}
        </h3>
        <CardMeta>
          {listing.service} · {placeLabel(listing.area, listing.postalCode)} · {listing.availability}
        </CardMeta>
        <CardBody className="mt-2">
          {relevant.length
            ? relevant
                .slice(0, 4)
                .map((item) => item.label)
                .join(" · ")
            : "Limited overlap on this need."}
        </CardBody>
        {listing.description ? <p className="mt-2 text-body-sm text-muted">{listing.description}</p> : null}
        <CardFooter>
          {action ?? (
            <Link to={`/districts/residential/board/${listing.id}`} className={buttonClassName({ size: "sm" })}>
              View Match
            </Link>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}
