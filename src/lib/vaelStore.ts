/**
 * Local prototype store for the Media & Technology core loop.
 * Keys match the 25 Aug 2026 mock modules. Nothing is sent to Supabase.
 */

import { scoreMatch, type MatchableListing } from "./matching";

export const DEFAULT_DURATION_HOURS = 24;
export const EXPIRING_HOURS = 4;

const KEYS = {
  listings: "mtx_mock_listings_v1",
  profiles: "mtx_mock_profile_details_v1",
  connections: "mtx_mock_connections_v1",
  messages: "mtx_mock_messages_v1",
  documents: "mtx_mock_documents_v1",
  notifications: "mtx_mock_notifications_v1",
  seeded: "mtx_mock_core_seeded_v1",
} as const;

export type VaelSide = "in" | "out";

export type VaelListing = {
  id: string;
  handle: string;
  side: VaelSide;
  category: string;
  discipline: string;
  skills: string[];
  tools: string[];
  certifications: string[];
  location: string;
  remoteOnsite: "remote" | "onsite" | "hybrid";
  timing: string;
  experienceYears: number;
  engagement: string;
  budgetProxy: string;
  description: string;
  requirements: string;
  contact: string;
  timeline: string;
  createdAt: string;
  expiresAt: string;
  plan: "daily";
};

export type PortfolioItem = {
  label: string;
  url: string;
  note?: string;
};

export type ProfileRecord = {
  handle: string;
  displayName: string;
  profileType: "individual" | "studio" | "business";
  headline: string;
  bio: string;
  disciplines: string[];
  skills: string[];
  tools: string[];
  experience: string;
  credentials: string;
  location: string;
  /** Matches the listing vocabulary so profile and VAEL never disagree. */
  workPreference?: "remote" | "onsite" | "hybrid";
  experienceYears?: number;
  rates: string;
  portfolio: PortfolioItem[];
  /** Stock portrait for sample people. Studios use a monogram instead. */
  avatarUrl?: string;
  /** Wide plate shown on a profile once the Handshake opens. */
  coverUrl?: string;
  sample?: boolean;
};

export type ProfileDocument = {
  id: string;
  handle: string;
  type: "license" | "insurance" | "capability";
  title: string;
  publicFlag: boolean;
  dataUrl?: string;
};

export type VaelDistrictId = "media-technology" | "construction" | "trucking" | "residential" | "commercial";

export function connectionHref(district: VaelDistrictId, connectionId: string) {
  if (district === "construction") return `/districts/contractor/connections/${connectionId}`;
  if (district === "media-technology") return `/media-technology/connections/${connectionId}`;
  return `/districts/${district}/connections/${connectionId}`;
}

export type ConnectionRecord = {
  id: string;
  district?: VaelDistrictId;
  source: "board_match" | "handshake";
  listingId?: string;
  requesterHandle: string;
  counterpartHandle: string;
  status: "pending" | "declined" | "connected" | "closed";
  requesterAccepted: boolean;
  counterpartAccepted: boolean;
  blocked: boolean;
  createdAt: string;
};

export type ThreadMessage = {
  id: string;
  connectionId: string;
  fromHandle: string;
  body: string;
  createdAt: string;
  failed?: boolean;
  sending?: boolean;
  attachmentName?: string;
  readBy: string[];
};

export type LocalNotice = {
  id: string;
  handle: string;
  title: string;
  body: string;
  /** Route this notice opens, when there is something to open. */
  href?: string;
  createdAt: string;
  read: boolean;
};

export const SAMPLE_HANDLES = ["amercer", "northlight", "jlee", "willowform", "pshah"] as const;

