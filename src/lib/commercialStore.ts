/**
 * Local prototype store for Commercial.
 * Separate keys from Media & Technology, Construction, Trucking, Residential.
 * Handshake/messages reuse vaelStore with district: "commercial".
 * No maps, no procurement engine, nothing sent to Supabase.
 */

import { scoreCommercialMatch, type CommercialMatchable } from "./commercialMatching";
import { DEFAULT_DURATION_HOURS, EXPIRING_HOURS, hoursLeft, type VaelSide } from "./vaelStore";

const KEYS = {
  listings: "cm_mock_listings_v1",
  profiles: "cm_mock_profiles_v1",
  documents: "cm_mock_documents_v1",
  seeded: "cm_mock_core_seeded_v1",
} as const;

export type CommercialListing = {
  id: string;
  handle: string;
  side: VaelSide;
  capability: string;
  /** What the work is for. Displayed. Included in completeness. Not a scored column of its own. */
  context: string;
  area: string;
  availability: string;
  capabilities: string[];
  experienceYears: number;
  credentials: string[];
  description: string;
  requirements: string;
  contact: string;
  /** Local-only extra scope. Not scored. Not a procurement field. */
  scopeNote: string;
  createdAt: string;
  expiresAt: string;
  plan: "daily";
};

export type CommercialProfile = {
  handle: string;
  displayName: string;
  profileType: "individual" | "company";
  headline: string;
  about: string;
  capability: string;
  area: string;
  capabilities: string[];
  experience: string;
  credentials: string[];
  rates: string;
  history: { label: string; url: string }[];
  sample?: boolean;
};

export type CommercialDocument = {
  id: string;
  handle: string;
  type: "license" | "insurance" | "capability";
  title: string;
  publicFlag: boolean;
  dataUrl?: string;
};

/**
 * Kit starter — business capability categories, not Residential home services
 * and not Construction trades. Owner may replace. Not a locked taxonomy.
 */
export const CM_CAPABILITIES = [
  "Facilities",
  "Operations",
  "Professional services",
  "Technology",
  "Maintenance",
  "Other",
] as const;

export const CM_TIMING = ["This cycle", "Next two weeks", "Flexible"] as const;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeCommercial(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600000).toISOString();
}

export function isCmVisible(listing: CommercialListing) {
  return Date.parse(listing.expiresAt) > Date.now();
}

export function cmCompleteness(
  listing: Omit<CommercialListing, "id" | "createdAt" | "expiresAt" | "plan"> | CommercialListing,
) {
  const checks = [
    listing.capability,
    listing.context,
    listing.area,
    listing.availability,
    listing.description,
    listing.requirements,
  ];
  const hit = checks.filter(Boolean).length;
  return hit / checks.length;
}

export function toCommercialMatchable(listing: CommercialListing): CommercialMatchable {
  return {
    capability: listing.capability,
    area: listing.area,
    availability: listing.availability,
    requirements: listing.requirements,
    capabilities: listing.capabilities,
    experienceYears: listing.experienceYears,
    credentials: listing.credentials,
    completeness: cmCompleteness(listing),
  };
}

export function cmVeilKind(listing: CommercialListing | undefined) {
  if (!listing) return "none" as const;
  if (!isCmVisible(listing)) return "expired" as const;
  if (hoursLeft(listing.expiresAt) <= EXPIRING_HOURS) return "expiring" as const;
  return listing.side;
}

function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;
  const now = new Date().toISOString();
  const listings: CommercialListing[] = [
    {
      id: "cm_northyard",
      handle: "northyard",
      side: "in",
      capability: "Facilities",
      context: "Multi-site facilities support",
      area: "Atlanta",
      availability: "This cycle",
      capabilities: ["Sites", "Vendors"],
      experienceYears: 12,
      credentials: [],
      description: "Available for commercial facilities work in Atlanta this cycle.",
      requirements: "On-site facilities support",
      contact: "",
      scopeNote: "",
      createdAt: now,
      expiresAt: hoursFromNow(20),
      plan: "daily",
    },
    {
      id: "cm_ledgerwell",
      handle: "ledgerwell",
      side: "in",
      capability: "Professional services",
      context: "Accounting operations",
      area: "Atlanta",
      availability: "Next two weeks",
      capabilities: ["Books", "Close"],
      experienceYears: 9,
      credentials: [],
      description: "Available for commercial professional services in Atlanta.",
      requirements: "Business operations support",
      contact: "",
      scopeNote: "",
      createdAt: now,
      expiresAt: hoursFromNow(20),
      plan: "daily",
    },
  ];
  const profiles: CommercialProfile[] = [
    {
      handle: "northyard",
      displayName: "North Yard",
      profileType: "company",
      headline: "Facilities · Atlanta",
      about: "Sample Commercial company on this device only.",
      capability: "Facilities",
      area: "Atlanta",
      capabilities: ["Sites", "Vendors"],
      experience: "Twelve years on this sample record.",
      credentials: [],
      rates: "Discussed after Handshake.",
      history: [{ label: "Recent site work", url: "https://example.com/northyard" }],
      sample: true,
    },
    {
      handle: "ledgerwell",
      displayName: "Ledgerwell",
      profileType: "company",
      headline: "Professional services · Atlanta",
      about: "Sample Commercial company on this device only.",
      capability: "Professional services",
      area: "Atlanta",
      capabilities: ["Books", "Close"],
      experience: "Nine years on this sample record.",
      credentials: [],
      rates: "Scope after Handshake.",
      history: [],
      sample: true,
    },
  ];
  write(KEYS.listings, listings);
  write(KEYS.profiles, profiles);
  write(KEYS.documents, [
    {
      id: "cmdoc_ny_ins",
      handle: "northyard",
      type: "insurance",
      title: "Insurance document (sample label)",
      publicFlag: false,
    },
    {
      id: "cmdoc_ny_cap",
      handle: "northyard",
      type: "capability",
      title: "Capability statement (sample label)",
      publicFlag: false,
    },
  ] satisfies CommercialDocument[]);
  localStorage.setItem(KEYS.seeded, "1");
}

