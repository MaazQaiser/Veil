/**
 * Local prototype store for Trucking Exchange.
 * Separate keys from Media & Technology and Construction.
 * Handshake/messages reuse vaelStore with district: "trucking".
 * No maps, no DOT/MC columns, nothing sent to Supabase.
 */

import { scoreTruckingMatch, type TruckingMatchable } from "./truckingMatching";
import { DEFAULT_DURATION_HOURS, EXPIRING_HOURS, hoursLeft, type VaelSide } from "./vaelStore";

const KEYS = {
  listings: "tx_mock_listings_v1",
  profiles: "tx_mock_profiles_v1",
  documents: "tx_mock_documents_v1",
  seeded: "tx_mock_core_seeded_v1",
} as const;

export type TruckingListing = {
  id: string;
  handle: string;
  side: VaelSide;
  origin: string;
  destination: string;
  equipment: string;
  capacity: string;
  availability: string;
  capabilities: string[];
  experienceYears: number;
  description: string;
  requirements: string;
  contact: string;
  /** Local-only timing notes. Not scored. Not a dispatch clock. */
  pickupNote: string;
  deliveryNote: string;
  createdAt: string;
  expiresAt: string;
  plan: "daily";
};

export type TruckingProfile = {
  handle: string;
  displayName: string;
  profileType: "individual" | "company";
  headline: string;
  about: string;
  equipment: string;
  serviceLanes: string;
  capabilities: string[];
  experience: string;
  credentials: string[];
  rates: string;
  history: { label: string; url: string }[];
  sample?: boolean;
  /** District Profile — role/profession within the district, separate from equipment. */
  specialization?: string;
  /** What you can offer in this District. */
  offers?: string[];
  /** What you're looking for in this District. */
  lookingFor?: string[];
};

export type TruckingDocument = {
  id: string;
  handle: string;
  type: "license" | "insurance" | "capability";
  title: string;
  publicFlag: boolean;
  dataUrl?: string;
};

/** Kit starter — equipment categories, not a regulatory class list. Owner may replace. */
export const TX_EQUIPMENT = ["Dry van", "Flatbed", "Reefer", "Box", "Other"] as const;

/** Kit starter — qualitative capacity, not legal weight. Owner may replace. */
export const TX_CAPACITY = ["Full", "Partial", "Dedicated"] as const;

export const TX_AVAILABILITY = ["This cycle", "Next two weeks", "Flexible"] as const;

/** District Profile option catalogs — the values change per District, the editor shape does not. */
export const TX_SKILLS = ["Long haul", "Regional", "Local delivery", "Hazmat", "Team driving", "Dispatch"];
export const TX_OFFERS = ["Available capacity", "Dedicated lane", "Owner-operator services", "Dispatch support"];
export const TX_CREDENTIAL_TYPES = ["CDL", "DOT number", "Insured", "Hazmat endorsement", "Safety rating on file"];