export function isMtSampleHandle(handle: string) {
  return (SAMPLE_HANDLES as readonly string[]).includes(handle);
}
export const CONSTRUCTION_SAMPLE_HANDLES = ["ridgeworks", "lotnorth"] as const;
export const TRUCKING_SAMPLE_HANDLES = ["lanewest", "cargohold"] as const;
export const RESIDENTIAL_SAMPLE_HANDLES = ["porchlight", "hearthside"] as const;
export const COMMERCIAL_SAMPLE_HANDLES = ["northyard", "ledgerwell"] as const;
export const DOC_TYPES = ["license", "insurance", "capability"] as const;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeVael(fn: Listener) {
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

function jordanListing(now: string): VaelListing {
  return {
    id: "vael_jlee",
    handle: "jlee",
    side: "out",
    category: "Designer",
    discipline: "Software",
    skills: ["UX/UI", "Design Systems", "Brand"],
    tools: ["Figma", "FigJam"],
    certifications: [],
    location: "Brooklyn",
    remoteOnsite: "remote",
    timing: "This cycle",
    experienceYears: 9,
    engagement: "Project",
    budgetProxy: "Day rate",
    description: "Need a Creative Director to lead a design-systems engagement this cycle.",
    requirements: "Figma and design-systems fluency. Remote this cycle.",
    contact: "",
    timeline: "This cycle",
    createdAt: now,
    expiresAt: hoursFromNow(20),
    plan: "daily",
  };
}

function willowListing(now: string): VaelListing {
  return {
    id: "vael_willowform",
    handle: "willowform",
    side: "out",
    category: "Studio",
    discipline: "Software",
    skills: ["UX/UI", "Design Systems", "Prototyping"],
    tools: ["Figma"],
    certifications: [],
    location: "Portland",
    remoteOnsite: "remote",
    timing: "This cycle",
    experienceYears: 11,
    engagement: "Project",
    budgetProxy: "Day rate",
    description: "Studio opening a product redesign. Need someone who can hold brand and product together.",
    requirements: "Brand systems and product design. Remote ok.",
    contact: "",
    timeline: "This cycle",
    createdAt: now,
    expiresAt: hoursFromNow(18),
    plan: "daily",
  };
}

function jordanProfile(): ProfileRecord {
  return {
    handle: "jlee",
    displayName: "Jordan Lee",
    profileType: "individual",
    headline: "Product Designer",
    bio: "Product designer looking for a Creative Director this cycle to set a shared system before a launch. UX/UI, design systems, and brand. Sample profile on this device only.",
    disciplines: ["Software"],
    skills: ["UX/UI", "Design Systems", "Brand"],
    tools: ["Figma", "FigJam"],
    experience: "Nine years in product design.",
    experienceYears: 9,
    credentials: "",
    location: "Brooklyn",
    workPreference: "remote",
    rates: "Day rate after Handshake.",
    portfolio: [
      { label: "Selected work", url: "https://example.com/jordanlee" },
      { label: "System case study", url: "https://example.com/jordanlee/systems" },
    ],
    avatarUrl: "/people/jlee.jpg",
    coverUrl: "/scenes/city-hero.jpg",
    sample: true,
  };
}

function priyaListing(now: string): VaelListing {
  return {
    id: "vael_pshah",
    handle: "pshah",
    side: "out",
    category: "Designer",
    discipline: "Software",
    skills: ["Brand", "UX/UI", "Art Direction"],
    tools: ["Figma"],
    certifications: [],
    location: "Chicago",
    remoteOnsite: "hybrid",
    timing: "This cycle",
    experienceYears: 7,
    engagement: "Project",
    budgetProxy: "Day rate",
    description: "Brand designer looking for a Creative Director to set the system before a product launch.",
    requirements: "Brand and product systems. Hybrid in Chicago this cycle.",
    contact: "",
    timeline: "This cycle",
    createdAt: now,
    expiresAt: hoursFromNow(16),
    plan: "daily",
  };
}

function priyaProfile(): ProfileRecord {
  return {
    handle: "pshah",
    displayName: "Priya Shah",
    profileType: "individual",
    headline: "Brand Designer",
    bio: "Brand designer moving into product systems. Looking for a Creative Director to set the vocabulary before a launch. Sample profile on this device only.",
    disciplines: ["Software"],
    skills: ["Brand", "UX/UI", "Art Direction"],
    tools: ["Figma"],
    experience: "Seven years in brand and campaign systems.",
    experienceYears: 7,
    credentials: "",
    location: "Chicago",
    workPreference: "hybrid",
    rates: "Day rate after Handshake.",
    portfolio: [{ label: "Work", url: "https://example.com/priyashah" }],
    avatarUrl: "/people/pshah.jpg",
    coverUrl: "/scenes/handshake.jpg",
    sample: true,
  };
}

function willowProfile(): ProfileRecord {
  return {
    handle: "willowform",
    displayName: "Willowform",
    profileType: "studio",
    headline: "Product studio",
    bio: "Independent product studio opening a redesign this cycle. Needs someone who can hold brand and product together. Sample profile on this device only.",
    disciplines: ["Software"],
    skills: ["UX/UI", "Design Systems", "Prototyping"],
    tools: ["Figma"],
    experience: "Studio shipping product and brand systems.",
    experienceYears: 11,
    credentials: "",
    location: "Portland",
    workPreference: "remote",
    rates: "Project budget after Handshake.",
    portfolio: [{ label: "Studio", url: "https://example.com/willowform" }],
    coverUrl: "/scenes/willowform.jpg",
    sample: true,
  };
}

export function hoursLeft(iso: string) {
  return Math.max(0, Math.round((Date.parse(iso) - Date.now()) / 3600000));
}

export function isLifecycleVisible(listing: VaelListing) {
  return Date.parse(listing.expiresAt) > Date.now();
}

export function listingCompleteness(listing: Omit<VaelListing, "id" | "createdAt" | "expiresAt" | "plan"> | VaelListing) {
  const checks = [
    listing.discipline,
    listing.skills.length,
    listing.tools.length,
    listing.location,
    listing.timing,
    listing.description,
    listing.engagement,
  ];
  const hit = checks.filter(Boolean).length;
  return hit / checks.length;
}

export function toMatchable(listing: VaelListing): MatchableListing {
  return {
    discipline: listing.discipline,
    skills: listing.skills,
    tools: listing.tools,
    certifications: listing.certifications,
    location: listing.location,
    remoteOnsite: listing.remoteOnsite,
    timing: listing.timing,
    experienceYears: listing.experienceYears,
    engagement: listing.engagement,
    budgetProxy: listing.budgetProxy,
    completeness: listingCompleteness(listing),
  };
}

export function veilKindFor(listing: VaelListing | undefined) {
  if (!listing) return "none" as const;
  if (!isLifecycleVisible(listing)) return "expired" as const;
  if (hoursLeft(listing.expiresAt) <= EXPIRING_HOURS) return "expiring" as const;
  return listing.side;
}

function mercerListing(now: string): VaelListing {
  return {
    id: "vael_amercer",
    handle: "amercer",
    side: "in",
    category: "Editor",
    discipline: "Editorial",
    skills: ["Documentary", "Avid", "Color"],
    tools: ["Avid Media Composer", "DaVinci Resolve"],
    certifications: ["Avid Certified"],
    location: "Austin",
    remoteOnsite: "remote",
    timing: "This cycle",
    experienceYears: 8,
    engagement: "Project",
    budgetProxy: "Day rate",
    description: "Finishing editor available this cycle for documentary picture and color.",
    requirements: "Remote-first. Avid project.",
    contact: "",
    timeline: "This cycle",
    createdAt: now,
    expiresAt: hoursFromNow(20),
    plan: "daily",
  };
}

function northlightListing(now: string): VaelListing {
  return {
    id: "vael_northlight",
    handle: "northlight",
    side: "out",
    category: "Studio",
    discipline: "Editorial",
    skills: ["Documentary", "Avid"],
    tools: ["Avid Media Composer"],
    certifications: ["Avid Certified"],
    location: "Los Angeles",
    remoteOnsite: "remote",
    timing: "This cycle",
    experienceYears: 6,
    engagement: "Project",
    budgetProxy: "Day rate",
    description: "Studio seeking an editor for a documentary finish this cycle. Avid.",
    requirements: "Avid fluency. Remote ok.",
    contact: "",
    timeline: "This cycle",
    createdAt: now,
    expiresAt: hoursFromNow(20),
    plan: "daily",
  };
}

function mercerProfile(): ProfileRecord {
  return {
    handle: "amercer",
    displayName: "A. Mercer",
    profileType: "individual",
    headline: "Editor · documentary · Avid",
    bio: "Finishing editor available this cycle for documentary picture lock and color. Sample profile on this device only.",
    disciplines: ["Editorial"],
    skills: ["Documentary", "Avid", "Color"],
    tools: ["Avid Media Composer", "DaVinci Resolve"],
    experience: "Eight years in documentary finishing.",
    experienceYears: 8,
    credentials: "Avid Certified User",
    location: "Austin",
    workPreference: "remote",
    rates: "Day rate on request after Handshake.",
    portfolio: [{ label: "Reel", url: "https://example.com/amercer" }],
    avatarUrl: "/people/amercer.jpg",
    coverUrl: "/scenes/media-technology.jpg",
    sample: true,
  };
}

function northlightProfile(): ProfileRecord {
  return {
    handle: "northlight",
    displayName: "Northlight Studio",
    profileType: "studio",
    headline: "Documentary studio",
    bio: "Independent studio producing long-form documentary. Seeking an editor for a finish this cycle. Sample profile on this device only.",
    disciplines: ["Editorial"],
    skills: ["Documentary", "Avid"],
    tools: ["Avid Media Composer"],
    experience: "Studio producing long-form documentary.",
    experienceYears: 6,
    credentials: "",
    location: "Los Angeles",
    workPreference: "remote",
    rates: "Project budget after Handshake.",
    portfolio: [{ label: "Studio", url: "https://example.com/northlight" }],
    coverUrl: "/scenes/northlight.jpg",
    sample: true,
  };
}

function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;
  const now = new Date().toISOString();
  const listings: VaelListing[] = [
    mercerListing(now),
    northlightListing(now),
    jordanListing(now),
    willowListing(now),
    priyaListing(now),
  ];
  const profiles: ProfileRecord[] = [
    mercerProfile(),
    northlightProfile(),
    jordanProfile(),
    willowProfile(),
    priyaProfile(),
  ];
  write(KEYS.listings, listings);
  write(KEYS.profiles, profiles);
  write(KEYS.connections, []);
  write(KEYS.messages, []);
  write(KEYS.documents, []);
  write(KEYS.notifications, []);
  localStorage.setItem(KEYS.seeded, "1");
}

