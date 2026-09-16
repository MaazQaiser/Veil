import { useState } from "react";
import { Link } from "react-router-dom";
import { IconBookmark, IconChevronRight } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { districtBySlug } from "@/lib/districts";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { getProfile, type RankedMatch } from "@/lib/vaelStore";

const DISTRICT_NAME = districtBySlug("media-technology")?.name ?? "Media & Technology";

/**
 * Fit-first match card: circle photo, then an Available/Match tag row, then the
 * person's info, then a divider with Save + View Match. VAEL's own black-and-gold
 * branding. Still exactly: match %, person, role, district, availability, View
 * Match — no pricing, no posted-date, no job-board language.
 */
export function MatchDashboardCard({
  match,
  href,
  districtName = DISTRICT_NAME,
  nameOverride,
  roleOverride,
  onDistrictClick,
}: {
  match: {
    listing: Pick<RankedMatch["listing"], "id" | "handle" | "description"> &
      Partial<Pick<RankedMatch["listing"], "discipline" | "category">>;
    percent: number;
  };
  /** Defaults to the Media & Technology board route for a real VaelListing id. */
  href?: string;
  districtName?: string;
  /** Cross-district cards have their own profile store `getProfile` can't see — pass the real name/role directly. */
  nameOverride?: string;
  roleOverride?: string;
  /** When set, the district badge becomes its own control that filters to this district instead of opening the match. */
  onDistrictClick?: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const { listing } = match;
  const profile = nameOverride ? undefined : getProfile(listing.handle);
  const name = nameOverride ?? profile?.displayName ?? `@${listing.handle}`;
  const role = roleOverride ?? profile?.headline ?? listing.discipline ?? listing.category ?? "";
  const percent = Math.max(0, Math.min(100, Math.round(match.percent)));
  const initial = name.trim().charAt(0).toUpperCase() || "V";
  const image = profile?.avatarUrl || profile?.coverUrl;

  return (
    <Link
      to={href ?? `${PRODUCT_HOME}/board/${listing.id}`}
      className="group flex w-80 shrink-0 snap-start flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-10px_rgba(17,17,17,0.1)] motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:border-[#C99A28]/30 hover:shadow-[0_1px_2px_rgba(11,12,12,0.06),0_20px_36px_-12px_rgba(17,17,17,0.18)] dark:border-white/10 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.06] dark:via-white/[0.02] dark:to-transparent dark:backdrop-blur-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:border-accent/30 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.2),0_20px_40px_-12px_rgba(255,157,69,0.2)]"
    >
      {image ? (
        <img src={image} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFC555] text-body font-semibold text-[#0B0C0C] dark:bg-gradient-to-br dark:from-accent-hover dark:to-accent dark:text-[#1A1410] dark:shadow-[0_2px_4px_-1px_rgba(255,138,61,0.4),0_10px_22px_-8px_rgba(255,138,61,0.45)] dark:ring-1 dark:ring-inset dark:ring-white/25">
          {initial}
        </span>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {onDistrictClick ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDistrictClick();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 text-caption font-medium text-foreground motion-safe:transition-colors motion-safe:duration-150 hover:border-[#C99A28]/30 hover:text-[#C99A28] dark:hover:border-accent/30 dark:hover:text-accent"
          >
            {districtName}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 text-caption font-medium text-foreground">
            {districtName}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFC555]/15 px-3 py-1 text-caption font-semibold text-[#C99A28] dark:bg-[#4ADE80]/15 dark:text-[#4ADE80]">
          <span aria-hidden className="hidden dark:inline">
            ↑
          </span>
          {percent}% Match
        </span>
      </div>

      <div className="min-w-0">
        <p className="truncate text-body font-medium text-foreground">{name}</p>
        <p className="truncate text-body-sm text-muted">{role}</p>
        {listing.description ? (
          <p className="mt-1 line-clamp-1 text-body-sm text-quiet">{listing.description}</p>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
        <button
          type="button"
          aria-label={saved ? "Remove from saved" : "Save match"}
          aria-pressed={saved}
          onClick={(event) => {
            event.preventDefault();
            setSaved((value) => !value);
          }}
          className={cn(
            "flex items-center gap-1.5 text-body-sm font-medium motion-safe:transition-colors motion-safe:duration-150",
            saved ? "text-[#0B0C0C] dark:text-[#F5F3EE]" : "text-quiet hover:text-[#0B0C0C] dark:hover:text-[#F5F3EE]",
          )}
        >
          <IconBookmark className={cn("h-4 w-4", saved && "fill-current")} />
          {saved ? "Saved" : "Save"}
        </button>
        <span className="flex items-center gap-1 text-body-sm font-medium text-[#C99A28] motion-safe:transition-colors motion-safe:duration-150 group-hover:text-foreground dark:text-accent">
          View Match
          <IconChevronRight className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-150 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
