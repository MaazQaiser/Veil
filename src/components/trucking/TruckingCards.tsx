import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardFooter, CardMeta } from "@/components/ui/card";
import { MatchPercent } from "@/components/vael/match";
import { VaelStatus } from "@/components/vael/status";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { hoursLeft, laneLabel, type RankedTruckingMatch } from "@/lib/truckingStore";
import type { TruckingRelevance } from "@/lib/truckingMatching";

export function EquipmentBadge({ equipment }: { equipment: string }) {
  return <Badge tone="outline">{equipment}</Badge>;
}

export function RouteSummary({ origin, destination }: { origin: string; destination: string }) {
  return (
    <Card>
      <p className="vael-kicker">Route</p>
      <p className="vael-h4 mt-2">{laneLabel(origin, destination)}</p>
      <CardMeta className="mt-1">
        {origin || "Origin not listed"} · {destination || "Destination not listed"}
      </CardMeta>
    </Card>
  );
}

export function AvailabilitySummary({ availability, pickupNote, deliveryNote }: { availability: string; pickupNote?: string; deliveryNote?: string }) {
  return (
    <Card>
      <p className="vael-kicker">Availability</p>
      <p className="vael-h4 mt-2">{availability || "Not listed"}</p>
      {(pickupNote || deliveryNote) ? (
        <CardMeta className="mt-1">
          {pickupNote ? `Pickup: ${pickupNote}` : null}
          {pickupNote && deliveryNote ? " · " : null}
          {deliveryNote ? `Delivery: ${deliveryNote}` : null}
        </CardMeta>
      ) : null}
    </Card>
  );
}

export function CapacitySummary({ capacity, side }: { capacity: string; side: "in" | "out" }) {
  return (
    <Card>
      <p className="vael-kicker">{side === "in" ? "Capacity" : "Load size"}</p>
      <p className="vael-h4 mt-2">{capacity || "Not listed"}</p>
    </Card>
  );
}

export function LoadSummary({
  side,
  description,
  equipment,
  capacity,
}: {
  side: "in" | "out";
  description: string;
  equipment: string;
  capacity: string;
}) {
  return (
    <Card>
      <p className="vael-kicker">{side === "in" ? "What is available" : "What is needed"}</p>
      <p className="vael-h4 mt-2">{side === "in" ? "Transportation capacity" : "Load / transportation need"}</p>
      <CardMeta className="mt-1">
        {equipment} · {capacity}
      </CardMeta>
      <CardBody className="mt-2">{description || "No description listed."}</CardBody>
    </Card>
  );
}

const relevanceCopy: Record<TruckingRelevance, string> = {
  relevant: "Relevant",
  partial: "Partial",
  missing: "Does not overlap",
  "not-listed": "Not listed",
};

export function TruckingMatchBreakdown({
  items,
}: {
  items: { label: string; relevance: TruckingRelevance }[];
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

export function TruckingRequirementCard({ body }: { body: string }) {
  return (
    <Card>
      <p className="vael-kicker">Requirements</p>
      <CardBody className="mt-2">{body || "None listed."}</CardBody>
    </Card>
  );
}

export function TruckingAvailabilityCard({
  side,
  hours,
  origin,
  destination,
  availability,
  equipment,
  capacity,
}: {
  side: "in" | "out" | "expiring" | "expired";
  hours?: number;
  origin: string;
  destination: string;
  availability: string;
  equipment: string;
  capacity: string;
}) {
  return (
    <Card>
      <VaelStatus kind={side} hoursLeft={hours} />
      <p className="vael-h4 mt-3">{side === "out" || side === "expired" ? "Needs someone" : "Available"}</p>
      <CardMeta className="mt-1">
        {laneLabel(origin, destination)} · {equipment} · {capacity} · {availability}
      </CardMeta>
    </Card>
  );
}

export function TruckingMatchCard({
  match,
  action,
}: {
  match: RankedTruckingMatch;
  action?: ReactNode;
}) {
  const listing = match.listing;
  const route = match.breakdown.find((item) => item.key === "origin" || item.key === "destination");
  const relevant = match.breakdown.filter((item) => item.applied && item.relevance === "relevant");
  return (
    <Card className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <div className="flex flex-col items-center">
        <MatchPercent value={match.percent} />
        <p className="mt-1 text-caption text-muted">{match.percent}% match</p>
      </div>
      <div className="min-w-0">
        <VaelStatus kind={listing.side} hoursLeft={hoursLeft(listing.expiresAt)} />
        <p className="vael-h4 mt-2">{laneLabel(listing.origin, listing.destination)}</p>
        <CardMeta className="mt-1">
          {listing.availability} · {listing.capacity} · {listing.equipment}
        </CardMeta>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <EquipmentBadge equipment={listing.equipment} />
          <span className="text-caption text-muted">
            {listing.side === "in" ? "Capacity available" : "Load / need"}
          </span>
        </div>
        <h3 className="mt-2 text-body-sm">
          {listing.side === "in" ? "Has transportation capacity" : "Needs transportation"} · @{listing.handle}
        </h3>
        <CardBody className="mt-2">
          {relevant.length
            ? relevant
                .slice(0, 4)
                .map((item) => item.label)
                .join(" · ")
            : route
              ? "Limited overlap on this lane."
              : "Limited overlap on Trucking criteria."}
        </CardBody>
        {listing.description ? <p className="mt-2 text-body-sm text-muted">{listing.description}</p> : null}
        <CardFooter>
          {action ?? (
            <Link to={`/districts/trucking/board/${listing.id}`} className={buttonClassName({ size: "sm" })}>
              See Match
            </Link>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}
