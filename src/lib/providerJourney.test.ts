import { describe, expect, it } from "vitest";
import { documentChecklist } from "@/components/mt/HomeWidgets";
import { ALEX_PROFILE } from "./demoJourney";
import { profileCompletion, PRODUCT_HOME, profileReady } from "./providerJourney";
import type { ProfileRecord } from "./vaelStore";

const empty: ProfileRecord = {
  handle: "maaz",
  displayName: "",
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

describe("product home", () => {
  it("keeps the Professional hub at /media-technology", () => {
    expect(PRODUCT_HOME).toBe("/media-technology");
  });

  it("treats a blank profile as 0% complete", () => {
    const result = profileCompletion(empty);
    expect(result.percent).toBe(0);
    expect(result.prompt).toBe("Add your name to improve your profile.");
    expect(profileReady(empty)).toBe(false);
  });

  it("scores Alex without certifications or documents and asks for certifications", () => {
    const result = profileCompletion(ALEX_PROFILE);
    expect(result.percent).toBe(82);
    expect(result.prompt).toBe("Add certifications to improve your profile.");
    expect(profileReady(ALEX_PROFILE)).toBe(true);
  });

  it("reaches 100% when every bucket is filled", () => {
    const result = profileCompletion(
      { ...ALEX_PROFILE, credentials: "AIGA" },
      [{ id: "doc_1", handle: ALEX_PROFILE.handle, type: "capability", title: "Capability", publicFlag: false }],
    );
    expect(result.percent).toBe(100);
    expect(result.prompt).toBe("Your profile is complete.");
  });

  it("lists document checklist from profile fields and document types", () => {
    const items = documentChecklist(ALEX_PROFILE, [
      { id: "doc_1", handle: ALEX_PROFILE.handle, type: "insurance", title: "Insurance", publicFlag: false },
    ]);
    expect(items).toEqual([
      { label: "Portfolio", done: true },
      { label: "Certifications", done: false },
      { label: "License", done: false },
      { label: "Insurance", done: true },
      { label: "Capability statement", done: false },
    ]);
  });
});
