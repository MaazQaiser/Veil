import { beforeEach, describe, expect, it } from "vitest";
import { publishCxListing } from "./constructionStore";
import {
  applyMarketplaceChips,
  collectForDistrict,
  collectRecommended,
  isImmediateAvailability,
  isNewListing,
  marketplaceHref,
  matchesMarketplaceChip,
  parseMarketplaceFilter,
  setAvailabilityHref,
  showRemoteChip,
  sortMarketplace,
  type MarketplaceMatch,
} from "./marketplace";
import { matchingBoardRoute, patchOnboarding, startOnboarding } from "./onboarding";
import { publishListing } from "./vaelStore";

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

function sampleMatch(overrides: Partial<MarketplaceMatch> = {}): MarketplaceMatch {
  return {
    districtId: "media-technology",
    listingId: "vael_1",
    percent: 92,
    title: "Product Designer",
    districtLabel: "Media & Technology",
    locationLine: "Remote · Available Now",
    chips: ["UX Design", "Figma"],
    whyMatch: ["Skills", "Discipline"],
    href: "/media-technology/board/vael_1",
    isNew: true,
    isRemote: true,
    isAvailableNow: true,
    ...overrides,
  };
}

function publishMtPair() {
  publishListing({
    handle: "maaz",
    side: "in",
    category: "Designer",
    discipline: "Software",
    skills: ["UX/UI", "Figma", "Design Systems"],
    tools: ["Figma"],
    certifications: [],
    location: "Atlanta",
    remoteOnsite: "remote",
    timing: "This cycle",
    experienceYears: 8,
    engagement: "Project",
    budgetProxy: "Day rate",
    description: "Available this cycle.",
    requirements: "",
    contact: "",
    timeline: "This cycle",
  });
  return publishListing({
    handle: "jordan",
    side: "out",
    category: "Designer",
    discipline: "Software",
    skills: ["UX/UI", "Figma"],
    tools: ["Figma"],
    certifications: [],
    location: "Atlanta",
    remoteOnsite: "remote",
    timing: "This cycle",
    experienceYears: 7,
    engagement: "Project",
    budgetProxy: "Day rate",
    description: "Needs a designer this cycle.",
    requirements: "",
    contact: "",
    timeline: "This cycle",
  });
}

function publishCxPair() {
  publishCxListing({
    handle: "maaz",
    side: "out",
    trade: "Electrical",
    jobType: "Renovation",
    capabilities: ["Panel", "Lighting"],
    serviceArea: "Atlanta",
    availability: "This cycle",
    experienceYears: 8,
    credentials: ["Trade license on file"],
    insuranceNoted: true,
    description: "Needs electrical this cycle.",
    requirements: "",
    contact: "",
    timeline: "This cycle",
    scopeNote: "",
  });
  return publishCxListing({
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
    description: "Electrical crew available.",
    requirements: "",
    contact: "",
    timeline: "This cycle",
    scopeNote: "",
  });
}

describe("marketplace filters", () => {
  it("parses district query values and defaults to recommended", () => {
    expect(parseMarketplaceFilter(null)).toBe("recommended");
    expect(parseMarketplaceFilter("recommended")).toBe("recommended");
    expect(parseMarketplaceFilter("all")).toBe("all");
    expect(parseMarketplaceFilter("construction")).toBe("construction");
    expect(parseMarketplaceFilter("unknown")).toBe("recommended");
  });

  it("hides the Remote chip on non-MT district filters", () => {
    expect(showRemoteChip("recommended")).toBe(true);
    expect(showRemoteChip("all")).toBe(true);
    expect(showRemoteChip("media-technology")).toBe(true);
    expect(showRemoteChip("construction")).toBe(false);
    expect(showRemoteChip("trucking")).toBe(false);
  });

  it("treats this cycle / today / now / available as immediate", () => {
    expect(isImmediateAvailability("This cycle")).toBe(true);
    expect(isImmediateAvailability("today")).toBe(true);
    expect(isImmediateAvailability("Available now")).toBe(true);
    expect(isImmediateAvailability("Next two weeks")).toBe(false);
    expect(isImmediateAvailability("Flexible")).toBe(false);
  });

  it("marks listings new within four hours", () => {
    const now = Date.parse("2026-09-01T12:00:00.000Z");
    expect(isNewListing(new Date(now - 2 * 60 * 60 * 1000).toISOString(), now)).toBe(true);
    expect(isNewListing(new Date(now - 5 * 60 * 60 * 1000).toISOString(), now)).toBe(false);
  });

  it("applies 90%+, Available Now, Remote, and New chips", () => {
    const strong = sampleMatch({ percent: 92, isAvailableNow: true, isRemote: true, isNew: true });
    const weak = sampleMatch({
      listingId: "vael_2",
      percent: 81,
      isAvailableNow: false,
      isRemote: false,
      isNew: false,
    });
    expect(matchesMarketplaceChip(strong, "90+")).toBe(true);
    expect(matchesMarketplaceChip(weak, "90+")).toBe(false);
    expect(applyMarketplaceChips([strong, weak], ["90+"]).map((item) => item.listingId)).toEqual(["vael_1"]);
    expect(applyMarketplaceChips([strong, weak], ["available-now"]).map((item) => item.listingId)).toEqual(["vael_1"]);
    expect(applyMarketplaceChips([strong, weak], ["remote"]).map((item) => item.listingId)).toEqual(["vael_1"]);
    expect(applyMarketplaceChips([strong, weak], ["new"]).map((item) => item.listingId)).toEqual(["vael_1"]);
  });

  it("uses home district as a percent tie-break", () => {
    const mt = sampleMatch({ districtId: "media-technology", listingId: "mt_1", percent: 88 });
    const cx = sampleMatch({
      districtId: "construction",
      listingId: "cx_1",
      percent: 88,
      title: "Electrical",
      href: "/districts/contractor/board/cx_1",
    });
    expect(sortMarketplace([mt, cx], "construction").map((item) => item.districtId)).toEqual([
      "construction",
      "media-technology",
    ]);
  });
});