seedIfNeeded();
ensureMtDemoSamples();

export function upsertProfile(next: ProfileRecord) {
  const all = getProfiles();
  const index = all.findIndex((item) => item.handle === next.handle);
  if (index >= 0) {
    write(
      KEYS.profiles,
      all.map((item, i) => (i === index ? next : item)),
    );
    return;
  }
  write(KEYS.profiles, [...all, next]);
}

export function upsertListing(next: VaelListing) {
  const all = getListings();
  const index = all.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    write(
      KEYS.listings,
      all.map((item, i) => (i === index ? next : item)),
    );
    return;
  }
  write(KEYS.listings, [...all, next]);
}

/** Keep sample counterparts visible for the client demo. Safe to call on every load. */
export function ensureMtDemoSamples() {
  if (typeof localStorage === "undefined") return;
  const now = new Date().toISOString();
  const extras = [
    { listing: jordanListing(now), profile: jordanProfile() },
    { listing: willowListing(now), profile: willowProfile() },
    { listing: priyaListing(now), profile: priyaProfile() },
    { listing: mercerListing(now), profile: mercerProfile() },
    { listing: northlightListing(now), profile: northlightProfile() },
  ];
  extras.forEach(({ listing, profile }) => {
    upsertProfile(profile);
    const existing = getListings().find((item) => item.id === listing.id);
    if (!existing) {
      upsertListing(listing);
      return;
    }
    upsertListing({
      ...listing,
      createdAt: existing.createdAt,
      expiresAt: isLifecycleVisible(existing) ? existing.expiresAt : hoursFromNow(20),
    });
  });
}

