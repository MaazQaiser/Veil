import { beforeEach, describe, expect, it } from "vitest";
import { createAccount, findAccountByEmail } from "./accounts";
import { resetVaelDemoAccounts } from "./demoReset";
import { patchOnboarding, getOnboardingDraft, startOnboarding } from "./onboarding";
import { addManualDistricts, getManuallyJoinedDistrictIds } from "./myDistricts";
import { toggleSavedListing, getSavedListingIds } from "./savedMatches";
import {
  acceptHandshake,
  getConnections,
  getMessages,
  getNotices,
  getProfile,
  publishListing,
  requestHandshake,
  saveProfile,
  sendMessage,
  ensureProfile,
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

describe("resetVaelDemoAccounts", () => {
  it("removes a demo account and every trace of it, leaving unrelated handles untouched", () => {
    const inAccount = createAccount({
      email: "demo.in@example.com",
      handle: "demoin",
      displayName: "Demo In",
      phone: "0000000000",
    });
    const outAccount = createAccount({
      email: "demo.out@example.com",
      handle: "demoout",
      displayName: "Demo Out",
      phone: "0000000001",
    });
    const bystander = createAccount({
      email: "bystander@example.com",
      handle: "bystander",
      displayName: "Bystander",
      phone: "0000000002",
    });

    startOnboarding(inAccount.handle);
    patchOnboarding(inAccount.handle, { intent: "in" });
    addManualDistricts(inAccount.handle, ["media-technology"]);
    saveProfile({ ...ensureProfile(inAccount.handle), displayName: "Demo In" });
    const inListing = publishListing({
      handle: inAccount.handle,
      side: "in",
      category: "Designer",
      discipline: "Software",
      skills: ["UX/UI"],
      tools: [],
      certifications: [],
      location: "Remote",
      remoteOnsite: "remote",
      timing: "This cycle",
      experienceYears: 3,
      engagement: "Project",
      budgetProxy: "To discuss",
      description: "Available this cycle.",
      requirements: "",
      contact: "",
      timeline: "This cycle",
    });
    toggleSavedListing(bystander.handle, inListing.id);

    saveProfile({ ...ensureProfile(outAccount.handle), displayName: "Demo Out" });
    publishListing({
      handle: outAccount.handle,
      side: "out",
      category: "Designer",
      discipline: "Software",
      skills: ["UX/UI"],
      tools: [],
      certifications: [],
      location: "Remote",
      remoteOnsite: "remote",
      timing: "This cycle",
      experienceYears: 0,
      engagement: "Project",
      budgetProxy: "To discuss",
      description: "Looking to hire this cycle.",
      requirements: "",
      contact: "",
      timeline: "This cycle",
    });

    const connection = requestHandshake({
      fromHandle: outAccount.handle,
      toHandle: inAccount.handle,
      source: "board_match",
    });
    acceptHandshake(connection.id, inAccount.handle);
    sendMessage(connection.id, outAccount.handle, "Hi, let's connect.");

    toggleSavedListing(inAccount.handle, inListing.id);

    const removed = resetVaelDemoAccounts(["demo.in@example.com", "demo.out@example.com"]);
    expect(removed.sort()).toEqual(["demoin", "demoout"]);

    // Both demo accounts are fully gone.
    expect(findAccountByEmail("demo.in@example.com")).toBeUndefined();
    expect(findAccountByEmail("demo.out@example.com")).toBeUndefined();
    expect(getProfile(inAccount.handle)).toBeUndefined();
    expect(getProfile(outAccount.handle)).toBeUndefined();
    expect(getOnboardingDraft(inAccount.handle)).toBeUndefined();
    expect(getManuallyJoinedDistrictIds(inAccount.handle)).toEqual([]);
    expect(getSavedListingIds(inAccount.handle)).toEqual([]);
    expect(getConnections().some((item) => item.id === connection.id)).toBe(false);
    expect(getMessages(connection.id)).toEqual([]);
    expect(getNotices(inAccount.handle)).toEqual([]);
    expect(getNotices(outAccount.handle)).toEqual([]);

    // The bystander account and its data survive untouched.
    expect(findAccountByEmail("bystander@example.com")).toBeDefined();
    expect(getSavedListingIds(bystander.handle)).toEqual([inListing.id]);
  });

  it("skips emails with no matching account instead of throwing", () => {
    expect(resetVaelDemoAccounts(["nobody@example.com"])).toEqual([]);
  });
});
