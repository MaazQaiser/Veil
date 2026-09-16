import { Link } from "react-router-dom";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { VaelStatus } from "./status";
import {
  visibilityHours,
  visibilityKindFromListing,
  type VisibilityKind,
} from "@/lib/visibilityPlans";

const noneCopy = { label: "Not visible", hint: "No active VAEL on the Board" };

function vaelMainState(kind: VisibilityKind, side?: "in" | "out") {
  if (kind === "in" || (kind === "expiring" && side !== "out")) return "Available";
  if (kind === "out" || (kind === "expiring" && side === "out")) return "Needs someone";
  return "Not available";
}

function vaelStateLabel(kind: VisibilityKind) {
  if (kind === "in") return "Vael In";
  if (kind === "out") return "Vael Out";
  if (kind === "expiring") return "Ending";
  if (kind === "expired") return "Ended";
  return "Inactive";
}

export function VaelStatePanel({
  kind,
  hoursLeft,
  side,
  className,
}: {
  kind: VisibilityKind;
  hoursLeft?: number;
  side?: "in" | "out";
  className?: string;
}) {
  const active = kind === "in" || kind === "out" || kind === "expiring";
  return (
    <div className={cn("rounded-2xl px-6 py-6", active ? "bg-accent-muted" : "border border-border bg-surface", className)}>
      <p className="text-label font-medium text-accent">{vaelStateLabel(kind)}</p>
      <p
        className={cn(
          "mt-2 font-sans text-h2 font-semibold tracking-[-0.025em]",
          active ? "text-accent" : "text-foreground",
        )}
      >
        {vaelMainState(kind, side)}
      </p>
      {typeof hoursLeft === "number" && active ? (
        <p className="mt-2 text-body-sm text-muted">{hoursLeft}h left</p>
      ) : null}
    </div>
  );
}

/** Quiet status pill. `in` means available; `out` means looking for someone. */
export function AvailabilityPill({ side, className }: { side: "in" | "out"; className?: string }) {
  const available = side === "in";
  return (
    <Badge tone={available ? "live" : "default"} className={className}>
      <span className={cn("mr-2 size-1.5 rounded-full", available ? "bg-success" : "bg-accent")} aria-hidden />
      {available ? "Available" : "Needs someone"}
    </Badge>
  );
}

export function VisibilityStatus({
  kind,
  hoursLeft,
  className,
}: {
  kind: VisibilityKind;
  hoursLeft?: number;
  className?: string;
}) {
  if (kind === "none") {
    return (
      <span className={className}>
        <span className="inline-flex items-center gap-2">
          <Badge tone="muted">{noneCopy.label}</Badge>
          <span className="text-caption text-muted">{noneCopy.hint}</span>
        </span>
      </span>
    );
  }
  return <VaelStatus kind={kind} hoursLeft={hoursLeft} className={className} />;
}

export function VisibilityCard({
  district,
  listing,
  context,
  manageHref,
  boardHref,
}: {
  district: string;
  listing?: { side: "in" | "out"; expiresAt: string } | null;
  context?: string;
  manageHref: string;
  boardHref?: string;
}) {
  const kind = visibilityKindFromListing(listing);
  const hours = visibilityHours(listing ?? undefined);
  const intent =
    kind === "in"
      ? "Available"
      : kind === "out"
        ? "Needs someone"
        : kind === "expiring"
          ? listing?.side === "out"
            ? "Needs someone · ending"
            : "Available · ending"
          : kind === "expired"
            ? "Expired"
            : "Not visible";
  const action =
    kind === "none" ? "Set availability" : kind === "expired" ? "Vael In again" : "Manage availability";

  return (
    <Card className={kind === "in" || kind === "out" || kind === "expiring" ? "bg-accent-muted border-transparent shadow-none" : undefined}>
      <p className="text-label font-medium text-accent">{vaelStateLabel(kind)}</p>
      <p
        className={cn(
          "mt-2 font-sans text-h2 font-semibold tracking-[-0.025em]",
          kind === "in" || kind === "out" || kind === "expiring" ? "text-accent" : "text-foreground",
        )}
      >
        {vaelMainState(kind, listing?.side)}
      </p>
      {typeof hours === "number" && (kind === "in" || kind === "out" || kind === "expiring") ? (
        <p className="mt-2 text-body-sm text-muted">{hours}h left</p>
      ) : null}
      <p className="vael-h4 mt-4">{district}</p>
      <CardBody className="mt-1">
        {intent}
        {context ? ` · ${context}` : ""}
        {kind === "in" || kind === "out" || kind === "expiring"
          ? " · Free Daily VAEL (24 hours)"
          : kind === "expired"
            ? " · The previous 24-hour window has ended"
            : " · Vael In or Vael Out to appear on the Board"}
      </CardBody>
      <CardFooter>
        <Link
          to={
            action === "Set availability" && !manageHref.includes("create=")
              ? `${manageHref}${manageHref.includes("?") ? "&" : "?"}create=1`
              : manageHref
          }
          className={buttonClassName()}
        >
          {action}
        </Link>
        {boardHref ? (
          <Link to={boardHref} className={buttonClassName({ variant: "ghost" })}>
            Your matches
          </Link>
        ) : null}
      </CardFooter>
    </Card>
  );
}
