import { describe, expect, it } from "vitest";
import { MATCH_WEIGHTS } from "./matching";
import { CONSTRUCTION_MATCH_WEIGHTS } from "./constructionMatching";
import { TRUCKING_MATCH_WEIGHTS } from "./truckingMatching";
import {
  RESIDENTIAL_MATCH_WEIGHT_SUM,
  RESIDENTIAL_MATCH_WEIGHTS,
  scoreResidentialMatch,
  type ResidentialMatchable,
} from "./residentialMatching";
import { matchBand } from "./tokens";

const need: ResidentialMatchable = {
  service: "General home repair",
  area: "Atlanta",
  postalCode: "30308",
  availability: "This cycle",
  capabilities: ["Repairs", "Interior"],
  experienceYears: 5,
  credentials: [],
  completeness: 1,
};

const provider: ResidentialMatchable = {
  ...need,
  experienceYears: 8,
};

describe("Residential sibling matching", () => {
  it("keeps a Residential weight table that sums to 100", () => {
    expect(RESIDENTIAL_MATCH_WEIGHTS.service).toBe(28);
    expect(RESIDENTIAL_MATCH_WEIGHTS.location).toBe(22);
    expect(RESIDENTIAL_MATCH_WEIGHTS.availability).toBe(16);
    expect(RESIDENTIAL_MATCH_WEIGHTS.capabilities).toBe(12);
    expect(RESIDENTIAL_MATCH_WEIGHTS.experience).toBe(8);
    expect(RESIDENTIAL_MATCH_WEIGHTS.credentials).toBe(8);
    expect(RESIDENTIAL_MATCH_WEIGHTS.completeness).toBe(6);
    expect(RESIDENTIAL_MATCH_WEIGHT_SUM).toBe(100);
  });

  it("does not reuse Media & Technology, Construction, or Trucking weights", () => {
    expect(RESIDENTIAL_MATCH_WEIGHTS).not.toEqual(MATCH_WEIGHTS);
    expect(RESIDENTIAL_MATCH_WEIGHTS).not.toEqual(CONSTRUCTION_MATCH_WEIGHTS);
    expect(RESIDENTIAL_MATCH_WEIGHTS).not.toEqual(TRUCKING_MATCH_WEIGHTS);
    expect("trade" in RESIDENTIAL_MATCH_WEIGHTS).toBe(false);
    expect("discipline" in RESIDENTIAL_MATCH_WEIGHTS).toBe(false);
    expect("origin" in RESIDENTIAL_MATCH_WEIGHTS).toBe(false);
    expect("service" in MATCH_WEIGHTS).toBe(false);
    expect("service" in CONSTRUCTION_MATCH_WEIGHTS).toBe(false);
  });

  it("does not change protected City bands", () => {
    expect(matchBand(80)).toBe("strong");
    expect(matchBand(60)).toBe("good");
    expect(matchBand(40)).toBe("possible");
  });

  it("scores a matching home need against an available provider in the Strong band", () => {
    const { percent } = scoreResidentialMatch(need, provider);
    expect(percent).toBeGreaterThanOrEqual(80);
  });

  it("drops when the service does not overlap", () => {
    const { percent: same } = scoreResidentialMatch(need, provider);
    const { percent: other } = scoreResidentialMatch(need, { ...provider, service: "Painting" });
    expect(other).toBeLessThan(same);
  });
});
