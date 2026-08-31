import { describe, expect, it } from "vitest";
import { districtFromPath, districts, isDistrictEnterable, primaryDistricts } from "./districts";

describe("City district registry", () => {
  it("keeps Media & Technology, Construction, Trucking, Residential, and Commercial as live primary Rooms", () => {
    const live = primaryDistricts.filter((d) => d.status === "live");
    expect(live.map((d) => d.id).sort()).toEqual([
      "commercial",
      "construction",
      "media-technology",
      "residential",
      "trucking",
    ]);
    expect(live.find((d) => d.id === "media-technology")?.route).toBe("/media-technology");
    expect(live.find((d) => d.id === "construction")?.route).toBe("/districts/contractor");
    expect(live.find((d) => d.id === "trucking")?.route).toBe("/districts/trucking");
    expect(live.find((d) => d.id === "residential")?.route).toBe("/districts/residential");
    expect(live.find((d) => d.id === "commercial")?.route).toBe("/districts/commercial");
  });

  it("keeps Construction on the existing contractor slug", () => {
    const construction = districts.find((d) => d.id === "construction");
    expect(construction?.route).toBe("/districts/contractor");
    expect(construction?.status).toBe("live");
    expect(isDistrictEnterable(construction!)).toBe(true);
  });

  it("treats Residential and Commercial as distinct live Rooms", () => {
    expect(districtFromPath("/districts/residential")?.status).toBe("live");
    expect(isDistrictEnterable(districtFromPath("/districts/residential")!)).toBe(true);
    expect(districtFromPath("/districts/commercial")?.status).toBe("live");
    expect(isDistrictEnterable(districtFromPath("/districts/commercial")!)).toBe(true);
    expect(districtFromPath("/districts/residential")?.route).not.toBe("/districts/commercial");
  });

  it("does not confuse Real Estate with Residential", () => {
    expect(districtFromPath("/districts/real-estate")?.name).toBe("Real Estate");
    expect(districtFromPath("/districts/real-estate")?.status).toBe("early");
    expect(districtFromPath("/districts/residential")?.name).toBe("Residential");
    expect(districtFromPath("/districts/residential")?.route).not.toBe("/districts/real-estate");
  });

  it("reads Media & Technology from its live City route", () => {
    expect(districtFromPath("/media-technology")?.id).toBe("media-technology");
    expect(districtFromPath("/districts/contractor")?.name).toBe("Construction");
    expect(districtFromPath("/districts/trucking")?.id).toBe("trucking");
    expect(districtFromPath("/districts/trucking")?.status).toBe("live");
  });

  it("treats City paths as having no district Room", () => {
    expect(districtFromPath("/")).toBeUndefined();
    expect(districtFromPath("/feed")).toBeUndefined();
    expect(districtFromPath("/account/visibility")).toBeUndefined();
  });
});
