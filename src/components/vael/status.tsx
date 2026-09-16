import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export type VaelKind = "in" | "out" | "expiring" | "expired";

const vaelCopy: Record<VaelKind, { label: string; hint: string; tone: "live" | "early" | "soon" | "muted" }> = {
  in: { label: "Vael In", hint: "Available now", tone: "live" },
  out: { label: "Vael Out", hint: "Needs someone", tone: "early" },
  expiring: { label: "Expiring", hint: "Visibility ending", tone: "soon" },
  expired: { label: "Expired", hint: "No longer visible", tone: "muted" },
};

export function VaelStatus({ kind, hoursLeft, className }: { kind: VaelKind; hoursLeft?: number; className?: string }) {
  const copy = vaelCopy[kind];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Badge tone={copy.tone}>{copy.label}</Badge>
      <span className="text-caption text-muted">
        {copy.hint}
        {typeof hoursLeft === "number" && kind !== "expired" ? ` · ${hoursLeft}h left` : ""}
      </span>
    </span>
  );
}

export type HandshakeKind = "request" | "pending" | "accepted" | "declined" | "connected" | "closed" | "blocked";

const handshakeCopy: Record<HandshakeKind, { label: string; hint: string; tone: "outline" | "soon" | "live" | "muted" | "early" }> = {
  request: { label: "Request", hint: "Not sent", tone: "outline" },
  pending: { label: "Pending", hint: "Waiting for both parties", tone: "soon" },
  accepted: { label: "Incoming", hint: "They asked to Handshake", tone: "early" },
  declined: { label: "Declined", hint: "Closed without connect", tone: "muted" },
  connected: { label: "Connected", hint: "Private room open", tone: "live" },
  closed: { label: "Closed", hint: "This Handshake ended", tone: "muted" },
  blocked: { label: "Blocked", hint: "This connection is blocked", tone: "muted" },
};

export function HandshakeStatus({ kind, className }: { kind: HandshakeKind; className?: string }) {
  const copy = handshakeCopy[kind];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Badge tone={copy.tone}>{copy.label}</Badge>
      <span className="text-caption text-muted">{copy.hint}</span>
    </span>
  );
}

export type DistrictLotStatus = "live" | "soon" | "early" | "future";

export function DistrictStatus({ status }: { status: DistrictLotStatus }) {
  if (status === "live") return <Badge tone="live">Live</Badge>;
  if (status === "early") return <Badge tone="early">Early Access</Badge>;
  if (status === "future") return <Badge tone="muted">Future</Badge>;
  return <Badge tone="soon">Coming Soon</Badge>;
}

export type VerificationKind = "unverified" | "pending" | "verified";

export function VerificationState({ kind }: { kind: VerificationKind }) {
  const map = {
    unverified: { tone: "muted" as const, label: "Unverified", hint: "Honest default until a workflow exists" },
    pending: { tone: "soon" as const, label: "Review pending", hint: "Documents submitted" },
    verified: { tone: "live" as const, label: "Verified", hint: "Identity reviewed" },
  };
  const copy = map[kind];
  return (
    <span className="inline-flex items-center gap-2">
      <Badge tone={copy.tone} aria-label={copy.label}>
        {copy.label}
      </Badge>
      <span className="text-caption text-muted">{copy.hint}</span>
    </span>
  );
}