export function clearActorLoop(handle: string) {
  expireOwnListing(handle);
  write(
    KEYS.listings,
    getListings().filter((item) => item.handle !== handle),
  );
  const connectionIds = new Set(
    getConnections()
      .filter((item) => item.requesterHandle === handle || item.counterpartHandle === handle)
      .map((item) => item.id),
  );
  write(
    KEYS.connections,
    getConnections().filter((item) => !connectionIds.has(item.id)),
  );
  write(
    KEYS.messages,
    getMessages().filter((item) => !connectionIds.has(item.connectionId)),
  );
  write(
    KEYS.notifications,
    read<LocalNotice[]>(KEYS.notifications, []).filter((item) => item.handle !== handle),
  );
}

export function seedThreadIfEmpty(
  connectionId: string,
  lines: { fromHandle: string; body: string }[],
) {
  const connection = getConnection(connectionId);
  if (!connection || connection.status !== "connected") return;
  if (getMessages(connectionId).length > 0) return;
  const stamped = lines.map((line, index) => ({
    id: `msg_${connectionId}_${index}`,
    connectionId,
    fromHandle: line.fromHandle,
    body: line.body,
    createdAt: new Date(Date.now() - (lines.length - index) * 60000).toISOString(),
    readBy: [line.fromHandle],
  }));
  write(KEYS.messages, [...getMessages(), ...stamped]);
}

