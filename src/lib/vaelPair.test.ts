import { beforeEach, describe, expect, it } from "vitest";
import { createAccount, findAccountByIdentity } from "./accounts";
import {
  acceptHandshake,
  getActiveListing,
  getConnection,
  publishListing,
  rankMatches,
  requestHandshake,
  saveProfile,
  ensureProfile,
} from "./vaelStore";
import { addManualDistricts } from "./myDistricts";
import {
  VAEL_OUT_DISPLAY_NAME,
  VAEL_OUT_EMAIL,
  VAEL_OUT_HANDLE,
  VAEL_OUT_PASSWORD,
  ensureVaelOutAccount,
  isVaelOutIdentity,
} from "./vaelPair";

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

describe("Vael In / Vael Out pair", () => {
  it("signs in by email, handle, or display name", () => {
    ensureVaelOutAccount();
    expect(VAEL_OUT_EMAIL).toBe("aqsaamjad099@gmail.com");
    expect(VAEL_OUT_PASSWORD).toBe("123456");
    expect(isVaelOutIdentity("aqsaamjad099@gmail.com")).toBe(true);
    expect(findAccountByIdentity(VAEL_OUT_EMAIL)?.handle).toBe(VAEL_OUT_HANDLE);
    expect(findAccountByIdentity("akshayamjad")?.handle).toBe(VAEL_OUT_HANDLE);
    expect(findAccountByIdentity(VAEL_OUT_DISPLAY_NAME)?.handle).toBe(VAEL_OUT_HANDLE);
  });

  it("connects the Out account to a visible In counterpart", () => {
    const inAccount = createAccount({
      email: "aqsa.amjad@gmail.com",
      handle: "aqsaamjad",
      displayName: "aqsa amjad",
      phone: "0000000000",
    });
    saveProfile({
      ...ensureProfile(inAccount.handle),
      displayName: "aqsa amjad",
      location: "Lahore",
      disciplines: ["Software"],
      skills: ["UX/UI", "Design Systems", "Brand"],
      tools: ["Figma"],
      headline: "Creative Director",
    });
    addManualDistricts(inAccount.handle, ["media-technology"]);
    const inListing = publishListing({
      handle: inAccount.handle,
      side: "in",
      category: "Designer",
      discipline: "Software",
      skills: ["UX/UI", "Design Systems", "Brand"],
      tools: ["Figma"],
      certifications: [],
      location: "Lahore",
      remoteOnsite: "remote",
      timing: "This cycle",
      experienceYears: 6,
      engagement: "Project",
      budgetProxy: "Day rate",
      description: "Available this cycle.",
      requirements: "",
      contact: "",
      timeline: "This cycle",
    });

    ensureVaelOutAccount();
    const outMatches = rankMatches(inListing);
    const akshay = outMatches.find((item) => item.listing.handle === VAEL_OUT_HANDLE);
    expect(akshay).toBeTruthy();
    expect(akshay!.listing.side).toBe("out");

    const outListing = akshay!.listing;
    const inMatches = rankMatches(outListing);
    expect(inMatches.some((item) => item.listing.handle === inAccount.handle)).toBe(true);
  });

  it("lets the Out account accept a handshake requested by In", () => {
    const inAccount = createAccount({
      email: "aqsa.amjad@gmail.com",
      handle: "aqsaamjad",
      displayName: "aqsa amjad",
      phone: "0000000000",
    });
    saveProfile({
      ...ensureProfile(inAccount.handle),
      displayName: "aqsa amjad",
      location: "Lahore",
      disciplines: ["Software"],
      skills: ["UX/UI"],
      tools: ["Figma"],
      headline: "Creative Director",
    });
    const inListing = publishListing({
      handle: inAccount.handle,
      side: "in",
      category: "Designer",
      discipline: "Software",
      skills: ["UX/UI"],
      tools: ["Figma"],
      certifications: [],
      location: "Lahore",
      remoteOnsite: "remote",
      timing: "This cycle",
      experienceYears: 6,
      engagement: "Project",
      budgetProxy: "Day rate",
      description: "Available this cycle.",
      requirements: "",
      contact: "",
      timeline: "This cycle",
    });

    const outHandle = ensureVaelOutAccount();
    const outListing = getActiveListing(outHandle)!;
    const connection = requestHandshake({
      fromHandle: inAccount.handle,
      toHandle: outHandle,
      source: "board_match",
      listingId: outListing.id,
    });
    expect(connection.status).toBe("pending");
    expect(connection.counterpartHandle).toBe(outHandle);

    acceptHandshake(connection.id, outHandle);
    expect(getConnection(connection.id)?.status).toBe("connected");
    expect(rankMatches(inListing).some((item) => item.listing.handle === outHandle)).toBe(true);
  });

  it("keeps the Out listing matched to the In counterpart after a refresh", () => {
    const inAccount = createAccount({
      email: "aqsa.amjad@gmail.com",
      handle: "aqsaamjad",
      displayName: "aqsa amjad",
      phone: "0000000000",
    });
    saveProfile({
      ...ensureProfile(inAccount.handle),
      displayName: "aqsa amjad",
      location: "Lahore",
      disciplines: ["Software"],
      skills: ["UX/UI"],
      tools: ["Figma"],
      headline: "Creative Director",
    });
    addManualDistricts(inAccount.handle, ["media-technology"]);
    publishListing({
      handle: inAccount.handle,
      side: "in",
      category: "Designer",
      discipline: "Software",
      skills: ["UX/UI"],
      tools: ["Figma"],
      certifications: [],
      location: "Lahore",
      remoteOnsite: "remote",
      timing: "This cycle",
      experienceYears: 6,
      engagement: "Project",
      budgetProxy: "Day rate",
      description: "Available this cycle.",
      requirements: "",
      contact: "",
      timeline: "This cycle",
    });

    const first = ensureVaelOutAccount();
    const firstListing = getActiveListing(first)!;
    expect(firstListing.skills).toEqual(["UX/UI"]);

    publishListing({
      handle: inAccount.handle,
      side: "in",
      category: "Designer",
      discipline: "Software",
      skills: ["UX/UI", "Brand"],
      tools: ["Figma"],
      certifications: [],
      location: "Lahore",
      remoteOnsite: "remote",
      timing: "This cycle",
      experienceYears: 6,
      engagement: "Project",
      budgetProxy: "Day rate",
      description: "Available this cycle.",
      requirements: "",
      contact: "",
      timeline: "This cycle",
    });

    ensureVaelOutAccount();
    const refreshed = getActiveListing(first)!;
    expect(refreshed.id).toBe(firstListing.id);
    expect(refreshed.skills).toEqual(["UX/UI", "Brand"]);
  });
});
