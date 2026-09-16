import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Shared profile-dashboard chrome — header, verification badges, stats row.
 * District pages (Construction, Trucking, Residential, Commercial, Media & Technology)
 * compose this with their own tabs/content so the layout only has to be built once.
 */

export function ProfileDashboardHeader({
  displayName,
  avatar,
  coverImage,
  handle,
  website,
  location,
  categoryBadge,
  verifications,
  availableNow,
  vaelScore,
  primaryAction,
}: {
  displayName: string;
  avatar?: string;
  coverImage?: string;
  handle: string;
  website?: string;
  location?: string;
  categoryBadge?: ReactNode;
  verifications: string[];
  availableNow: boolean;
  vaelScore: number;
  primaryAction?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div
        className="h-32 w-full bg-surface-muted"
        style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />
      <div className="bg-surface px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface-muted"
              style={avatar ? { backgroundImage: `url(${avatar})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            />
            <div>
              <h1 className="vael-h2">{displayName}</h1>
              {verifications.length ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {verifications.slice(0, 3).map((item) => (
                    <Badge key={item} tone="outline">
                      {item}
                    </Badge>
                  ))}
                  {verifications.length > 3 ? <Badge tone="muted">+{verifications.length - 3}</Badge> : null}
                </div>
              ) : (
                <p className="mt-2 text-caption text-muted">No verifications yet on this device.</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-muted">
                <span>@{handle}</span>
                {website ? <span>{website}</span> : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {location ? <span className="text-body-sm text-muted">{location}</span> : null}
                {categoryBadge}
              </div>
            </div>
          </div>
          {primaryAction}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Badge tone={availableNow ? "live" : "muted"}>{availableNow ? "Available now" : "Not available"}</Badge>
          <Badge tone="outline">{vaelScore} VAEL score</Badge>
        </div>
      </div>
    </div>
  );
}

export function ProfileStatsRow({ stats }: { stats: { label: string; value: number | string }[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-border bg-surface px-6 py-5">
          <p className="vael-kicker">{stat.label}</p>
          <p className="mt-2 vael-h3">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

export function ProfileEmptyTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      <p className="vael-h4">{title}</p>
      <p className="mt-2 text-body-sm text-muted">{description}</p>
    </div>
  );
}
