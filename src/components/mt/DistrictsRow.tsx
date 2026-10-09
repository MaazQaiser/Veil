import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconHome } from "@/components/ui/icons";
import { primaryDistricts } from "@/lib/districts";
import { profileCompletion } from "@/lib/providerJourney";
import { useConstruction } from "@/lib/constructionCore";
import { useTrucking } from "@/lib/truckingCore";
import { useResidential } from "@/lib/residentialCore";
import { useCommercial } from "@/lib/commercialCore";
import { useVael } from "@/lib/vaelCore";
import { getActiveDistrictId, getDistrictHistory, subscribeMyDistricts } from "@/lib/myDistricts";
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
 * Completion for every primary district, plus which one the member is in.
 * A member can only be in one district at a time.
 */
export function useDistrictCards(handle: string, mine: ProfileRecord | undefined, docs: ProfileDocument[]) {
  const construction = useConstruction();
  const trucking = useTrucking();
  const residential = useResidential();
  const commercial = useCommercial();
  const vael = useVael();
  const [, setTick] = useState(0);

  useEffect(() => subscribeMyDistricts(() => setTick((n) => n + 1)), []);

  const storedActive = getActiveDistrictId(handle);
  const history = new Set(getDistrictHistory(handle));
  const percentByDistrictId: Record<string, number> = {
    "media-technology": mine ? profileCompletion(mine, docs, vael.latestListing?.side ?? "in").percent : 0,
    construction: siblingCompletion(construction.profile(handle)) ?? 0,
    trucking: siblingCompletion(trucking.profile(handle)) ?? 0,
    residential: siblingCompletion(residential.profile(handle)) ?? 0,
    commercial: siblingCompletion(commercial.profile(handle)) ?? 0,
  };

  const fallbackActive = mine || vael.latestListing ? "media-technology" : undefined;
  const activeId = storedActive ?? fallbackActive;

  return primaryDistricts.map((district) => {
    const percent = percentByDistrictId[district.id] ?? 0;
    const isActive = district.id === activeId;
    const hasVisited = history.has(district.id) || isActive || percent > 0;
    return { district, percent, isActive, hasVisited };
  });
}

/**
 * Districts the member is currently in — exactly one, after they join or switch.
 */
export function useJoinedDistricts(handle: string, mine: ProfileRecord | undefined, docs: ProfileDocument[]) {
  return useDistrictCards(handle, mine, docs)
    .filter((row) => row.isActive)
    .map(({ district, percent }) => ({ district, percent }));
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
  className,
}: {
  handle: string;
  mine: ProfileRecord | undefined;
  docs: ProfileDocument[];
  className?: string;
}) {
  const joined = useJoinedDistricts(handle, mine, docs);
  const primary = joined.find((row) => row.district.id === "media-technology") ?? joined[0];

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-8px_rgba(17,17,17,0.14)] dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:border-white/15 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.2),0_16px_36px_-12px_rgba(0,0,0,0.4)]${className ? ` ${className}` : ""}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFC555]/15 text-[#C99A28] dark:bg-accent/15 dark:text-accent">
          <IconHome className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-body font-semibold text-foreground">Your District</p>
          <p className="mt-0.5 truncate text-body-sm text-muted">
            {primary ? (
              <>
                {primary.district.name} · {primary.percent}%
              </>
            ) : (
              "No district yet"
            )}
          </p>
        </div>
      </div>
      <Link
        to="/media-technology/districts"
        className="shrink-0 text-body-sm font-medium text-[#C99A28] underline underline-offset-4 hover:text-foreground dark:text-accent"
      >
        Change district →
      </Link>
    </div>
  );
}
