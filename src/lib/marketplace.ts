/**
 * Presentation layer over the five district rankers.
 * Does not merge scoring tables or reuse Media & Technology weights.
 */

import { getActiveCmListing, rankCommercialMatches } from "./commercialStore";
import { getActiveCxListing, rankConstructionMatches } from "./constructionStore";
import { districts } from "./districts";
import { getOnboardingDraft } from "./onboarding";
import { getActiveRxListing, placeLabel, rankResidentialMatches } from "./residentialStore";
import { getActiveTxListing, laneLabel, rankTruckingMatches } from "./truckingStore";
import {
  EXPIRING_HOURS,
  getActiveListing,
  rankMatches,
  type VaelDistrictId,
  type VaelListing,
} from "./vaelStore";

export type MarketplaceDistrictId = VaelDistrictId;

export type MarketplaceFilter =
  | "recommended"
  | "all"
  | MarketplaceDistrictId;

export type MarketplaceChipId = "90+" | "available-now" | "remote" | "new";

export type MarketplaceMatch = {
  districtId: MarketplaceDistrictId;
  listingId: string;
  percent: number;
  title: string;
  districtLabel: string;
  locationLine: string;
  chips: string[];
  whyMatch: string[];
  href: string;
  isNew: boolean;
  isRemote: boolean;
  isAvailableNow: boolean;
};

const DISTRICT_IDS: MarketplaceDistrictId[] = [
  "media-technology",
  "construction",
  "trucking",
  "residential",
  "commercial",
];

const WHY_CAP = 3;
const IMMEDIATE = /\b(this cycle|today|now|available)\b/i;

const DETAIL_HREF: Record<MarketplaceDistrictId, (id: string) => string> = {
  "media-technology": (id) => `/media-technology/board/${id}`,
  construction: (id) => `/districts/contractor/board/${id}`,
  trucking: (id) => `/districts/trucking/board/${id}`,
  residential: (id) => `/districts/residential/board/${id}`,
  commercial: (id) => `/districts/commercial/board/${id}`,
};

const VAEL_HREF: Record<MarketplaceDistrictId, string> = {
  "media-technology": "/media-technology/vael?create=1",
  construction: "/districts/contractor/vael",
  trucking: "/districts/trucking/vael",
  residential: "/districts/residential/vael",
  commercial: "/districts/commercial/vael",
};

export function isMarketplaceDistrict(value: string): value is MarketplaceDistrictId {
  return DISTRICT_IDS.includes(value as MarketplaceDistrictId);
}

export function parseMarketplaceFilter(value: string | null | undefined): MarketplaceFilter {
  if (!value || value === "recommended") return "recommended";
  if (value === "all") return "all";
  if (isMarketplaceDistrict(value)) return value;
  return "recommended";
}

export function marketplaceHref(filter: MarketplaceFilter = "recommended"): string {
  if (filter === "recommended") return "/matches";
  return `/matches?district=${filter}`;
}

export function districtLabel(districtId: MarketplaceDistrictId): string {
  return districts.find((item) => item.id === districtId)?.name ?? districtId;
}

export function vaelRouteForDistrict(districtId: MarketplaceDistrictId): string {
  return VAEL_HREF[districtId];
}

export function setAvailabilityHref(handle: string): string {
  const home = getOnboardingDraft(handle)?.districtId;
  if (home && isMarketplaceDistrict(home)) return vaelRouteForDistrict(home);
  return VAEL_HREF["media-technology"];
}

export function isImmediateAvailability(text: string): boolean {
  return IMMEDIATE.test(text.trim());
}

export function isNewListing(createdAt: string, now = Date.now()): boolean {
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return false;
  return now - created >= 0 && now - created <= EXPIRING_HOURS * 60 * 60 * 1000;
}

export function matchesMarketplaceChip(match: MarketplaceMatch, chip: MarketplaceChipId): boolean {
  if (chip === "90+") return match.percent >= 90;
  if (chip === "available-now") return match.isAvailableNow;
  if (chip === "remote") return match.isRemote;
  return match.isNew;
}

