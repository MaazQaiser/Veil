/**
 * Local prototype store for Residential.
 * Separate keys from Media & Technology, Construction, and Trucking.
 * Handshake/messages reuse vaelStore with district: "residential".
 * No maps, no geolocation, nothing sent to Supabase.
 */

import { scoreResidentialMatch, type ResidentialMatchable } from "./residentialMatching";
import { DEFAULT_DURATION_HOURS, EXPIRING_HOURS, hoursLeft, type VaelSide } from "./vaelStore";

const KEYS = {
  listings: "rx_mock_listings_v1",
  profiles: "rx_mock_profiles_v1",
  documents: "rx_mock_documents_v1",
  seeded: "rx_mock_core_seeded_v1",
} as const;

export type ResidentialListing = {
  id: string;
  handle: string;
  side: VaelSide;
  service: string;
  area: string;
  /** Optional postal text. Not geocoded. Scored only when both sides list it. */
  postalCode: string;
  availability: string;
  capabilities: string[];
  experienceYears: number;
  credentials: string[];
  description: string;
  requirements: string;
  contact: string;
  /** Local-only extra context. Not scored. Not a budget engine. */
  extraNote: string;
  createdAt: string;
  expiresAt: string;
  plan: "daily";
};

export type ResidentialProfile = {
  handle: string;
  displayName: string;
  profileType: "individual" | "company";
  headline: string;
  about: string;
  service: string;
  area: string;
  capabilities: string[];
  experience: string;
  credentials: string[];
  rates: string;
  history: { label: string; url: string }[];
  sample?: boolean;
};

export type ResidentialDocument = {
  id: string;
  handle: string;
  type: "license" | "insurance" | "capability";
  title: string;
  publicFlag: boolean;
  dataUrl?: string;
};

/**
 * Kit starter — homeowner language, not Construction’s trade catalog.
 * Owner may replace. Not a locked taxonomy.
 */
export const RX_SERVICES = [
  "Plumbing",
  "Electrical",
  "Heating and cooling",
  "Painting",
  "General home repair",
  "Yard and outdoor",
  "Other",
] as const;

/** Same City timing language, labeled for homeowners. */
export const RX_TIMING = ["This cycle", "Next two weeks", "Flexible"] as const;

export function placeLabel(area: string, postalCode?: string) {
  if (!area && !postalCode) return "Area not listed";
  if (!postalCode) return area;
  if (!area) return postalCode;
  return `${area} · ${postalCode}`;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeResidential(fn: Listener) {
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

export function isRxVisible(listing: ResidentialListing) {
  return Date.parse(listing.expiresAt) > Date.now();
}

export function rxCompleteness(
  listing: Omit<ResidentialListing, "id" | "createdAt" | "expiresAt" | "plan"> | ResidentialListing,
) {
  const checks = [listing.service, listing.area, listing.availability, listing.description, listing.experienceYears];
  const hit = checks.filter(Boolean).length;
  return hit / checks.length;
}

export function toResidentialMatchable(listing: ResidentialListing): ResidentialMatchable {
  return {
    service: listing.service,
    area: listing.area,
    postalCode: listing.postalCode,
    availability: listing.availability,
    capabilities: listing.capabilities,
    experienceYears: listing.experienceYears,
    credentials: listing.credentials,
    completeness: rxCompleteness(listing),
  };
}

export function rxVeilKind(listing: ResidentialListing | undefined) {
  if (!listing) return "none" as const;
  if (!isRxVisible(listing)) return "expired" as const;
  if (hoursLeft(listing.expiresAt) <= EXPIRING_HOURS) return "expiring" as const;
  return listing.side;
}

function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;
  const now = new Date().toISOString();
  const listings: ResidentialListing[] = [
    {
      id: "rx_porchlight",
      handle: "porchlight",
      side: "in",
      service: "General home repair",
      area: "Atlanta",
      postalCode: "30308",
      availability: "This cycle",
      capabilities: ["Repairs", "Interior"],
      experienceYears: 8,
      credentials: [],
      description: "Available for general home repair in Atlanta this cycle.",
      requirements: "Residential work. Atlanta area.",
      contact: "",
      extraNote: "",
      createdAt: now,
      expiresAt: hoursFromNow(20),
      plan: "daily",
    },
    {
      id: "rx_hearthside",
      handle: "hearthside",
      side: "in",
      service: "Painting",
      area: "Atlanta",
      postalCode: "30309",
      availability: "Next two weeks",
      capabilities: ["Interior", "Prep"],
      experienceYears: 6,
      credentials: [],
      description: "Available for interior painting around Atlanta.",
      requirements: "Interior residential painting.",
      contact: "",
      extraNote: "",
      createdAt: now,
      expiresAt: hoursFromNow(20),
      plan: "daily",
    },
  ];
  const profiles: ResidentialProfile[] = [
    {
      handle: "porchlight",
      displayName: "Porch Light",
      profileType: "individual",
      headline: "General home repair · Atlanta",
      about: "Sample Residential provider on this device only.",
      service: "General home repair",
      area: "Atlanta",
      capabilities: ["Repairs", "Interior"],
      experience: "Eight years on this sample record.",
      credentials: [],
      rates: "Discussed after Handshake.",
      history: [{ label: "Recent home work", url: "https://example.com/porchlight" }],
      sample: true,
    },
    {
      handle: "hearthside",
      displayName: "Hearthside",
      profileType: "company",
      headline: "Painting · Atlanta",
      about: "Sample painting provider on this device only.",
      service: "Painting",
      area: "Atlanta",
      capabilities: ["Interior", "Prep"],
      experience: "Six years on this sample record.",
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
      id: "rxdoc_porch_ins",
      handle: "porchlight",
      type: "insurance",
      title: "Insurance document (sample label)",
      publicFlag: false,
    },
  ] satisfies ResidentialDocument[]);
  localStorage.setItem(KEYS.seeded, "1");
}

