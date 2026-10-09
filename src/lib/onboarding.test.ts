import { beforeEach, describe, expect, it } from "vitest";
import {
  createAccount,
  findAccountByHandle,
  handleIssue,
  isHandleAvailable,
  renameAccountHandle,
  suggestHandle,
} from "./accounts";
import {
  claimOnboardingHandle,
  clearOnboardingDrafts,
  completeOnboardingStep,
  finishOnboarding,
  getOnboardingDraft,
  matchingBoardRoute,
  onboardingComplete,
  onboardingRoute,
  onboardingStep,
  patchOnboarding,
  signedInLanding,
  startOnboarding,
} from "./onboarding";
import { routeForGoVisibleEntry } from "./goVisible";
import { ensureProfile, getProfile, saveProfile } from "./vaelStore";

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

describe("handle claim", () => {
  it("rejects reserved and short handles", () => {
    expect(handleIssue("vael")).toBe("That handle is reserved.");
    expect(handleIssue("ab")).toBe("Use at least 3 characters.");
    expect(handleIssue("Maaz_1")).toBe("Use letters and numbers only.");
    expect(handleIssue("maaz")).toBeNull();
  });

  it("creates an account with an explicit handle", () => {
    const account = createAccount({ email: "maaz@example.com", handle: "maaz" });
    expect(account.handle).toBe("maaz");
    expect(findAccountByHandle("maaz")?.email).toBe("maaz@example.com");
  });

  it("reports availability against existing accounts", () => {
    createAccount({ email: "a@example.com", handle: "taken" });
    expect(isHandleAvailable("taken")).toBe(false);
    expect(isHandleAvailable("open")).toBe(true);
    expect(isHandleAvailable("taken", "taken")).toBe(true);
  });

  it("renames an account handle", () => {
    createAccount({ email: "a@example.com", handle: "oldname" });
    renameAccountHandle("oldname", "newname");
    expect(findAccountByHandle("oldname")).toBeUndefined();
    expect(findAccountByHandle("newname")?.email).toBe("a@example.com");
  });

  it("still suffixes a taken suggestion", () => {
    createAccount({ email: "first@example.com", handle: "jordan" });
    expect(suggestHandle("Jordan", "jordan@example.com")).toBe("jordan2");
  });
});

