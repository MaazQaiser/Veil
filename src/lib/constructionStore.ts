/**
 * Local prototype store for Construction Exchange.
 * Separate keys from Media & Technology. Handshake/messages reuse vaelStore
 * with district: "construction". Nothing is sent to Supabase.
 */

import { scoreConstructionMatch, type ConstructionMatchable } from "./constructionMatching";
import {
  DEFAULT_DURATION_HOURS,
  EXPIRING_HOURS,
  hoursLeft,
  type VaelSide,
} from "./vaelStore";

const KEYS = {
  listings: "cx_mock_listings_v1",
  profiles: "cx_mock_profiles_v1",
  documents: "cx_mock_documents_v1",
  seeded: "cx_mock_core_seeded_v1",
} as const;

export type ConstructionListing = {
  id: string;
  handle: string;
  side: VaelSide;
  trade: string;
  jobType: string;
  capabilities: string[];
  serviceArea: string;
  availability: string;
  experienceYears: number;
  credentials: string[];
  insuranceNoted: boolean;
  description: string;
  requirements: string;
  contact: string;
  timeline: string;
  /** Local-only. Not scored. Not a payment field. */
  scopeNote: string;
  createdAt: string;
  expiresAt: string;
  plan: "daily";
};

export type ConstructionProfile = {
  handle: string;
  displayName: string;
  profileType: "individual" | "company";
  headline: string;
  about: string;
  trade: string;
  specialization: string;
  capabilities: string[];
  experience: string;
  serviceArea: string;
  credentials: string[];
  rates: string;
  portfolio: { label: string; url: string }[];
  sample?: boolean;
};

export type ConstructionDocument = {
  id: string;
  handle: string;
  type: "license" | "insurance" | "capability";
  title: string;
  publicFlag: boolean;
  dataUrl?: string;
};

/** Kit starter list — Owner may replace. Not a regulatory catalog. */
export const CX_TRADES = [
  "General",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Carpentry",
  "Concrete",
  "Sitework",
  "Finishes",
] as const;

/** Kit starter list — Owner may replace. */
export const CX_JOB_TYPES = ["Repair", "Renovation", "New work", "Tenant improvement", "Maintenance"] as const;

export const CX_AVAILABILITY = ["This cycle", "Next two weeks", "Flexible"] as const;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeConstruction(fn: Listener) {
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

export function isCxVisible(listing: ConstructionListing) {
  return Date.parse(listing.expiresAt) > Date.now();
}

export function cxCompleteness(listing: Omit<ConstructionListing, "id" | "createdAt" | "expiresAt" | "plan"> | ConstructionListing) {
  const checks = [
    listing.trade,
    listing.jobType,
    listing.capabilities.length,
    listing.serviceArea,
    listing.availability,
    listing.description,
    listing.experienceYears,
  ];
  const hit = checks.filter(Boolean).length;
  return hit / checks.length;
}

export function toConstructionMatchable(listing: ConstructionListing): ConstructionMatchable {
  const credentials = [...listing.credentials];
  if (listing.insuranceNoted && !credentials.some((item) => /insurance/i.test(item))) {
    credentials.push("Insurance on file");
  }
  return {
    trade: listing.trade,
    jobType: listing.jobType,
    capabilities: listing.capabilities,
    serviceArea: listing.serviceArea,
    availability: listing.availability,
    credentials,
    experienceYears: listing.experienceYears,
    completeness: cxCompleteness(listing),
  };
}

export function cxVeilKind(listing: ConstructionListing | undefined) {
  if (!listing) return "none" as const;
  if (!isCxVisible(listing)) return "expired" as const;
  if (hoursLeft(listing.expiresAt) <= EXPIRING_HOURS) return "expiring" as const;
  return listing.side;
}

function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;
  const now = new Date().toISOString();
  const listings: ConstructionListing[] = [
    {
      id: "cx_ridgeworks",
      handle: "ridgeworks",
      side: "in",
      trade: "Electrical",
      jobType: "Renovation",
      capabilities: ["Panel", "Lighting", "Service"],
      serviceArea: "Atlanta",
      availability: "This cycle",
      experienceYears: 12,
      credentials: ["Trade license on file"],
      insuranceNoted: true,
      description: "Electrical crew available this cycle for renovation work.",
      requirements: "Onsite. Service area Atlanta.",
      contact: "",
      timeline: "This cycle",
      scopeNote: "",
      createdAt: now,
      expiresAt: hoursFromNow(20),
      plan: "daily",
    },
    {
      id: "cx_lotnorth",
      handle: "lotnorth",
      side: "out",
      trade: "Electrical",
      jobType: "Renovation",
      capabilities: ["Panel", "Lighting"],
      serviceArea: "Atlanta",
      availability: "This cycle",
      experienceYears: 8,
      credentials: ["Trade license on file"],
      insuranceNoted: true,
      description: "Renovation needs electrical capability this cycle.",
      requirements: "Licensed electrical. Atlanta service area.",
      contact: "",
      timeline: "This cycle",
      scopeNote: "",
      createdAt: now,
      expiresAt: hoursFromNow(20),
      plan: "daily",
    },
  ];
  const profiles: ConstructionProfile[] = [
    {
      handle: "ridgeworks",
      displayName: "Ridgeworks",
      profileType: "company",
      headline: "Electrical · renovation · Atlanta",
      about: "Sample Construction company profile on this device only.",
      trade: "Electrical",
      specialization: "Renovation electrical",
      capabilities: ["Panel", "Lighting", "Service"],
      experience: "Twelve years on this sample record.",
      serviceArea: "Atlanta",
      credentials: ["Trade license on file"],
      rates: "Discussed after Handshake.",
      portfolio: [{ label: "Recent work", url: "https://example.com/ridgeworks" }],
      sample: true,
    },
    {
      handle: "lotnorth",
      displayName: "Lot North",
      profileType: "company",
      headline: "Needs electrical for renovation",
      about: "Sample project need on this device only.",
      trade: "Electrical",
      specialization: "Renovation",
      capabilities: ["Panel", "Lighting"],
      experience: "",
      serviceArea: "Atlanta",
      credentials: ["Trade license on file"],
      rates: "Scope after Handshake.",
      portfolio: [],
      sample: true,
    },
  ];
  write(KEYS.listings, listings);
  write(KEYS.profiles, profiles);
  write(KEYS.documents, [
    {
      id: "cxdoc_ridge_license",
      handle: "ridgeworks",
      type: "license",
      title: "Trade license (sample label)",
      publicFlag: false,
    },
    {
      id: "cxdoc_ridge_ins",
      handle: "ridgeworks",
      type: "insurance",
      title: "Insurance document (sample label)",
      publicFlag: false,
    },
  ] satisfies ConstructionDocument[]);
  localStorage.setItem(KEYS.seeded, "1");
}

