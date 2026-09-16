/**
 * Client demo journey helpers.
 * Local/mock only. Does not create accounts, payments, or a second device.
 */

import {
  clearActorLoop,
  ensureMtDemoSamples,
  ensureProfile,
  getActiveListing,
  getConnection,
  getProfile,
  getVisibleListings,
  hoursLeft,
  isMtSampleHandle,
  type ProfileRecord,
  seedThreadIfEmpty,
  upsertProfile,
} from "./vaelStore";
import { ensureCommunityPosts, type CommunityPost } from "./communityStore";
import { clearAccountsExcept, registerAccount } from "./accounts";
import { clearOnboardingDrafts } from "./onboarding";

export const DEMO_HANDLE = "alexmorgan";
export const DEMO_DISPLAY_NAME = "Alex Morgan";
export const DEMO_EMAIL = "alex.morgan@example.com";
export const DEMO_PHONE = "+1 (404) 555-0142";
export const DEMO_COUNTERPART_HANDLE = "jlee";
export const DEMO_DRAFT_KEY = "vael_client_demo_draft_v1";

export const ALEX_PROFILE: ProfileRecord = {
  handle: DEMO_HANDLE,
  displayName: DEMO_DISPLAY_NAME,
  profileType: "individual",
  headline: "Creative Director",
  bio: "Creative Director working across brand and product systems. Available this cycle for design-systems work. Sample persona on this device — not a live account.",
  disciplines: ["Software"],
  skills: ["UX/UI", "Design Systems", "Brand"],
  tools: ["Figma"],
  experience: "Twelve years leading product and brand design.",
  experienceYears: 12,
  credentials: "",
  location: "Atlanta",
  workPreference: "remote",
  rates: "Day rate after Handshake.",
  portfolio: [{ label: "Selected work", url: "https://example.com/alexmorgan" }],
  avatarUrl: "/people/alexmorgan.jpg",
  coverUrl: "/scenes/city.jpg",
};

export const ALEX_VAEL_DEFAULTS = {
  side: "in" as const,
  category: "Designer",
  discipline: "Software",
  skills: "UX/UI, Design Systems, Brand",
  tools: "Figma",
  certifications: "",
  location: "Atlanta",
  remoteOnsite: "remote" as const,
  timing: "This cycle",
  experienceYears: "12",
  engagement: "Project",
  budgetProxy: "Day rate",
  description: "Creative Director available this cycle for product and brand systems.",
  requirements: "Design-systems work. Remote this cycle.",
  contact: "",
  timeline: "This cycle",
};

export const DEMO_THREAD = [
  {
    fromHandle: DEMO_HANDLE,
    body: "Hi Jordan, I came across your profile through VAEL. Your experience with design systems looks like a strong fit.",
  },
  {
    fromHandle: DEMO_COUNTERPART_HANDLE,
    body: "Thanks Alex. I'd be interested in learning more about the project.",
  },
] as const;

export type DemoDraft = {
  side: "in" | "out";
  category: string;
  discipline: string;
  skills: string;
  tools: string;
  certifications: string;
  location: string;
  remoteOnsite: "remote" | "onsite" | "hybrid";
  timing: string;
  experienceYears: string;
  engagement: string;
  budgetProxy: string;
  description: string;
  requirements: string;
  contact: string;
  timeline: string;
};

const DEMO_FEED: CommunityPost[] = [
  {
    id: "cpost_demo_jlee",
    handle: "jlee",
    districtId: "media-technology",
    kind: "looking-for",
    title: "Looking for a Creative Director",
    location: "Wellington",
    body: "Looking for a Creative Director this cycle to lead a design-systems engagement. Remote, this cycle — someone who can hold brand and product together.",
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "cpost_demo_willow",
    handle: "willowform",
    districtId: "media-technology",
    kind: "opportunity",
    title: "Studio opening a product redesign",
    location: "Portland",
    body: "Studio opening a product redesign. Need someone who can hold brand and product together through the first release.",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "cpost_demo_ridge",
    handle: "ridgeworks",
    districtId: "construction",
    kind: "collaboration",
    title: "Collaboration on a renovation electrical scope",
    location: "Nellore",
    body: "Looking to collaborate with a GC on a renovation electrical scope this cycle. Licensed crew, open to partners in Nellore and nearby.",
    createdAt: new Date(Date.now() - 9 * 3600000).toISOString(),
  },
  {
    id: "cpost_demo_lane",
    handle: "lanewest",
    districtId: "trucking",
    kind: "offering",
    title: "Capacity open on a West Coast lane",
    location: "Oakland",
    body: "Offering dry-van capacity this cycle on a West Coast lane. Clean record, on-time, available now.",
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "cpost_demo_porch",
    handle: "porchlight",
    districtId: "residential",
    kind: "discussion",
    title: "How are crews handling seasonal turnover?",
    location: "Austin",
    body: "How are crews handling seasonal turnover this year? Curious what others in Residential are seeing on the ground.",
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: "cpost_demo_northyard",
    handle: "northyard",
    districtId: "commercial",
    kind: "opportunity",
    title: "Need a facilities lead for a downtown build-out",
    location: "Chicago",
    body: "Need a facilities lead for a downtown build-out this cycle. Sites, vendors, and a clean handoff to occupancy.",
    createdAt: new Date(Date.now() - 22 * 3600000).toISOString(),
  },
  {
    id: "cpost_demo_priya",
    handle: "pshah",
    districtId: "media-technology",
    kind: "looking-for",
    title: "Looking for a Creative Director before launch",
    location: "Atlanta",
    body: "Brand designer looking for a Creative Director to set the system before a launch. Hybrid in Atlanta.",
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: "cpost_demo_northlight",
    handle: "northlight",
    districtId: "media-technology",
    kind: "opportunity",
    title: "Seeking an editor for a documentary finish",
    location: "Los Angeles",
    body: "Seeking an editor for a documentary finish this cycle. Avid. Finish support through delivery.",
    createdAt: new Date(Date.now() - 11 * 3600000).toISOString(),
  },
];

