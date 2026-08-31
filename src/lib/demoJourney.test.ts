import { beforeEach, describe, expect, it } from "vitest";
import { scoreMatch } from "./matching";
import {
  ALEX_PROFILE,
  ALEX_VAEL_DEFAULTS,
  DEMO_HANDLE,
  demoCyclePeople,
  prepareDemoWorkspace,
  resetClientDemoData,
  saveDemoDraft,
  loadDemoDraft,
} from "./demoJourney";
import { getCommunityPosts } from "./communityStore";
import {
  getActiveListing,
  getConnections,
  getNotices,
  getProfile,
  getVisibleListings,
  publishListing,
  rankMatches,
  requestHandshake,
  toMatchable,
} from "./vaelStore";

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => memory.clear(),
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() {
      return memory.size;
    },
  } as Storage;
});

describe("Client demo journey", () => {
  it("prepares Alex Morgan and sample counterparts on this device", () => {
    prepareDemoWorkspace();
    const profile = getProfile(DEMO_HANDLE);
    expect(profile?.displayName).toBe("Alex Morgan");
    expect(profile?.headline).toBe("Creative Director");
    expect(getVisibleListings().some((item) => item.handle === "jlee")).toBe(true);
    expect(getVisibleListings().some((item) => item.handle === "willowform")).toBe(true);
    expect(getVisibleListings().some((item) => item.handle === "pshah")).toBe(true);
    expect(getCommunityPosts().some((item) => item.id === "cpost_demo_jlee")).toBe(true);
    expect(demoCyclePeople().some((item) => item.handle === "jlee" && item.need === "Needs someone")).toBe(true);
  });

  it("ranks Jordan Lee as a strong opposite-side match for Alex's default VAEL", () => {
    prepareDemoWorkspace();
    const listing = publishListing({
      handle: DEMO_HANDLE,
      side: "in",
      category: ALEX_VAEL_DEFAULTS.category,
      discipline: ALEX_VAEL_DEFAULTS.discipline,
      skills: ["UX/UI", "Design Systems", "Brand"],
      tools: ["Figma"],
      certifications: [],
      location: ALEX_VAEL_DEFAULTS.location,
      remoteOnsite: "remote",
      timing: ALEX_VAEL_DEFAULTS.timing,
      experienceYears: 12,
      engagement: ALEX_VAEL_DEFAULTS.engagement,
      budgetProxy: ALEX_VAEL_DEFAULTS.budgetProxy,
      description: ALEX_VAEL_DEFAULTS.description,
      requirements: ALEX_VAEL_DEFAULTS.requirements,
      contact: "",
      timeline: ALEX_VAEL_DEFAULTS.timeline,
    });
    const ranked = rankMatches(listing);
    const jordan = ranked.find((item) => item.listing.handle === "jlee");
    expect(jordan).toBeTruthy();
    expect(jordan!.percent).toBeGreaterThanOrEqual(80);
    expect(jordan!.listing.side).toBe("out");
  });

  it("resets Alex to not visible, with no handshake or connection", () => {
    prepareDemoWorkspace();
    publishListing({
      handle: DEMO_HANDLE,
      side: "in",
      category: "Designer",
      discipline: "Software",
      skills: ["UX/UI"],
      tools: ["Figma"],
      certifications: [],
      location: "Atlanta",
      remoteOnsite: "remote",
      timing: "This cycle",
      experienceYears: 12,
      engagement: "Project",
      budgetProxy: "Day rate",
      description: "Available.",
      requirements: "",
      contact: "",
      timeline: "This cycle",
    });
    requestHandshake({ fromHandle: DEMO_HANDLE, toHandle: "jlee", source: "board_match", listingId: "vael_jlee" });
    saveDemoDraft(ALEX_VAEL_DEFAULTS);
    resetClientDemoData();
    expect(getActiveListing(DEMO_HANDLE)).toBeUndefined();
    expect(getConnections().some((item) => item.requesterHandle === DEMO_HANDLE)).toBe(false);
    expect(getProfile(DEMO_HANDLE)?.displayName).toBe(ALEX_PROFILE.displayName);
    expect(loadDemoDraft()).toBeNull();
  });

  it("tells the sender their Handshake is pending, with a way back to it", () => {
    prepareDemoWorkspace();
    const connection = requestHandshake({
      fromHandle: DEMO_HANDLE,
      toHandle: "jlee",
      source: "board_match",
      listingId: "vael_jlee",
    });
    const mine = getNotices(DEMO_HANDLE);
    expect(mine).toHaveLength(1);
    expect(mine[0].title).toBe("Handshake sent");
    expect(mine[0].href).toBe(`/media-technology/connections/${connection.id}`);
    expect(getNotices("jlee")[0].title).toBe("Handshake requested");
  });

  it("does not retune matching weights for the demo pair", () => {
    const offering = toMatchable({
      id: "a",
      handle: DEMO_HANDLE,
      side: "in",
      category: "Designer",
      discipline: "Software",
      skills: ["UX/UI", "Design Systems", "Brand"],
      tools: ["Figma"],
      certifications: [],
      location: "Atlanta",
      remoteOnsite: "remote",
      timing: "This cycle",
      experienceYears: 12,
      engagement: "Project",
      budgetProxy: "Day rate",
      description: "x",
      requirements: "",
      contact: "",
      timeline: "",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      plan: "daily",
    });
    const seeking = toMatchable({
      id: "b",
      handle: "jlee",
      side: "out",
      category: "Designer",
      discipline: "Software",
      skills: ["UX/UI", "Design Systems", "Brand"],
      tools: ["Figma"],
      certifications: [],
      location: "Atlanta",
      remoteOnsite: "remote",
      timing: "This cycle",
      experienceYears: 9,
      engagement: "Project",
      budgetProxy: "Day rate",
      description: "y",
      requirements: "",
      contact: "",
      timeline: "",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      plan: "daily",
    });
    expect(scoreMatch(offering, seeking).percent).toBeGreaterThanOrEqual(80);
  });
});