seedIfNeeded();

export function getCmListings(): CommercialListing[] {
  return read<CommercialListing[]>(KEYS.listings, []);
}

export function getVisibleCmListings() {
  return getCmListings().filter(isCmVisible);
}

export function getCmListing(id: string) {
  return getCmListings().find((item) => item.id === id);
}

export function getActiveCmListing(handle: string) {
  return getVisibleCmListings()
    .filter((item) => item.handle === handle)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function getLatestCmListing(handle: string) {
  return getCmListings()
    .filter((item) => item.handle === handle)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function getCmProfiles(): CommercialProfile[] {
  return read<CommercialProfile[]>(KEYS.profiles, []);
}

export function getCmProfile(handle: string) {
  return getCmProfiles().find((item) => item.handle === handle);
}

export function ensureCmProfile(handle: string): CommercialProfile {
  const existing = getCmProfile(handle);
  if (existing) return existing;
  const created: CommercialProfile = {
    handle,
    displayName: handle,
    profileType: "company",
    headline: "",
    about: "",
    capability: "",
    area: "",
    capabilities: [],
    experience: "",
    credentials: [],
    rates: "",
    history: [],
  };
  write(KEYS.profiles, [...getCmProfiles(), created]);
  return created;
}

export function saveCmProfile(next: CommercialProfile) {
  const all = getCmProfiles();
  const exists = all.some((item) => item.handle === next.handle);
  write(KEYS.profiles, exists ? all.map((item) => (item.handle === next.handle ? next : item)) : [...all, next]);
}

export function getCmDocuments(handle: string) {
  return read<CommercialDocument[]>(KEYS.documents, []).filter((item) => item.handle === handle);
}

export function addCmDocument(doc: Omit<CommercialDocument, "id">) {
  const next: CommercialDocument = { ...doc, id: id("cmdoc") };
  write(KEYS.documents, [...read<CommercialDocument[]>(KEYS.documents, []), next]);
  return next;
}

export function publishCmListing(input: Omit<CommercialListing, "id" | "createdAt" | "expiresAt" | "plan">) {
  const listings = getCmListings().map((item) =>
    item.handle === input.handle && isCmVisible(item) ? { ...item, expiresAt: new Date().toISOString() } : item,
  );
  const listing: CommercialListing = {
    ...input,
    id: id("cmvael"),
    createdAt: new Date().toISOString(),
    expiresAt: hoursFromNow(DEFAULT_DURATION_HOURS),
    plan: "daily",
  };
  write(KEYS.listings, [...listings, listing]);
  hydrateCmProfile(listing);
  return listing;
}

function hydrateCmProfile(listing: CommercialListing) {
  const profile = ensureCmProfile(listing.handle);
  saveCmProfile({
    ...profile,
    capability: profile.capability || listing.capability,
    area: profile.area || listing.area,
    capabilities: profile.capabilities.length ? profile.capabilities : listing.capabilities,
    headline:
      profile.headline ||
      (listing.side === "in" ? `${listing.capability} · ${listing.area}` : `Needs ${listing.capability} · ${listing.area}`),
  });
}

export function expireOwnCmListing(handle: string) {
  write(
    KEYS.listings,
    getCmListings().map((item) =>
      item.handle === handle && isCmVisible(item) ? { ...item, expiresAt: new Date().toISOString() } : item,
    ),
  );
}

export type RankedCommercialMatch = {
  listing: CommercialListing;
  percent: number;
  breakdown: ReturnType<typeof scoreCommercialMatch>["breakdown"];
};

export function rankCommercialMatches(mine: CommercialListing): RankedCommercialMatch[] {
  const opposite: VaelSide = mine.side === "in" ? "out" : "in";
  return getVisibleCmListings()
    .filter((item) => item.side === opposite && item.handle !== mine.handle)
    .map((listing) => {
      const need = mine.side === "out" ? mine : listing;
      const provider = mine.side === "in" ? mine : listing;
      const scored = scoreCommercialMatch(toCommercialMatchable(need), toCommercialMatchable(provider));
      return { listing, percent: scored.percent, breakdown: scored.breakdown };
    })
    .sort((a, b) => b.percent - a.percent);
}

export { DEFAULT_DURATION_HOURS, hoursLeft };
