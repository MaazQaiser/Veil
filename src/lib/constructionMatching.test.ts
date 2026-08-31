import { describe, expect, it } from "vitest";
import { MATCH_WEIGHTS } from "./matching";
import {
  CONSTRUCTION_MATCH_WEIGHT_SUM,
  CONSTRUCTION_MATCH_WEIGHTS,
  scoreConstructionMatch,
  type ConstructionMatchable,
} from "./constructionMatching";
import { matchBand } from "./tokens";

const base: ConstructionMatchable = {
  trade: "Electrical",
  jobType: "Renovation",
  capabilities: ["Panel", "Lighting"],
  serviceArea: "Atlanta",
  availability: "This cycle",
  credentials: ["Trade license on file"],
  experienceYears: 10,
  completeness: 1,
};

describe("Construction Exchange sibling matching", () => {
  it("keeps a Construction weight table that sums to 100", () => {
    expect(CONSTRUCTION_MATCH_WEIGHTS.trade).toBe(28);
    expect(CONSTRUCTION_MATCH_WEIGHTS.jobType).toBe(16);
    expect(CONSTRUCTION_MATCH_WEIGHTS.capabilities).toBe(12);
    expect(CONSTRUCTION_MATCH_WEIGHTS.serviceArea).toBe(14);
    expect(CONSTRUCTION_MATCH_WEIGHTS.availability).toBe(12);
    expect(CONSTRUCTION_MATCH_WEIGHTS.credentials).toBe(8);
    expect(CONSTRUCTION_MATCH_WEIGHTS.experience).toBe(6);
    expect(CONSTRUCTION_MATCH_WEIGHTS.completeness).toBe(4);
    expect(CONSTRUCTION_MATCH_WEIGHT_SUM).toBe(100);
  });

  it("does not reuse Media & Technology weights", () => {
    expect(CONSTRUCTION_MATCH_WEIGHTS).not.toEqual(MATCH_WEIGHTS);
    expect("discipline" in CONSTRUCTION_MATCH_WEIGHTS).toBe(false);
    expect("tools" in CONSTRUCTION_MATCH_WEIGHTS).toBe(false);
    expect("trade" in MATCH_WEIGHTS).toBe(false);
  });

  it("does not change protected City bands", () => {
    expect(matchBand(80)).toBe("strong");
    expect(matchBand(60)).toBe("good");
    expect(matchBand(40)).toBe("possible");
  });

  it("scores identical Construction listings in the Strong band", () => {
    const { percent } = scoreConstructionMatch(base, base);
    expect(percent).toBeGreaterThanOrEqual(80);
  });

  it("drops when trade does not overlap", () => {
    const { percent: same } = scoreConstructionMatch(base, base);
    const { percent: other } = scoreConstructionMatch(base, { ...base, trade: "Plumbing" });
    expect(other).toBeLessThan(same);
  });
});