seedIfNeeded();

export function getRxListings(): ResidentialListing[] {
  return read<ResidentialListing[]>(KEYS.listings, []);
}

export function getVisibleRxListings() {
  return getRxListings().filter(isRxVisible);
}

export function getRxListing(id: string) {
  return getRxListings().find((item) => item.id === id);
}

export function getActiveRxListing(handle: string) {
  return getVisibleRxListings()
    .filter((item) => item.handle === handle)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function getLatestRxListing(handle: string) {
  return getRxListings()
    .filter((item) => item.handle === handle)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function getRxProfiles(): ResidentialProfile[] {
  return read<ResidentialProfile[]>(KEYS.profiles, []);
}

export function getRxProfile(handle: string) {
  return getRxProfiles().find((item) => item.handle === handle);
}

export function ensureRxProfile(handle: string): ResidentialProfile {
  const existing = getRxProfile(handle);
  if (existing) return existing;
  const created: ResidentialProfile = {
    handle,
    displayName: handle,
    profileType: "individual",
    headline: "",
    about: "",
    service: "",
    area: "",
    capabilities: [],
    experience: "",
    credentials: [],
    rates: "",
    history: [],
  };
  write(KEYS.profiles, [...getRxProfiles(), created]);
  return created;
}

export function saveRxProfile(next: ResidentialProfile) {
  const all = getRxProfiles();
  const exists = all.some((item) => item.handle === next.handle);
  write(KEYS.profiles, exists ? all.map((item) => (item.handle === next.handle ? next : item)) : [...all, next]);
}

export function getRxDocuments(handle: string) {
  return read<ResidentialDocument[]>(KEYS.documents, []).filter((item) => item.handle === handle);
}

export function addRxDocument(doc: Omit<ResidentialDocument, "id">) {
  const next: ResidentialDocument = { ...doc, id: id("rxdoc") };
  write(KEYS.documents, [...read<ResidentialDocument[]>(KEYS.documents, []), next]);
  return next;
}

export function publishRxListing(input: Omit<ResidentialListing, "id" | "createdAt" | "expiresAt" | "plan">) {
  const listings = getRxListings().map((item) =>
    item.handle === input.handle && isRxVisible(item) ? { ...item, expiresAt: new Date().toISOString() } : item,
  );
  const listing: ResidentialListing = {
    ...input,
    id: id("rxvael"),
    createdAt: new Date().toISOString(),
    expiresAt: hoursFromNow(DEFAULT_DURATION_HOURS),
    plan: "daily",
  };
  write(KEYS.listings, [...listings, listing]);
  hydrateRxProfile(listing);
  return listing;
}

function hydrateRxProfile(listing: ResidentialListing) {
  const profile = ensureRxProfile(listing.handle);
  saveRxProfile({
    ...profile,
    service: profile.service || listing.service,
    area: profile.area || listing.area,
    capabilities: profile.capabilities.length ? profile.capabilities : listing.capabilities,
    headline:
      profile.headline ||
      (listing.side === "in" ? `${listing.service} · ${listing.area}` : `Needs ${listing.service} · ${listing.area}`),
  });
}

export function expireOwnRxListing(handle: string) {
  write(
    KEYS.listings,
    getRxListings().map((item) =>
      item.handle === handle && isRxVisible(item) ? { ...item, expiresAt: new Date().toISOString() } : item,
    ),
  );
}

export type RankedResidentialMatch = {
  listing: ResidentialListing;
  percent: number;
  breakdown: ReturnType<typeof scoreResidentialMatch>["breakdown"];
};

export function rankResidentialMatches(mine: ResidentialListing): RankedResidentialMatch[] {
  const opposite: VaelSide = mine.side === "in" ? "out" : "in";
  return getVisibleRxListings()
    .filter((item) => item.side === opposite && item.handle !== mine.handle)
    .map((listing) => {
      const need = mine.side === "out" ? mine : listing;
      const provider = mine.side === "in" ? mine : listing;
      const scored = scoreResidentialMatch(toResidentialMatchable(need), toResidentialMatchable(provider));
      return { listing, percent: scored.percent, breakdown: scored.breakdown };
    })
    .sort((a, b) => b.percent - a.percent);
}

export { DEFAULT_DURATION_HOURS, hoursLeft };
