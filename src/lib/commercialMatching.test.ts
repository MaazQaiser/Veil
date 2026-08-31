import { describe, expect, it } from "vitest";
import { MATCH_WEIGHTS } from "./matching";
import { CONSTRUCTION_MATCH_WEIGHTS } from "./constructionMatching";
import { TRUCKING_MATCH_WEIGHTS } from "./truckingMatching";
import { RESIDENTIAL_MATCH_WEIGHTS } from "./residentialMatching";
import {
  COMMERCIAL_MATCH_WEIGHT_SUM,
  COMMERCIAL_MATCH_WEIGHTS,
  scoreCommercialMatch,
  type CommercialMatchable,
} from "./commercialMatching";
import { matchBand } from "./tokens";

const need: CommercialMatchable = {
  capability: "Facilities",
  area: "Atlanta",
  availability: "This cycle",
  requirements: "On-site facilities support",
  capabilities: ["Sites", "Vendors"],
  experienceYears: 5,
  credentials: [],
  completeness: 1,
};

const provider: CommercialMatchable = {
  ...need,
  experienceYears: 10,
};

describe("Commercial sibling matching", () => {
  it("keeps a Commercial weight table that sums to 100", () => {
    expect(COMMERCIAL_MATCH_WEIGHTS.capability).toBe(26);
    expect(COMMERCIAL_MATCH_WEIGHTS.location).toBe(18);
    expect(COMMERCIAL_MATCH_WEIGHTS.availability).toBe(14);
    expect(COMMERCIAL_MATCH_WEIGHTS.requirements).toBe(14);
    expect(COMMERCIAL_MATCH_WEIGHTS.capabilities).toBe(10);
    expect(COMMERCIAL_MATCH_WEIGHTS.experience).toBe(8);
    expect(COMMERCIAL_MATCH_WEIGHTS.credentials).toBe(6);
    expect(COMMERCIAL_MATCH_WEIGHTS.completeness).toBe(4);
    expect(COMMERCIAL_MATCH_WEIGHT_SUM).toBe(100);
  });

  it("does not reuse Media & Technology, Construction, Trucking, or Residential weights", () => {
    expect(COMMERCIAL_MATCH_WEIGHTS).not.toEqual(MATCH_WEIGHTS);
    expect(COMMERCIAL_MATCH_WEIGHTS).not.toEqual(CONSTRUCTION_MATCH_WEIGHTS);
    expect(COMMERCIAL_MATCH_WEIGHTS).not.toEqual(TRUCKING_MATCH_WEIGHTS);
    expect(COMMERCIAL_MATCH_WEIGHTS).not.toEqual(RESIDENTIAL_MATCH_WEIGHTS);
    expect("trade" in COMMERCIAL_MATCH_WEIGHTS).toBe(false);
    expect("discipline" in COMMERCIAL_MATCH_WEIGHTS).toBe(false);
    expect("service" in COMMERCIAL_MATCH_WEIGHTS).toBe(false);
    expect("capability" in MATCH_WEIGHTS).toBe(false);
    expect("capability" in RESIDENTIAL_MATCH_WEIGHTS).toBe(false);
  });

  it("does not change protected City bands", () => {
    expect(matchBand(80)).toBe("strong");
    expect(matchBand(60)).toBe("good");
    expect(matchBand(40)).toBe("possible");
  });

  it("scores a matching business need against an available company in the Strong band", () => {
    const { percent } = scoreCommercialMatch(need, provider);
    expect(percent).toBeGreaterThanOrEqual(80);
  });

  it("drops when the capability does not overlap", () => {
    const { percent: same } = scoreCommercialMatch(need, provider);
    const { percent: other } = scoreCommercialMatch(need, { ...provider, capability: "Professional services" });
    expect(other).toBeLessThan(same);
  });
});
