import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardFooter, CardMeta } from "@/components/ui/card";
import { MatchPercent } from "@/components/vael/match";
import { VaelStatus, VerificationState } from "@/components/vael/status";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { getCmProfile, hoursLeft, type RankedCommercialMatch } from "@/lib/commercialStore";
import type { CommercialRelevance } from "@/lib/commercialMatching";

export function CommercialCapabilityBadge({ capability }: { capability: string }) {
  return <Badge tone="outline">{capability}</Badge>;
}

export function CommercialNeedSummary({
  side,
  capability,
  context,
  description,
}: {
  side: "in" | "out";
  capability: string;
  context: string;
  description: string;
}) {
  return (
    <Card>
      <p className="vael-kicker">{side === "out" ? "Business need" : "Capability offered"}</p>
      <p className="vael-h4 mt-2">{capability || "Not listed"}</p>
      {context ? <CardMeta className="mt-1">{context}</CardMeta> : null}
      <CardBody className="mt-2">{description || "No description listed."}</CardBody>
    </Card>
  );
}

export function CommercialContextCard({ context }: { context: string }) {
  return (
    <Card>
      <p className="vael-kicker">Business context</p>
      <p className="vael-h4 mt-2">{context || "Not listed"}</p>
    </Card>
  );
}

export function CommercialLocationSummary({ area }: { area: string }) {
  return (
    <Card>
      <p className="vael-kicker">Where</p>
      <p className="vael-h4 mt-2">{area || "Not listed"}</p>
    </Card>
  );
}

export function CommercialTimingSummary({ availability }: { availability: string }) {
  return (
    <Card>
      <p className="vael-kicker">When</p>
      <p className="vael-h4 mt-2">{availability || "Not listed"}</p>
    </Card>
  );
}

export function CommercialRequirementsCard({ requirements }: { requirements: string }) {
  return (
    <Card>
      <p className="vael-kicker">Requirements</p>
      <CardBody className="mt-2">{requirements || "None listed."}</CardBody>
    </Card>
  );
}

export function CommercialTrustCard({
  credentials,
  documentsListed,
}: {
  credentials: string[];
  documentsListed?: boolean;
}) {
  return (
    <Card>
      <p className="vael-kicker">Trust</p>
      <div className="mt-2">
        <VerificationState kind="unverified" />
      </div>
      <CardMeta className="mt-2">
        {credentials.length ? credentials.join(" · ") : "No credential labels listed."}
        {documentsListed ? " · Documents listed on this device" : ""}
      </CardMeta>
      <p className="mt-2 text-caption text-muted">
        This kit does not verify companies, licenses, or insurance. Unverified is the honest state.
      </p>
    </Card>
  );
}

const relevanceCopy: Record<CommercialRelevance, string> = {
  relevant: "Relevant",
  partial: "Partial",
  missing: "Does not overlap",
  "not-listed": "Not listed",
};

export function CommercialMatchBreakdown({
  items,
}: {
  items: { label: string; relevance: CommercialRelevance }[];
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

export function CommercialAvailabilityCard({
  side,
  hours,
  capability,
  area,
  availability,
}: {
  side: "in" | "out" | "expiring" | "expired";
  hours?: number;
  capability: string;
  area: string;
  availability: string;
}) {
  return (
    <Card>
      <VaelStatus kind={side} hoursLeft={hours} />
      <p className="vael-h4 mt-3">{side === "out" || side === "expired" ? "Needs someone" : "Available"}</p>
      <CardMeta className="mt-1">
        {capability} · {area} · {availability}
      </CardMeta>
    </Card>
  );
}

export function CommercialMatchCard({
  match,
  viewerSide,
  action,
}: {
  match: RankedCommercialMatch;
  viewerSide: "in" | "out";
  action?: ReactNode;
}) {
  const listing = match.listing;
  const company = getCmProfile(listing.handle);
  const relevant = match.breakdown.filter((item) => item.applied && item.relevance === "relevant");
  const companyLabel = company?.displayName || `@${listing.handle}`;

  return (
    <Card className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
      <div className="flex flex-col items-center sm:pt-1">
        <MatchPercent value={match.percent} />
        <p className="mt-1 text-caption text-muted">{match.percent}% Match</p>
      </div>
      <div className="min-w-0">
        <VaelStatus kind={listing.side} hoursLeft={hoursLeft(listing.expiresAt)} />
        <h3 className="vael-h4 mt-3">
          {viewerSide === "out"
            ? companyLabel
            : listing.side === "out"
              ? `Needs ${listing.capability}`
              : companyLabel}
        </h3>
        <dl className="mt-3 grid gap-2 text-body-sm sm:grid-cols-2">
          <Row label="Capability" value={listing.capability || "Not listed"} />
          <Row label="Location" value={listing.area || "Not listed"} />
          <Row label="Availability" value={listing.availability || "Not listed"} />
          <Row label="Requirements" value={listing.requirements || "None listed"} />
        </dl>
        <CardMeta className="mt-3">
          {company?.profileType === "company" ? "Company" : "Provider"} · Unverified
        </CardMeta>
        <CardBody className="mt-2">
          {relevant.length
            ? `Why this match: ${relevant
                .slice(0, 4)
                .map((item) => item.label)
                .join(" · ")}`
            : "Limited overlap on this need."}
        </CardBody>
        {listing.context ? <p className="mt-2 text-body-sm text-muted">{listing.context}</p> : null}
        <CardFooter>
          {action ?? (
            <Link to={`/districts/commercial/board/${listing.id}`} className={buttonClassName({ size: "sm" })}>
              View Match
            </Link>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption font-medium text-muted">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
