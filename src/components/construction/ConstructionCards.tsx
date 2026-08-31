import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardFooter, CardMeta } from "@/components/ui/card";
import { MatchPercent } from "@/components/vael/match";
import { VeilStatus } from "@/components/vael/status";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import type { RankedConstructionMatch } from "@/lib/constructionStore";
import { hoursLeft } from "@/lib/vaelStore";
import type { ConstructionRelevance } from "@/lib/constructionMatching";

export function ConstructionTradeBadge({ trade }: { trade: string }) {
  return <Badge tone="outline">{trade}</Badge>;
}

const relevanceCopy: Record<ConstructionRelevance, string> = {
  relevant: "Relevant",
  partial: "Partial",
  missing: "Does not overlap",
  "not-listed": "Not listed",
};

export function ConstructionMatchBreakdown({
  items,
}: {
  items: { label: string; relevance: ConstructionRelevance }[];
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

export function ConstructionAvailabilityCard({
  side,
  hours,
  trade,
  serviceArea,
  availability,
}: {
  side: "in" | "out" | "expiring" | "expired";
  hours?: number;
  trade: string;
  serviceArea: string;
  availability: string;
}) {
  return (
    <Card>
      <VeilStatus kind={side} hoursLeft={hours} />
      <p className="vael-h4 mt-3">{side === "out" || side === "expired" ? "Needs someone" : "Available"}</p>
      <CardMeta className="mt-1">
        {trade} · {serviceArea} · {availability}
      </CardMeta>
    </Card>
  );
}

export function ConstructionRequirementCard({ body }: { body: string }) {
  return (
    <Card>
      <p className="vael-kicker">Requirements</p>
      <CardBody className="mt-2">{body || "None listed."}</CardBody>
    </Card>
  );
}

export function ConstructionProjectSummary({
  jobType,
  timeline,
  description,
}: {
  jobType: string;
  timeline: string;
  description: string;
}) {
  return (
    <Card>
      <p className="vael-kicker">Project / work</p>
      <p className="vael-h4 mt-2">{jobType}</p>
      <CardMeta className="mt-1">{timeline}</CardMeta>
      <CardBody className="mt-2">{description}</CardBody>
    </Card>
  );
}

export function ConstructionMatchCard({
  match,
  action,
}: {
  match: RankedConstructionMatch;
  action?: ReactNode;
}) {
  const why = match.breakdown.filter((item) => item.applied && item.relevance === "relevant").slice(0, 3);
  const listing = match.listing;
  return (
    <Card className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <div className="flex flex-col items-center">
        <MatchPercent value={match.percent} />
        <p className="mt-1 text-caption text-muted">{match.percent}% match</p>
      </div>
      <div className="min-w-0">
        <VeilStatus kind={listing.side} hoursLeft={hoursLeft(listing.expiresAt)} />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ConstructionTradeBadge trade={listing.trade} />
          <span className="text-caption text-muted">{listing.jobType}</span>
        </div>
        <h3 className="vael-h4 mt-2">
          {listing.side === "in" ? "Available for construction work" : "Needs construction capability"}
        </h3>
        <CardMeta>
          @{listing.handle} · {listing.serviceArea} · {listing.availability}
        </CardMeta>
        <CardBody className="mt-2">
          {why.length
            ? why.map((item) => item.label).join(" · ")
            : "Limited overlap on Construction criteria."}
        </CardBody>
        {listing.requirements ? <p className="mt-2 text-body-sm text-muted">{listing.requirements}</p> : null}
        <CardFooter>
          {action ?? (
            <Link to={`/districts/contractor/board/${listing.id}`} className={buttonClassName({ size: "sm" })}>
              See Match
            </Link>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}