export function applyMarketplaceChips(
  matches: MarketplaceMatch[],
  chips: readonly MarketplaceChipId[],
): MarketplaceMatch[] {
  if (chips.length === 0) return matches;
  return matches.filter((match) => chips.every((chip) => matchesMarketplaceChip(match, chip)));
}

export function showRemoteChip(filter: MarketplaceFilter): boolean {
  return filter === "recommended" || filter === "all" || filter === "media-technology";
}

export function vaeledDistrictIds(handle: string): MarketplaceDistrictId[] {
  const ids: MarketplaceDistrictId[] = [];
  if (getActiveListing(handle)) ids.push("media-technology");
  if (getActiveCxListing(handle)) ids.push("construction");
  if (getActiveTxListing(handle)) ids.push("trucking");
  if (getActiveRxListing(handle)) ids.push("residential");
  if (getActiveCmListing(handle)) ids.push("commercial");
  return ids;
}

function remoteLabel(value: VaelListing["remoteOnsite"]): string {
  if (value === "remote") return "Remote";
  if (value === "onsite") return "On-site";
  return "Hybrid";
}

function composeLocationLine(parts: Array<string | false | undefined>): string {
  return parts.map((part) => (typeof part === "string" ? part.trim() : "")).filter(Boolean).join(" · ");
}

function normLabel(value: string) {
  return value.trim().toLowerCase();
}

export function overlapLabels(a: string[], b: string[], cap = WHY_CAP): string[] {
  const wanted = new Set(b.map(normLabel).filter(Boolean));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of a) {
    const key = normLabel(item);
    if (!key || !wanted.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
    if (out.length >= cap) return out;
  }
  return out;
}

export function opportunityTitle(category?: string, discipline?: string) {
  const role = (category || discipline || "").trim();
  if (!role) return "Opportunity";
  if (/opportunity$/i.test(role)) return role;
  return `${role} Opportunity`;
}

function whyOverlap(primaryMine: string[], primaryTheirs: string[], extraMine: string[] = [], extraTheirs: string[] = []) {
  const first = overlapLabels(primaryMine, primaryTheirs);
  if (first.length >= WHY_CAP) return first;
  const extra = overlapLabels(extraMine, extraTheirs).filter(
    (item) => !first.some((existing) => normLabel(existing) === normLabel(item)),
  );
  return [...first, ...extra].slice(0, WHY_CAP);
}

export function sortMarketplace(matches: MarketplaceMatch[], homeDistrictId?: string): MarketplaceMatch[] {
  return [...matches].sort((a, b) => {
    if (b.percent !== a.percent) return b.percent - a.percent;
    if (homeDistrictId) {
      const aHome = a.districtId === homeDistrictId ? 1 : 0;
      const bHome = b.districtId === homeDistrictId ? 1 : 0;
      if (bHome !== aHome) return bHome - aHome;
    }
    return a.listingId.localeCompare(b.listingId);
  });
}