export function laneLabel(origin: string, destination: string) {
  if (!origin && !destination) return "Lane not listed";
  if (!origin) return `→ ${destination}`;
  if (!destination) return `${origin} →`;
  return `${origin} → ${destination}`;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeTrucking(fn: Listener) {
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

export function isTxVisible(listing: TruckingListing) {
  return Date.parse(listing.expiresAt) > Date.now();
}

export function txCompleteness(
  listing: Omit<TruckingListing, "id" | "createdAt" | "expiresAt" | "plan"> | TruckingListing,
) {
  const checks = [
    listing.origin,
    listing.destination,
    listing.equipment,
    listing.capacity,
    listing.availability,
    listing.description,
    listing.experienceYears,
  ];
  const hit = checks.filter(Boolean).length;
  return hit / checks.length;
}

export function toTruckingMatchable(listing: TruckingListing): TruckingMatchable {
  return {
    origin: listing.origin,
    destination: listing.destination,
    equipment: listing.equipment,
    capacity: listing.capacity,
    availability: listing.availability,
    capabilities: listing.capabilities,
    experienceYears: listing.experienceYears,
    completeness: txCompleteness(listing),
  };
}

export function txVaelKind(listing: TruckingListing | undefined) {
  if (!listing) return "none" as const;
  if (!isTxVisible(listing)) return "expired" as const;
  if (hoursLeft(listing.expiresAt) <= EXPIRING_HOURS) return "expiring" as const;
  return listing.side;
}

function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;
  const now = new Date().toISOString();
  const listings: TruckingListing[] = [
    {
      id: "tx_lanewest",
      handle: "lanewest",
      side: "in",
      origin: "Atlanta",
      destination: "Savannah",
      equipment: "Dry van",
      capacity: "Full",
      availability: "This cycle",
      capabilities: ["Regional", "Dry"],
      experienceYears: 10,
      description: "Dry van capacity available Atlanta to Savannah this cycle.",
      requirements: "Full load. Regional lane.",
      contact: "",
      pickupNote: "This cycle",
      deliveryNote: "This cycle",
      createdAt: now,
      expiresAt: hoursFromNow(20),
      plan: "daily",
    },
    {
      id: "tx_cargohold",
      handle: "cargohold",
      side: "out",
      origin: "Atlanta",
      destination: "Savannah",
      equipment: "Dry van",
      capacity: "Full",
      availability: "This cycle",
      capabilities: ["Regional", "Dry"],
      experienceYears: 6,
      description: "Load needs dry van from Atlanta to Savannah this cycle.",
      requirements: "Dry van. Full load.",
      contact: "",
      pickupNote: "This cycle",
      deliveryNote: "This cycle",
      createdAt: now,
      expiresAt: hoursFromNow(20),
      plan: "daily",
    },
  ];
  const profiles: TruckingProfile[] = [
    {
      handle: "lanewest",
      displayName: "Lane West",
      profileType: "company",
      headline: "Dry van · Atlanta → Savannah",
      about: "Sample Trucking capacity profile on this device only.",
      equipment: "Dry van",
      serviceLanes: "Atlanta → Savannah",
      capabilities: ["Regional", "Dry"],
      experience: "Ten years on this sample record.",
      credentials: [],
      rates: "Discussed after Handshake.",
      history: [{ label: "Recent lane", url: "https://example.com/lanewest" }],
      sample: true,
    },
    {
      handle: "cargohold",
      displayName: "Cargo Hold",
      profileType: "company",
      headline: "Needs dry van Atlanta → Savannah",
      about: "Sample load need on this device only.",
      equipment: "Dry van",
      serviceLanes: "Atlanta → Savannah",
      capabilities: ["Regional", "Dry"],
      experience: "",
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
      id: "txdoc_lane_ins",
      handle: "lanewest",
      type: "insurance",
      title: "Insurance document (sample label)",
      publicFlag: false,
    },
  ] satisfies TruckingDocument[]);
  localStorage.setItem(KEYS.seeded, "1");
}

seedIfNeeded();

export function getTxListings(): TruckingListing[] {
  return read<TruckingListing[]>(KEYS.listings, []);
}

export function getVisibleTxListings() {
  return getTxListings().filter(isTxVisible);
}

export function getTxListing(id: string) {
  return getTxListings().find((item) => item.id === id);
}

