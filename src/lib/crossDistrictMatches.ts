/**
 * Cross-district cards for the Media & Technology "All Matches" page.
 *
 * Alex only has a real listing in Media & Technology, so there is no honest
 * Construction/Trucking/Residential/Commercial "match" the way MT matches work.
 * What IS real: each of those districts has its own sample people and its own
 * scoring engine (constructionMatching.ts, etc.). This scores Alex's actual MT
 * fields against them using each district's own engine — mapping only the
 * fields that have a genuine analog (location, timing/availability, years of
 * experience, skills-as-capabilities, overall profile completeness) and
 * leaving domain fields Alex has no data for (trade, origin/destination,
 * service, capability, credentials) blank rather than invented. A blank field
 * scores honestly low on that criterion instead of being faked.
 */

import { scoreConstructionMatch, type ConstructionMatchable } from "./constructionMatching";
import { scoreTruckingMatch, type TruckingMatchable } from "./truckingMatching";
import { scoreResidentialMatch, type ResidentialMatchable } from "./residentialMatching";
import { scoreCommercialMatch, type CommercialMatchable } from "./commercialMatching";
import { getVisibleCxListings, getCxProfile, toConstructionMatchable } from "./constructionStore";
import { getVisibleTxListings, getTxProfile, toTruckingMatchable } from "./truckingStore";
import { getVisibleRxListings, getRxProfile, toResidentialMatchable } from "./residentialStore";
import { getVisibleCmListings, getCmProfile, toCommercialMatchable } from "./commercialStore";
import { listingCompleteness, type VaelListing } from "./vaelStore";

export type CrossDistrictDistrictId = "construction" | "trucking" | "residential" | "commercial";

export type CrossDistrictMatch = {
  id: string;
  handle: string;
  districtId: CrossDistrictDistrictId;
  districtName: string;
  href: string;
  displayName: string;
  headline: string;
  description: string;
  percent: number;
  createdAt: string;
  expiresAt: string;
};

function alexShared(mine: VaelListing) {
  return {
    availability: mine.timing,
    capabilities: mine.skills,
    experienceYears: mine.experienceYears,
    completeness: listingCompleteness(mine),
  };
}

export function crossDistrictMatchesForAlex(mine: VaelListing): CrossDistrictMatch[] {
  const shared = alexShared(mine);
  const results: CrossDistrictMatch[] = [];

  const constructionMine: ConstructionMatchable = {
    trade: "",
    jobType: "",
    serviceArea: mine.location,
    credentials: [],
    ...shared,
  };
  getVisibleCxListings().forEach((listing) => {
    const scored = scoreConstructionMatch(toConstructionMatchable(listing), constructionMine);
    const profile = getCxProfile(listing.handle);
    results.push({
      id: listing.id,
      handle: listing.handle,
      districtId: "construction",
      districtName: "Construction",
      href: `/districts/contractor/board/${listing.id}`,
      displayName: profile?.displayName ?? `@${listing.handle}`,
      headline: profile?.headline || listing.trade,
      description: listing.description,
      percent: scored.percent,
      createdAt: listing.createdAt,
      expiresAt: listing.expiresAt,
    });
  });

  const truckingMine: TruckingMatchable = {
    origin: "",
    destination: "",
    equipment: "",
    capacity: "",
    ...shared,
  };
  getVisibleTxListings().forEach((listing) => {
    const scored = scoreTruckingMatch(toTruckingMatchable(listing), truckingMine);
    const profile = getTxProfile(listing.handle);
    results.push({
      id: listing.id,
      handle: listing.handle,
      districtId: "trucking",
      districtName: "Trucking",
      href: `/districts/trucking/board/${listing.id}`,
      displayName: profile?.displayName ?? `@${listing.handle}`,
      headline: profile?.headline || listing.equipment,
      description: listing.description,
      percent: scored.percent,
      createdAt: listing.createdAt,
      expiresAt: listing.expiresAt,
    });
  });

  const residentialMine: ResidentialMatchable = {
    service: "",
    area: mine.location,
    postalCode: "",
    credentials: [],
    ...shared,
  };
  getVisibleRxListings().forEach((listing) => {
    const scored = scoreResidentialMatch(toResidentialMatchable(listing), residentialMine);
    const profile = getRxProfile(listing.handle);
    results.push({
      id: listing.id,
      handle: listing.handle,
      districtId: "residential",
      districtName: "Residential",
      href: `/districts/residential/board/${listing.id}`,
      displayName: profile?.displayName ?? `@${listing.handle}`,
      headline: profile?.headline || listing.service,
      description: listing.description,
      percent: scored.percent,
      createdAt: listing.createdAt,
      expiresAt: listing.expiresAt,
    });
  });

  const commercialMine: CommercialMatchable = {
    capability: "",
    area: mine.location,
    requirements: "",
    credentials: [],
    ...shared,
  };
  getVisibleCmListings().forEach((listing) => {
    const scored = scoreCommercialMatch(toCommercialMatchable(listing), commercialMine);
    const profile = getCmProfile(listing.handle);
    results.push({
      id: listing.id,
      handle: listing.handle,
      districtId: "commercial",
      districtName: "Commercial",
      href: `/districts/commercial/board/${listing.id}`,
      displayName: profile?.displayName ?? `@${listing.handle}`,
      headline: profile?.headline || listing.capability,
      description: listing.description,
      percent: scored.percent,
      createdAt: listing.createdAt,
      expiresAt: listing.expiresAt,
    });
  });

  return results;
}