describe("marketplace collectors", () => {
  it("returns no recommended matches when you are not vaeled", () => {
    expect(collectRecommended("maaz")).toEqual([]);
  });

  it("recommends only districts where you have an active listing", () => {
    const counterpart = publishMtPair();
    const recommended = collectRecommended("maaz");
    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended.every((item) => item.districtId === "media-technology")).toBe(true);
    expect(recommended.some((item) => item.listingId === counterpart.id)).toBe(true);
    expect(collectForDistrict("maaz", "construction")).toEqual([]);
    expect(collectRecommended("maaz").some((item) => item.districtId === "construction")).toBe(false);
  });

  it("maps a Construction match without Media & Technology fields", () => {
    publishMtPair();
    const counterpart = publishCxPair();
    const construction = collectForDistrict("maaz", "construction");
    expect(construction.length).toBeGreaterThan(0);
    const match = construction.find((item) => item.listingId === counterpart.id);
    expect(match?.title).toBe("Electrical");
    expect(match?.districtLabel).toBe("Construction");
    expect(match?.chips).toContain("Panel");
    expect(match?.whyMatch).toEqual(expect.arrayContaining(["Panel", "Lighting"]));
    expect(match?.whyMatch.length).toBeLessThanOrEqual(3);
    expect(match?.href).toBe(`/districts/contractor/board/${counterpart.id}`);
    expect(match?.isRemote).toBe(false);
    expect(match?.isAvailableNow).toBe(true);
    expect(match?.whyMatch.length).toBeLessThanOrEqual(3);
  });

  it("maps a Media & Technology match onto the shared card shape", () => {
    const counterpart = publishMtPair();
    const [match] = collectForDistrict("maaz", "media-technology");
    expect(match.listingId).toBe(counterpart.id);
    expect(match.title).toBe("Designer Opportunity");
    expect(match.districtLabel).toBe("Media & Technology");
    expect(match.chips).toContain("UX/UI");
    expect(match.whyMatch).toEqual(["UX/UI", "Figma"]);
    expect(match.href).toBe(`/media-technology/board/${counterpart.id}`);
    expect(match.isRemote).toBe(true);
    expect(match.isAvailableNow).toBe(true);
    expect(match.isNew).toBe(true);
    expect(match.whyMatch.length).toBeLessThanOrEqual(3);
  });
});

describe("marketplace routes", () => {
  it("builds /matches hrefs and onboarding board routes", () => {
    expect(marketplaceHref("recommended")).toBe("/matches");
    expect(marketplaceHref("all")).toBe("/matches?district=all");
    expect(marketplaceHref("construction")).toBe("/matches?district=construction");
    expect(matchingBoardRoute("media-technology")).toBe("/matches?district=media-technology");
    expect(matchingBoardRoute("construction")).toBe("/matches?district=construction");
    expect(matchingBoardRoute("")).toBe("/matches");
  });

  it("sends Set availability to the onboarding district vael when known", () => {
    startOnboarding("maaz");
    patchOnboarding("maaz", { districtId: "construction" });
    expect(setAvailabilityHref("maaz")).toBe("/districts/contractor/vael");
    expect(setAvailabilityHref("unknown")).toBe("/media-technology/vael?create=1");
  });
});