export function getActiveTxListing(handle: string) {
  return getVisibleTxListings()
    .filter((item) => item.handle === handle)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function getLatestTxListing(handle: string) {
  return getTxListings()
    .filter((item) => item.handle === handle)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function getTxProfiles(): TruckingProfile[] {
  return read<TruckingProfile[]>(KEYS.profiles, []);
}

export function getTxProfile(handle: string) {
  return getTxProfiles().find((item) => item.handle === handle);
}

export function ensureTxProfile(handle: string): TruckingProfile {
  const existing = getTxProfile(handle);
  if (existing) return existing;
  const created: TruckingProfile = {
    handle,
    displayName: handle,
    profileType: "individual",
    headline: "",
    about: "",
    equipment: "",
    serviceLanes: "",
    capabilities: [],
    experience: "",
    credentials: [],
    rates: "",
    history: [],
  };
  write(KEYS.profiles, [...getTxProfiles(), created]);
  return created;
}

export function saveTxProfile(next: TruckingProfile) {
  const all = getTxProfiles();
  const exists = all.some((item) => item.handle === next.handle);
  write(KEYS.profiles, exists ? all.map((item) => (item.handle === next.handle ? next : item)) : [...all, next]);
}

export function getTxDocuments(handle: string) {
  return read<TruckingDocument[]>(KEYS.documents, []).filter((item) => item.handle === handle);
}

/** Leaving the district: drop the profile, documents, and any active listing for this handle. */
export function resetTxProfile(handle: string) {
  write(KEYS.profiles, getTxProfiles().filter((item) => item.handle !== handle));
  write(KEYS.documents, read<TruckingDocument[]>(KEYS.documents, []).filter((item) => item.handle !== handle));
  expireOwnTxListing(handle);
  return ensureTxProfile(handle);
}

/** Full removal for one handle: profile, documents, and every listing (not just expired). Used by the demo reset. */
export function purgeTxHandle(handle: string) {
  write(KEYS.profiles, getTxProfiles().filter((item) => item.handle !== handle));
  write(KEYS.documents, read<TruckingDocument[]>(KEYS.documents, []).filter((item) => item.handle !== handle));
  write(KEYS.listings, getTxListings().filter((item) => item.handle !== handle));
}

export function addTxDocument(doc: Omit<TruckingDocument, "id">) {
  const next: TruckingDocument = { ...doc, id: id("txdoc") };
  write(KEYS.documents, [...read<TruckingDocument[]>(KEYS.documents, []), next]);
  return next;
}

export function publishTxListing(input: Omit<TruckingListing, "id" | "createdAt" | "expiresAt" | "plan">) {
  const listings = getTxListings().map((item) =>
    item.handle === input.handle && isTxVisible(item) ? { ...item, expiresAt: new Date().toISOString() } : item,
  );
  const listing: TruckingListing = {
    ...input,
    id: id("txvael"),
    createdAt: new Date().toISOString(),
    expiresAt: hoursFromNow(DEFAULT_DURATION_HOURS),
    plan: "daily",
  };
  write(KEYS.listings, [...listings, listing]);
  hydrateTxProfile(listing);
  return listing;
}

function hydrateTxProfile(listing: TruckingListing) {
  const profile = ensureTxProfile(listing.handle);
  saveTxProfile({
    ...profile,
    equipment: profile.equipment || listing.equipment,
    serviceLanes: profile.serviceLanes || laneLabel(listing.origin, listing.destination),
    capabilities: profile.capabilities.length ? profile.capabilities : listing.capabilities,
    headline:
      profile.headline ||
      (listing.side === "in"
        ? `Capacity · ${laneLabel(listing.origin, listing.destination)}`
        : `Load · ${laneLabel(listing.origin, listing.destination)}`),
  });
}

export function expireOwnTxListing(handle: string) {
  write(
    KEYS.listings,
    getTxListings().map((item) =>
      item.handle === handle && isTxVisible(item) ? { ...item, expiresAt: new Date().toISOString() } : item,
    ),
  );
}

export type RankedTruckingMatch = {
  listing: TruckingListing;
  percent: number;
  breakdown: ReturnType<typeof scoreTruckingMatch>["breakdown"];
};

export function rankTruckingMatches(mine: TruckingListing): RankedTruckingMatch[] {
  const opposite: VaelSide = mine.side === "in" ? "out" : "in";
  return getVisibleTxListings()
    .filter((item) => item.side === opposite && item.handle !== mine.handle)
    .map((listing) => {
      const capacity = mine.side === "in" ? mine : listing;
      const load = mine.side === "out" ? mine : listing;
      const scored = scoreTruckingMatch(toTruckingMatchable(capacity), toTruckingMatchable(load));
      return { listing, percent: scored.percent, breakdown: scored.breakdown };
    })
    .sort((a, b) => b.percent - a.percent);
}

export { DEFAULT_DURATION_HOURS, hoursLeft };