export function collectForDistrict(handle: string, districtId: MarketplaceDistrictId): MarketplaceMatch[] {
  if (districtId === "media-technology") {
    const mine = getActiveListing(handle);
    if (!mine) return [];
    return rankMatches(mine).map((match) => {
      const availableNow = isImmediateAvailability(match.listing.timing);
      const remote = match.listing.remoteOnsite === "remote";
      return {
        districtId,
        listingId: match.listing.id,
        percent: match.percent,
        title: opportunityTitle(match.listing.category, match.listing.discipline),
        districtLabel: districtLabel(districtId),
        locationLine: composeLocationLine([
          remoteLabel(match.listing.remoteOnsite),
          availableNow && "Available Now",
          !remote && match.listing.location,
        ]),
        chips: match.listing.skills,
        whyMatch: whyOverlap(mine.skills, match.listing.skills, mine.tools, match.listing.tools),
        href: DETAIL_HREF[districtId](match.listing.id),
        isNew: isNewListing(match.listing.createdAt),
        isRemote: remote,
        isAvailableNow: availableNow,
      };
    });
  }

  if (districtId === "construction") {
    const mine = getActiveCxListing(handle);
    if (!mine) return [];
    return rankConstructionMatches(mine).map((match) => {
      const availableNow = isImmediateAvailability(match.listing.availability);
      return {
        districtId,
        listingId: match.listing.id,
        percent: match.percent,
        title: match.listing.trade || match.listing.jobType || "Opportunity",
        districtLabel: districtLabel(districtId),
        locationLine: composeLocationLine([
          match.listing.serviceArea,
          availableNow && "Available Now",
        ]),
        chips: match.listing.capabilities,
        whyMatch: whyOverlap(mine.capabilities, match.listing.capabilities),
        href: DETAIL_HREF[districtId](match.listing.id),
        isNew: isNewListing(match.listing.createdAt),
        isRemote: false,
        isAvailableNow: availableNow,
      };
    });
  }

  if (districtId === "trucking") {
    const mine = getActiveTxListing(handle);
    if (!mine) return [];
    return rankTruckingMatches(mine).map((match) => {
      const availableNow = isImmediateAvailability(match.listing.availability);
      return {
        districtId,
        listingId: match.listing.id,
        percent: match.percent,
        title: laneLabel(match.listing.origin, match.listing.destination),
        districtLabel: districtLabel(districtId),
        locationLine: composeLocationLine([
          match.listing.equipment,
          availableNow && "Available Now",
        ]),
        chips: [match.listing.equipment, ...match.listing.capabilities].filter(Boolean),
        whyMatch: whyOverlap(
          [mine.equipment, ...mine.capabilities].filter(Boolean),
          [match.listing.equipment, ...match.listing.capabilities].filter(Boolean),
        ),
        href: DETAIL_HREF[districtId](match.listing.id),
        isNew: isNewListing(match.listing.createdAt),
        isRemote: false,
        isAvailableNow: availableNow,
      };
    });
  }

  if (districtId === "residential") {
    const mine = getActiveRxListing(handle);
    if (!mine) return [];
    return rankResidentialMatches(mine).map((match) => {
      const availableNow = isImmediateAvailability(match.listing.availability);
      return {
        districtId,
        listingId: match.listing.id,
        percent: match.percent,
        title: match.listing.service || "Opportunity",
        districtLabel: districtLabel(districtId),
        locationLine: composeLocationLine([
          placeLabel(match.listing.area, match.listing.postalCode),
          availableNow && "Available Now",
        ]),
        chips: match.listing.capabilities,
        whyMatch: whyOverlap(mine.capabilities, match.listing.capabilities),
        href: DETAIL_HREF[districtId](match.listing.id),
        isNew: isNewListing(match.listing.createdAt),
        isRemote: false,
        isAvailableNow: availableNow,
      };
    });
  }

  const mine = getActiveCmListing(handle);
  if (!mine) return [];
  return rankCommercialMatches(mine).map((match) => {
    const availableNow = isImmediateAvailability(match.listing.availability);
    return {
      districtId,
      listingId: match.listing.id,
      percent: match.percent,
      title: match.listing.capability || "Opportunity",
      districtLabel: districtLabel(districtId),
      locationLine: composeLocationLine([
        match.listing.area,
        availableNow && "Available Now",
      ]),
      chips: match.listing.capabilities,
      whyMatch: whyOverlap(mine.capabilities, match.listing.capabilities),
      href: DETAIL_HREF[districtId](match.listing.id),
      isNew: isNewListing(match.listing.createdAt),
      isRemote: false,
      isAvailableNow: availableNow,
    };
  });
}

export function collectRecommended(handle: string, homeDistrictId?: string): MarketplaceMatch[] {
  const home = homeDistrictId ?? getOnboardingDraft(handle)?.districtId;
  const matches = vaeledDistrictIds(handle).flatMap((id) => collectForDistrict(handle, id));
  return sortMarketplace(matches, home);
}

export function collectMarketplace(
  handle: string,
  filter: MarketplaceFilter,
  homeDistrictId?: string,
): MarketplaceMatch[] {
  if (filter === "recommended" || filter === "all") {
    return collectRecommended(handle, homeDistrictId);
  }
  return collectForDistrict(handle, filter);
}
