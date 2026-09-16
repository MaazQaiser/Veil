import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconChevronRight, IconHome } from "@/components/ui/icons";
import { primaryDistricts } from "@/lib/districts";
import { profileCompletion } from "@/lib/providerJourney";
import { useConstruction } from "@/lib/constructionCore";
import { useTrucking } from "@/lib/truckingCore";
import { useResidential } from "@/lib/residentialCore";
import { useCommercial } from "@/lib/commercialCore";
import { useVael } from "@/lib/vaelCore";
import { getManuallyJoinedDistrictIds, subscribeMyDistricts } from "@/lib/myDistricts";
import type { ProfileDocument, ProfileRecord } from "@/lib/vaelStore";

/** The four sibling districts share this exact profile shape — one checklist covers all of them. */
export function siblingCompletion(
  profile: { displayName: string; headline: string; about: string; capabilities: string[]; experience: string } | undefined,
) {
  if (!profile) return null;
  const checks = [
    Boolean(profile.displayName.trim()),
    Boolean(profile.headline.trim()),
    Boolean(profile.about.trim()),
    profile.capabilities.length > 0,
    Boolean(profile.experience.trim()),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/**
 * Districts the member has joined — either by Vaeling in/out at least once, or by
 * explicitly adding the district from Manage → Add District (before ever setting
 * availability there). The blank skeleton profile every signed-in account gets in
 * every district automatically does not by itself count. Shared by DistrictsRow,
 * the My Districts page, and the Home action-items gate.
 */
export function useJoinedDistricts(handle: string, mine: ProfileRecord | undefined, docs: ProfileDocument[]) {
  const construction = useConstruction();
  const trucking = useTrucking();
  const residential = useResidential();
  const commercial = useCommercial();
  const [, setTick] = useState(0);

  useEffect(() => subscribeMyDistricts(() => setTick((n) => n + 1)), []);

  const manual = new Set(getManuallyJoinedDistrictIds(handle));

  const vael = useVael();
  const percentByDistrictId: Record<string, number | null> = {
    "media-technology": mine
      ? profileCompletion(mine, docs, vael.latestListing?.side ?? "in").percent
      : manual.has("media-technology")
        ? 0
        : null,
    construction: construction.latestListing
      ? siblingCompletion(construction.profile(handle))
      : manual.has("construction")
        ? siblingCompletion(construction.profile(handle)) ?? 0
        : null,
    trucking: trucking.latestListing
      ? siblingCompletion(trucking.profile(handle))
      : manual.has("trucking")
        ? siblingCompletion(trucking.profile(handle)) ?? 0
        : null,
    residential: residential.latestListing
      ? siblingCompletion(residential.profile(handle))
      : manual.has("residential")
        ? siblingCompletion(residential.profile(handle)) ?? 0
        : null,
    commercial: commercial.latestListing
      ? siblingCompletion(commercial.profile(handle))
      : manual.has("commercial")
        ? siblingCompletion(commercial.profile(handle)) ?? 0
        : null,
  };

  return primaryDistricts
    .map((district) => ({ district, percent: percentByDistrictId[district.id] }))
    .filter((row): row is { district: (typeof primaryDistricts)[number]; percent: number } => row.percent !== null);
}

/**
 * "Your Districts" — one row, same shell as an Action item. See my districts → see
 * completion → manage a district's profile. No skills or requirements shown here;
 * those live inside each district once you're in it.
 */
export function DistrictsRow({
  handle,
  mine,
  docs,
}: {
  handle: string;
  mine: ProfileRecord | undefined;
  docs: ProfileDocument[];
}) {
  const joined = useJoinedDistricts(handle, mine, docs);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.06] dark:via-white/[0.02] dark:to-transparent dark:backdrop-blur-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFC555] text-[#0B0C0C] dark:bg-gradient-to-br dark:from-accent-hover dark:to-accent dark:text-[#1A1410] dark:shadow-[0_2px_4px_-1px_rgba(255,138,61,0.4),0_10px_22px_-8px_rgba(255,138,61,0.45)] dark:ring-1 dark:ring-inset dark:ring-white/25">
          <IconHome className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-body font-semibold text-foreground">Your Districts</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-muted">
            {joined.map(({ district, percent }) => (
              <Link
                key={district.id}
                to={`/media-technology/districts/${district.id}`}
                className="tabular-nums hover:text-foreground hover:underline"
              >
                {district.name} · {percent}%
              </Link>
            ))}
            <Link
              to="/media-technology/districts"
              className="font-medium text-[#C99A28] hover:text-foreground dark:text-accent"
            >
              + Add District
            </Link>
          </div>
        </div>
      </div>
      <Link
        to="/media-technology/districts"
        className="inline-flex h-10 shrink-0 items-center gap-1.5 self-start rounded-full bg-[#0B0C0C] px-5 text-body-sm font-medium text-white sm:self-auto dark:bg-gradient-to-r dark:from-accent-hover dark:to-accent dark:text-[#1A1410] dark:shadow-[0_2px_4px_-1px_rgba(255,138,61,0.4),0_10px_22px_-8px_rgba(255,138,61,0.45)] dark:ring-1 dark:ring-inset dark:ring-white/25"
      >
        Manage
        <IconChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