export function ensureDemoCommunityFeed() {
  ensureCommunityPosts(DEMO_FEED);
}

export function prepareDemoWorkspace() {
  ensureMtDemoSamples();
  ensureDemoCommunityFeed();
  registerAccount({
    handle: DEMO_HANDLE,
    email: DEMO_EMAIL,
    phone: DEMO_PHONE,
    displayName: DEMO_DISPLAY_NAME,
    createdAt: new Date(0).toISOString(),
  });
  const existing = getProfile(DEMO_HANDLE);
  if (!existing || existing.displayName === DEMO_HANDLE) {
    upsertProfile(ALEX_PROFILE);
  } else {
    ensureProfile(DEMO_HANDLE);
  }
}

export function demoCyclePeople(): Array<{
  id: string;
  handle: string;
  name: string;
  role: string;
  need: string;
  side: "in" | "out";
  discipline: string;
  location: string;
  hours: number;
  avatarUrl?: string;
}> {
  return getVisibleListings()
    .filter((item) => isMtSampleHandle(item.handle))
    .map((listing) => {
      const profile = getProfile(listing.handle);
      return {
        id: listing.id,
        handle: listing.handle,
        name: profile?.displayName ?? listing.handle,
        role: profile?.headline || listing.category || listing.discipline,
        need: listing.side === "out" ? "Needs someone" : "Available",
        side: listing.side,
        discipline: listing.discipline,
        location: listing.location,
        hours: hoursLeft(listing.expiresAt),
        avatarUrl: profile?.avatarUrl,
      };
    })
    .sort((a, b) => a.hours - b.hours);
}

export function resetClientDemoData() {
  clearActorLoop(DEMO_HANDLE);
  upsertProfile(ALEX_PROFILE);
  ensureMtDemoSamples();
  ensureDemoCommunityFeed();
  clearDemoDraft();
  clearOnboardingDrafts();
  clearAccountsExcept([DEMO_HANDLE]);
}

export function demoHasActiveVael() {
  return Boolean(getActiveListing(DEMO_HANDLE));
}

/** Anyone can sign up now, so a saved draft belongs to one handle rather than the device. */
function draftKey(handle: string) {
  return handle === DEMO_HANDLE ? DEMO_DRAFT_KEY : `${DEMO_DRAFT_KEY}_${handle}`;
}

export function loadDemoDraft(handle: string = DEMO_HANDLE): DemoDraft | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(draftKey(handle));
    return raw ? (JSON.parse(raw) as DemoDraft) : null;
  } catch {
    return null;
  }
}

export function saveDemoDraft(draft: DemoDraft, handle: string = DEMO_HANDLE) {
  localStorage.setItem(draftKey(handle), JSON.stringify(draft));
}

export function clearDemoDraft(handle: string = DEMO_HANDLE) {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(draftKey(handle));
}

export function seedDemoConversation(connectionId: string) {
  const connection = getConnection(connectionId);
  if (!connection) return;
  const you = connection.requesterHandle;
  const them = connection.counterpartHandle;
  const theirName = getProfile(them)?.displayName ?? them;
  seedThreadIfEmpty(connectionId, [
    {
      fromHandle: you,
      body: `Hi ${theirName.split(" ")[0]}, I came across your availability through VAEL. The fit looks strong for this cycle.`,
    },
    {
      fromHandle: them,
      body: "Thanks for reaching out. I'd like to hear more about the work and the timeline.",
    },
    {
      fromHandle: you,
      body: "It's a design-systems engagement this cycle. Remote. Once we Handshake, I can share the brief and rates.",
    },
    {
      fromHandle: them,
      body: "That timing works. Happy to open the conversation and go from there.",
    },
    {
      fromHandle: you,
      body: "Great — the private room is open. I'll send the brief here.",
    },
  ]);
}
