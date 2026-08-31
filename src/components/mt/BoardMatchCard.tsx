import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MatchPercent } from "@/components/vael/match";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AvailabilityPill } from "@/components/vael/visibility";
import type { RankedMatch } from "@/lib/vaelStore";
import { getProfile, hoursLeft } from "@/lib/vaelStore";

export function SkillChips({ skills, max = 4 }: { skills: string[]; max?: number }) {
  const shown = skills.slice(0, max);
  const extra = skills.length - shown.length;
  if (shown.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {shown.map((skill) => (
        <li key={skill}>
          <Badge tone="muted">{skill}</Badge>
        </li>
      ))}
      {extra > 0 ? (
        <li>
          <Badge tone="outline">+{extra}</Badge>
        </li>
      ) : null}
    </ul>
  );
}

export function BoardMatchCard({
  match,
  action,
}: {
  match: RankedMatch;
  action?: ReactNode;
}) {
  const profile = getProfile(match.listing.handle);
  const name = profile?.displayName ?? `@${match.listing.handle}`;
  const role = profile?.headline || match.listing.category || match.listing.discipline;
  const remote =
    match.listing.remoteOnsite === "remote"
      ? "Remote"
      : match.listing.remoteOnsite === "onsite"
        ? "On-site"
        : "Hybrid";
  const hours = hoursLeft(match.listing.expiresAt);
  const cover = profile?.coverUrl;

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0 md:p-0">
      {cover ? (
        <div className="h-28 overflow-hidden border-b border-border-subtle">
          <img src={cover} alt="" className="size-full object-cover saturate-[0.55]" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <AvailabilityPill side={match.listing.side} />
          <MatchPercent value={match.percent} size="sm" />
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={name} src={profile?.avatarUrl} size="lg" />
          <div className="min-w-0">
            <h3 className="vael-h4 truncate">{name}</h3>
            <p className="mt-0.5 truncate text-body-sm text-muted">{role}</p>
          </div>
        </div>
        <p className="line-clamp-2 text-body-sm">{match.listing.description}</p>
        <SkillChips skills={match.listing.skills} />
        <p className="mt-auto text-caption text-muted">
          {remote} · {match.listing.location}
          {typeof hours === "number" ? ` · ${hours}h left` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {action ?? (
            <Link to={`/media-technology/board/${match.listing.id}`} className={buttonClassName()}>
              View match
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Compact card for Professional Home — percent, role, district, availability. */
export function HomeMatchCard({ match }: { match: RankedMatch }) {
  const profile = getProfile(match.listing.handle);
  const role = profile?.headline || match.listing.discipline || match.listing.category || profile?.displayName;
  return (
    <Link to={`/media-technology/board/${match.listing.id}`} className="block h-full">
      <Card className="h-full">
        <p className="text-h3 font-semibold tracking-[-0.03em]">{Math.round(match.percent)}% Match</p>
        <p className="mt-4 text-body font-medium">{role}</p>
        <p className="mt-1 text-body-sm text-muted">Media & Technology</p>
        <p className="mt-1 text-body-sm">Available</p>
      </Card>
    </Link>
  );
}