seedIfNeeded();

export function getCxListings(): ConstructionListing[] {
  return read<ConstructionListing[]>(KEYS.listings, []);
}

export function getVisibleCxListings() {
  return getCxListings().filter(isCxVisible);
}

export function getCxListing(id: string) {
  return getCxListings().find((item) => item.id === id);
}

export function getActiveCxListing(handle: string) {
  return getVisibleCxListings()
    .filter((item) => item.handle === handle)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function getLatestCxListing(handle: string) {
  return getCxListings()
    .filter((item) => item.handle === handle)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function getCxProfiles(): ConstructionProfile[] {
  return read<ConstructionProfile[]>(KEYS.profiles, []);
}

export function getCxProfile(handle: string) {
  return getCxProfiles().find((item) => item.handle === handle);
}

export function ensureCxProfile(handle: string): ConstructionProfile {
  const existing = getCxProfile(handle);
  if (existing) return existing;
  const created: ConstructionProfile = {
    handle,
    displayName: handle,
    profileType: "individual",
    headline: "",
    about: "",
    trade: "",
    specialization: "",
    capabilities: [],
    experience: "",
    serviceArea: "",
    credentials: [],
    rates: "",
    portfolio: [],
  };
  write(KEYS.profiles, [...getCxProfiles(), created]);
  return created;
}

export function saveCxProfile(next: ConstructionProfile) {
  const all = getCxProfiles();
  const exists = all.some((item) => item.handle === next.handle);
  write(KEYS.profiles, exists ? all.map((item) => (item.handle === next.handle ? next : item)) : [...all, next]);
}

export function getCxDocuments(handle: string) {
  return read<ConstructionDocument[]>(KEYS.documents, []).filter((item) => item.handle === handle);
}

export function addCxDocument(doc: Omit<ConstructionDocument, "id">) {
  const next: ConstructionDocument = { ...doc, id: id("cxdoc") };
  write(KEYS.documents, [...read<ConstructionDocument[]>(KEYS.documents, []), next]);
  return next;
}

export function publishCxListing(input: Omit<ConstructionListing, "id" | "createdAt" | "expiresAt" | "plan">) {
  const listings = getCxListings().map((item) =>
    item.handle === input.handle && isCxVisible(item) ? { ...item, expiresAt: new Date().toISOString() } : item,
  );
  const listing: ConstructionListing = {
    ...input,
    id: id("cxvael"),
    createdAt: new Date().toISOString(),
    expiresAt: hoursFromNow(DEFAULT_DURATION_HOURS),
    plan: "daily",
  };
  write(KEYS.listings, [...listings, listing]);
  hydrateCxProfile(listing);
  return listing;
}

function hydrateCxProfile(listing: ConstructionListing) {
  const profile = ensureCxProfile(listing.handle);
  saveCxProfile({
    ...profile,
    serviceArea: profile.serviceArea || listing.serviceArea,
    trade: profile.trade || listing.trade,
    capabilities: profile.capabilities.length ? profile.capabilities : listing.capabilities,
    credentials: profile.credentials.length ? profile.credentials : listing.credentials,
    headline:
      profile.headline ||
      (listing.side === "in"
        ? `Available · ${listing.trade} · ${listing.jobType}`
        : `Needs ${listing.trade} · ${listing.jobType}`),
  });
}

export function expireOwnCxListing(handle: string) {
  write(
    KEYS.listings,
    getCxListings().map((item) =>
      item.handle === handle && isCxVisible(item) ? { ...item, expiresAt: new Date().toISOString() } : item,
    ),
  );
}

export type RankedConstructionMatch = {
  listing: ConstructionListing;
  percent: number;
  breakdown: ReturnType<typeof scoreConstructionMatch>["breakdown"];
};

export function rankConstructionMatches(mine: ConstructionListing): RankedConstructionMatch[] {
  const opposite: VaelSide = mine.side === "in" ? "out" : "in";
  return getVisibleCxListings()
    .filter((item) => item.side === opposite && item.handle !== mine.handle)
    .map((listing) => {
      const available = mine.side === "in" ? mine : listing;
      const need = mine.side === "out" ? mine : listing;
      const scored = scoreConstructionMatch(toConstructionMatchable(available), toConstructionMatchable(need));
      return { listing, percent: scored.percent, breakdown: scored.breakdown };
    })
    .sort((a, b) => b.percent - a.percent);
}

export { DEFAULT_DURATION_HOURS, hoursLeft };