describe("onboarding resume", () => {
  it("starts at Intent after sign-up and advances by completed step", () => {
    startOnboarding("maaz");
    expect(onboardingStep("maaz")).toBe("Intent");
    completeOnboardingStep("maaz", "Intent");
    expect(onboardingStep("maaz")).toBe("Welcome");
    expect(onboardingRoute("maaz")).toBe("/join/welcome");
    completeOnboardingStep("maaz", "Welcome");
    expect(onboardingStep("maaz")).toBe("Profile Setup");
    completeOnboardingStep("maaz", "Profile Setup");
    expect(onboardingStep("maaz")).toBe("Identity");
    expect(onboardingRoute("maaz")).toBe("/join/identity");
  });

  it("maps a legacy Profile completed step onto Credentials", () => {
    startOnboarding("maaz");
    localStorage.setItem(
      "vael_onboarding_v1",
      JSON.stringify({
        maaz: {
          handle: "maaz",
          profileType: "individual",
          districtId: "media-technology",
          handleClaimed: true,
          completedStep: "Profile",
        },
      }),
    );
    expect(onboardingStep("maaz")).toBe("Preview");
    expect(onboardingRoute("maaz")).toBe("/join/preview");
  });

  it("hands Construction off to that district's profile editor", () => {
    startOnboarding("maaz");
    patchOnboarding("maaz", { districtId: "construction", completedStep: "Profile Setup" });
    expect(onboardingRoute("maaz")).toBe("/districts/contractor/profile/maaz/edit");
  });

  it("keeps Vael In on welcome and sends Vael Out to its own steps after Intent", () => {
    startOnboarding("maaz");
    patchOnboarding("maaz", { intent: "in", completedStep: "Intent" });
    expect(onboardingStep("maaz")).toBe("Welcome");
    expect(onboardingRoute("maaz")).toBe("/join/welcome");
    patchOnboarding("maaz", { intent: "out", completedStep: "Intent" });
    expect(onboardingRoute("maaz")).toBe("/join/out/need");
    patchOnboarding("maaz", { outStep: "location" });
    expect(onboardingRoute("maaz")).toBe("/join/out/location");
    patchOnboarding("maaz", { outStep: "submitted", completedStep: "Done", completedAt: "2026-09-26T00:00:00.000Z" });
    expect(onboardingRoute("maaz")).toBe("/join/done");
  });

  it("starts Vael Out onboarding at What I need and leaves Vael In on welcome", () => {
    startOnboarding("maaz");
    expect(routeForGoVisibleEntry("maaz", "out")).toBe("/join/out/need");
    expect(getOnboardingDraft("maaz")?.intent).toBe("out");
    expect(getOnboardingDraft("maaz")?.outStep).toBe("need");

    startOnboarding("ina");
    expect(routeForGoVisibleEntry("ina", "in")).toBe("/join/welcome");
    expect(getOnboardingDraft("ina")?.intent).toBe("in");

    expect(routeForGoVisibleEntry("ina", "opportunities")).toBe("/need");
    expect(getOnboardingDraft("ina")?.intent).toBe("in");
  });

  it("routes I need something done past district selection into Contractor Exchange", () => {
    startOnboarding("maaz");
    patchOnboarding("maaz", { intent: "need", completedStep: "Intent" });
    expect(onboardingStep("maaz")).toBe("Need");
    expect(onboardingRoute("maaz")).toBe("/join/need");
    expect(onboardingRoute("maaz")).not.toBe("/join/setup");
    expect(onboardingRoute("maaz")).not.toBe("/join/welcome");

    patchOnboarding("maaz", { needPlace: "home", districtId: "construction" });
    expect(onboardingRoute("maaz")).toBe("/need/home");

    patchOnboarding("maaz", { needPlace: "business" });
    expect(onboardingRoute("maaz")).toBe("/districts/contractor/vael?side=out");
  });

  it("lands sign-in on the dashboard, including members who started residential", () => {
    startOnboarding("maaz");
    patchOnboarding("maaz", { intent: "need", needPlace: "home", completedStep: "Intent" });
    expect(signedInLanding("maaz")).toBe("/media-technology");
    finishOnboarding("maaz");
    expect(signedInLanding("maaz")).toBe("/media-technology");
  });

  it("treats a finished draft as complete", () => {
    startOnboarding("maaz");
    finishOnboarding("maaz");
    expect(onboardingComplete("maaz")).toBe(true);
    expect(onboardingStep("maaz")).toBe("Done");
  });

  it("treats a ready profile with no draft as already onboarded", () => {
    ensureProfile("alex");
    saveProfile({
      ...getProfile("alex")!,
      displayName: "Alex Morgan",
      headline: "Creative Director",
      disciplines: ["Software"],
      skills: ["Figma"],
      tools: ["Figma"],
      location: "Atlanta",
    });
    expect(onboardingComplete("alex")).toBe(true);
  });

  it("claims a handle and moves the draft", () => {
    createAccount({ email: "maaz@example.com", handle: "maaztmp" });
    ensureProfile("maaztmp");
    startOnboarding("maaztmp");
    const result = claimOnboardingHandle("maaztmp", "maaz");
    expect(result).toEqual({ ok: true, handle: "maaz" });
    expect(getOnboardingDraft("maaz")?.handleClaimed).toBe(true);
    expect(getOnboardingDraft("maaztmp")).toBeUndefined();
    expect(getProfile("maaz")?.handle).toBe("maaz");
  });

  it("sends the matching board to the unified marketplace", () => {
    expect(matchingBoardRoute("media-technology")).toBe("/matches?district=media-technology");
    expect(matchingBoardRoute("construction")).toBe("/matches?district=construction");
    expect(matchingBoardRoute("")).toBe("/matches");
  });

  it("clears drafts", () => {
    startOnboarding("maaz");
    clearOnboardingDrafts();
    expect(getOnboardingDraft("maaz")).toBeUndefined();
  });
});