export function getListings(): VaelListing[] {
  return read<VaelListing[]>(KEYS.listings, []);
}

export function getVisibleListings(): VaelListing[] {
  return getListings().filter(isLifecycleVisible);
}

export function getListing(id: string) {
  return getListings().find((item) => item.id === id);
}

export function getActiveListing(handle: string) {
  return getVisibleListings()
    .filter((item) => item.handle === handle)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function getLatestListing(handle: string) {
  return getListings()
    .filter((item) => item.handle === handle)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function getProfiles(): ProfileRecord[] {
  return read<ProfileRecord[]>(KEYS.profiles, []);
}

export function getProfile(handle: string) {
  return getProfiles().find((item) => item.handle === handle);
}

export function ensureProfile(handle: string): ProfileRecord {
  const existing = getProfile(handle);
  if (existing) return existing;
  const created: ProfileRecord = {
    handle,
    displayName: handle,
    profileType: "individual",
    headline: "",
    bio: "",
    disciplines: [],
    skills: [],
    tools: [],
    experience: "",
    credentials: "",
    location: "",
    rates: "",
    portfolio: [],
  };
  write(KEYS.profiles, [...getProfiles(), created]);
  return created;
}

export function saveProfile(next: ProfileRecord) {
  write(
    KEYS.profiles,
    getProfiles().map((item) => (item.handle === next.handle ? next : item)),
  );
}

/** Moves a profile and its documents when a handle is claimed. */
export function renameProfileHandle(from: string, to: string) {
  write(
    KEYS.profiles,
    getProfiles().map((item) => (item.handle === from ? { ...item, handle: to } : item)),
  );
  write(
    KEYS.documents,
    read<ProfileDocument[]>(KEYS.documents, []).map((item) =>
      item.handle === from ? { ...item, handle: to } : item,
    ),
  );
}

export function getDocuments(handle: string) {
  return read<ProfileDocument[]>(KEYS.documents, []).filter((item) => item.handle === handle);
}

export function addDocument(doc: Omit<ProfileDocument, "id">) {
  const next: ProfileDocument = { ...doc, id: id("doc") };
  write(KEYS.documents, [...read<ProfileDocument[]>(KEYS.documents, []), next]);
  return next;
}

export function publishListing(input: Omit<VaelListing, "id" | "createdAt" | "expiresAt" | "plan">) {
  const listings = getListings().map((item) =>
    item.handle === input.handle && isLifecycleVisible(item)
      ? { ...item, expiresAt: new Date().toISOString() }
      : item,
  );
  const listing: VaelListing = {
    ...input,
    id: id("vael"),
    createdAt: new Date().toISOString(),
    expiresAt: hoursFromNow(DEFAULT_DURATION_HOURS),
    plan: "daily",
  };
  write(KEYS.listings, [...listings, listing]);
  hydrateProfileFromListing(listing);
  reconcileAfterRevael(input.handle);
  pushNotice(
    input.handle,
    "You're visible",
    `Your availability is live for ${DEFAULT_DURATION_HOURS} hours.`,
    "/media-technology/veil/active",
  );
  return listing;
}

/** Fill empty profile fields from the VAEL. Does not overwrite edited identity. */
function hydrateProfileFromListing(listing: VaelListing) {
  const profile = ensureProfile(listing.handle);
  const next: ProfileRecord = {
    ...profile,
    location: profile.location || listing.location,
    disciplines: profile.disciplines.length ? profile.disciplines : listing.discipline ? [listing.discipline] : [],
    skills: profile.skills.length ? profile.skills : listing.skills,
    tools: profile.tools.length ? profile.tools : listing.tools,
    headline:
      profile.headline ||
      (() => {
        const role = listing.category || listing.discipline;
        if (!role) return listing.side === "in" ? "Available" : "Looking for someone";
        return listing.side === "in" ? `Available · ${role}` : `Needs ${role}`;
      })(),
  };
  saveProfile(next);
}

export function expireOwnListing(handle: string) {
  write(
    KEYS.listings,
    getListings().map((item) =>
      item.handle === handle && isLifecycleVisible(item) ? { ...item, expiresAt: new Date().toISOString() } : item,
    ),
  );
}

function reconcileAfterRevael(handle: string) {
  write(
    KEYS.connections,
    getConnections().map((item) => {
      if (item.status !== "pending") return item;
      if (item.requesterHandle === handle || item.counterpartHandle === handle) return item;
      return item;
    }),
  );
}

export function getConnections(): ConnectionRecord[] {
  return read<ConnectionRecord[]>(KEYS.connections, []);
}

export function getConnection(idValue: string) {
  return getConnections().find((item) => item.id === idValue);
}

export function connectionDistrict(item: ConnectionRecord): VaelDistrictId {
  return item.district ?? "media-technology";
}

export function connectionsFor(handle: string, district?: VaelDistrictId) {
  return getConnections().filter((item) => {
    const inPair = item.requesterHandle === handle || item.counterpartHandle === handle;
    if (!inPair) return false;
    if (!district) return true;
    return connectionDistrict(item) === district;
  });
}

export function counterpartOf(connection: ConnectionRecord, handle: string) {
  return connection.requesterHandle === handle ? connection.counterpartHandle : connection.requesterHandle;
}

export function findOpenConnection(a: string, b: string, district?: VaelDistrictId) {
  return getConnections().find((item) => {
    if (item.status === "declined" || item.status === "closed") return false;
    if (district && connectionDistrict(item) !== district) return false;
    return (
      (item.requesterHandle === a && item.counterpartHandle === b) ||
      (item.requesterHandle === b && item.counterpartHandle === a)
    );
  });
}

function noticeName(handle: string) {
  return getProfile(handle)?.displayName ?? `@${handle}`;
}

export function requestHandshake(opts: {
  fromHandle: string;
  toHandle: string;
  source: ConnectionRecord["source"];
  listingId?: string;
  district?: VaelDistrictId;
}) {
  const district = opts.district ?? "media-technology";
  const existing = findOpenConnection(opts.fromHandle, opts.toHandle, district);
  if (existing) return existing;
  const record: ConnectionRecord = {
    id: id("conn"),
    district,
    source: opts.source,
    listingId: opts.listingId,
    requesterHandle: opts.fromHandle,
    counterpartHandle: opts.toHandle,
    status: "pending",
    requesterAccepted: true,
    counterpartAccepted: false,
    blocked: false,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.connections, [...getConnections(), record]);
  const href = connectionHref(district, record.id);
  pushNotice(opts.toHandle, "Handshake requested", `${noticeName(opts.fromHandle)} asked to connect.`, href);
  pushNotice(
    opts.fromHandle,
    "Handshake sent",
    `Sent to ${noticeName(opts.toHandle)}. Private details stay closed until they accept.`,
    href,
  );
  return record;
}

export function acceptHandshake(connectionId: string, handle: string) {
  const next = getConnections().map((item) => {
    if (item.id !== connectionId) return item;
    const requesterAccepted = item.requesterHandle === handle ? true : item.requesterAccepted;
    const counterpartAccepted = item.counterpartHandle === handle ? true : item.counterpartAccepted;
    const both = requesterAccepted && counterpartAccepted;
    return {
      ...item,
      requesterAccepted,
      counterpartAccepted,
      status: both ? ("connected" as const) : item.status,
    };
  });
  write(KEYS.connections, next);
  const updated = next.find((item) => item.id === connectionId);
  if (updated?.status === "connected") {
    const other = counterpartOf(updated, handle);
    pushNotice(
      other,
      "Connected",
      `You're connected with ${noticeName(handle)}. Full profile and chat are open.`,
      connectionHref(updated.district ?? "media-technology", updated.id),
    );
    pushNotice(
      handle,
      "Connected",
      `You're connected with ${noticeName(other)}. Full profile and chat are open.`,
      connectionHref(updated.district ?? "media-technology", updated.id),
    );
  }
  return updated;
}

export function declineHandshake(connectionId: string) {
  write(
    KEYS.connections,
    getConnections().map((item) => (item.id === connectionId ? { ...item, status: "declined" as const } : item)),
  );
}

export function closeConnection(connectionId: string) {
  write(
    KEYS.connections,
    getConnections().map((item) => (item.id === connectionId ? { ...item, status: "closed" as const } : item)),
  );
}

export function blockConnection(connectionId: string) {
  write(
    KEYS.connections,
    getConnections().map((item) =>
      item.id === connectionId ? { ...item, blocked: true, status: "closed" as const } : item,
    ),
  );
}

/** Prototype-only: sample accounts live on this device. */
export function simulateCounterpartAccept(connectionId: string, handle: string) {
  const connection = getConnection(connectionId);
  if (!connection) return;
  const other = counterpartOf(connection, handle);
  const mt = isMtSampleHandle(other);
  const cx = CONSTRUCTION_SAMPLE_HANDLES.includes(other as (typeof CONSTRUCTION_SAMPLE_HANDLES)[number]);
  const tx = TRUCKING_SAMPLE_HANDLES.includes(other as (typeof TRUCKING_SAMPLE_HANDLES)[number]);
  const rx = RESIDENTIAL_SAMPLE_HANDLES.includes(other as (typeof RESIDENTIAL_SAMPLE_HANDLES)[number]);
  const cm = COMMERCIAL_SAMPLE_HANDLES.includes(other as (typeof COMMERCIAL_SAMPLE_HANDLES)[number]);
  if (!mt && !cx && !tx && !rx && !cm) return;
  acceptHandshake(connectionId, other);
}

export function getMessages(connectionId?: string) {
  const all = read<ThreadMessage[]>(KEYS.messages, []);
  return connectionId ? all.filter((item) => item.connectionId === connectionId) : all;
}

export function sendMessage(connectionId: string, fromHandle: string, body: string, attachmentName?: string) {
  const connection = getConnection(connectionId);
  if (!connection || connection.status !== "connected" || connection.blocked) {
    throw new Error("Messages open after a connected Handshake.");
  }
  const message: ThreadMessage = {
    id: id("msg"),
    connectionId,
    fromHandle,
    body,
    createdAt: new Date().toISOString(),
    attachmentName,
    readBy: [fromHandle],
  };
  write(KEYS.messages, [...getMessages(), message]);
  return message;
}

export function markThreadRead(connectionId: string, handle: string) {
  write(
    KEYS.messages,
    getMessages().map((item) =>
      item.connectionId === connectionId && !item.readBy.includes(handle)
        ? { ...item, readBy: [...item.readBy, handle] }
        : item,
    ),
  );
}

export function unreadMessageCount(handle: string) {
  return getMessages().filter((item) => {
    const connection = getConnection(item.connectionId);
    if (!connection || connection.status !== "connected") return false;
    const inThread = connection.requesterHandle === handle || connection.counterpartHandle === handle;
    return inThread && item.fromHandle !== handle && !item.readBy.includes(handle);
  }).length;
}

export function getNotices(handle: string) {
  return read<LocalNotice[]>(KEYS.notifications, []).filter((item) => item.handle === handle);
}

export function pushNotice(handle: string, title: string, body: string, href?: string) {
  const notice: LocalNotice = {
    id: id("note"),
    handle,
    title,
    body,
    href,
    createdAt: new Date().toISOString(),
    read: false,
  };
  write(KEYS.notifications, [...read<LocalNotice[]>(KEYS.notifications, []), notice]);
}

export function markNoticesRead(handle: string) {
  write(
    KEYS.notifications,
    read<LocalNotice[]>(KEYS.notifications, []).map((item) =>
      item.handle === handle ? { ...item, read: true } : item,
    ),
  );
}

export function unreadNoticeCount(handle: string) {
  return getNotices(handle).filter((item) => !item.read).length;
}

export type RankedMatch = {
  listing: VaelListing;
  percent: number;
  breakdown: ReturnType<typeof scoreMatch>["breakdown"];
};

export function rankMatches(mine: VaelListing): RankedMatch[] {
  const opposite: VaelSide = mine.side === "in" ? "out" : "in";
  const offering = mine.side === "in" ? mine : undefined;
  return getVisibleListings()
    .filter((item) => item.side === opposite && item.handle !== mine.handle)
    .map((listing) => {
      const seeker = mine.side === "out" ? mine : listing;
      const offer = offering ?? listing;
      const scored = scoreMatch(toMatchable(offer), toMatchable(seeker));
      return { listing, percent: scored.percent, breakdown: scored.breakdown };
    })
    .sort((a, b) => b.percent - a.percent);
}

/** Suggestions drawn from the City's own vocabulary rather than a hard-coded taxonomy. */
export function capabilityOptions(key: "skills" | "tools"): string[] {
  const found = new Set<string>();
  for (const listing of getListings()) listing[key].forEach((value) => found.add(value));
  for (const profile of getProfiles()) profile[key].forEach((value) => found.add(value));
  return [...found].sort((a, b) => a.localeCompare(b));
}

export function certificationOptions(): string[] {
  const found = new Set<string>();
  const add = (value: string) => {
    const clean = value.trim();
    if (clean) found.add(clean);
  };
  for (const listing of getListings()) listing.certifications.forEach(add);
  for (const profile of getProfiles()) profile.credentials.split(",").forEach(add);
  return [...found].sort((a, b) => a.localeCompare(b));
}

export const M_T_CATEGORIES = ["Editor", "Developer", "Studio", "Producer", "Designer"] as const;
export const M_T_DISCIPLINES = ["Editorial", "Software", "Motion", "Sound", "Producing"] as const;
export const M_T_ENGAGEMENTS = ["Project", "Retainer", "Day rate", "Staffing"] as const;
export const M_T_TIMING = ["This cycle", "Next two weeks", "Flexible"] as const;
export const M_T_BUDGET = ["Day rate", "Project fee", "To discuss"] as const;
