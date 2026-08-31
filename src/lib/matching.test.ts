import { describe, expect, it } from "vitest";
import { MATCH_WEIGHT_SUM, MATCH_WEIGHTS, scoreMatch, type MatchableListing } from "./matching";
import { matchBand } from "./tokens";

const base: MatchableListing = {
  discipline: "Editorial",
  skills: ["Avid", "Documentary"],
  tools: ["Avid Media Composer"],
  certifications: ["Avid Certified"],
  location: "Atlanta",
  remoteOnsite: "remote",
  timing: "This cycle",
  experienceYears: 8,
  engagement: "Project",
  budgetProxy: "Day rate",
  completeness: 1,
};

describe("Media & Technology matching weights", () => {
  it("keeps Framing §8 weights summing to 100", () => {
    expect(MATCH_WEIGHTS.discipline).toBe(22);
    expect(MATCH_WEIGHTS.skills).toBe(10);
    expect(MATCH_WEIGHTS.tools).toBe(9);
    expect(MATCH_WEIGHTS.certifications).toBe(6);
    expect(MATCH_WEIGHTS.location).toBe(10);
    expect(MATCH_WEIGHTS.remoteOnsite).toBe(6);
    expect(MATCH_WEIGHTS.timing).toBe(11);
    expect(MATCH_WEIGHTS.experience).toBe(9);
    expect(MATCH_WEIGHTS.engagement).toBe(6);
    expect(MATCH_WEIGHTS.budget).toBe(5);
    expect(MATCH_WEIGHTS.completeness).toBe(6);
    expect(MATCH_WEIGHT_SUM).toBe(100);
  });

  it("does not change protected bands", () => {
    expect(matchBand(80)).toBe("strong");
    expect(matchBand(60)).toBe("good");
    expect(matchBand(40)).toBe("possible");
  });

  it("scores identical listings in the Strong band", () => {
    const { percent } = scoreMatch(base, base);
    expect(percent).toBeGreaterThanOrEqual(80);
  });

  it("drops when discipline does not overlap", () => {
    const { percent: same } = scoreMatch(base, base);
    const { percent: other } = scoreMatch(base, { ...base, discipline: "Software" });
    expect(other).toBeLessThan(same);
  });
});
