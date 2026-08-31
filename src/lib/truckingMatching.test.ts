import { describe, expect, it } from "vitest";
import { MATCH_WEIGHTS } from "./matching";
import { CONSTRUCTION_MATCH_WEIGHTS } from "./constructionMatching";
import {
  TRUCKING_MATCH_WEIGHT_SUM,
  TRUCKING_MATCH_WEIGHTS,
  scoreTruckingMatch,
  type TruckingMatchable,
} from "./truckingMatching";
import { matchBand } from "./tokens";

const base: TruckingMatchable = {
  origin: "Atlanta",
  destination: "Savannah",
  equipment: "Dry van",
  capacity: "Full",
  availability: "This cycle",
  capabilities: ["Regional", "Dry"],
  experienceYears: 8,
  completeness: 1,
};

describe("Trucking Exchange sibling matching", () => {
  it("keeps a Trucking weight table that sums to 100", () => {
    expect(TRUCKING_MATCH_WEIGHTS.origin).toBe(20);
    expect(TRUCKING_MATCH_WEIGHTS.destination).toBe(20);
    expect(TRUCKING_MATCH_WEIGHTS.equipment).toBe(16);
    expect(TRUCKING_MATCH_WEIGHTS.capacity).toBe(12);
    expect(TRUCKING_MATCH_WEIGHTS.availability).toBe(14);
    expect(TRUCKING_MATCH_WEIGHTS.capabilities).toBe(10);
    expect(TRUCKING_MATCH_WEIGHTS.experience).toBe(4);
    expect(TRUCKING_MATCH_WEIGHTS.completeness).toBe(4);
    expect(TRUCKING_MATCH_WEIGHT_SUM).toBe(100);
  });

  it("does not reuse Media & Technology or Construction weights", () => {
    expect(TRUCKING_MATCH_WEIGHTS).not.toEqual(MATCH_WEIGHTS);
    expect(TRUCKING_MATCH_WEIGHTS).not.toEqual(CONSTRUCTION_MATCH_WEIGHTS);
    expect("discipline" in TRUCKING_MATCH_WEIGHTS).toBe(false);
    expect("trade" in TRUCKING_MATCH_WEIGHTS).toBe(false);
    expect("origin" in MATCH_WEIGHTS).toBe(false);
  });

  it("does not change protected City bands", () => {
    expect(matchBand(80)).toBe("strong");
    expect(matchBand(60)).toBe("good");
    expect(matchBand(40)).toBe("possible");
  });

  it("scores identical Trucking listings in the Strong band", () => {
    const { percent } = scoreTruckingMatch(base, base);
    expect(percent).toBeGreaterThanOrEqual(80);
  });

  it("drops when destination does not overlap", () => {
    const { percent: same } = scoreTruckingMatch(base, base);
    const { percent: other } = scoreTruckingMatch(base, { ...base, destination: "Miami" });
    expect(other).toBeLessThan(same);
  });
});
