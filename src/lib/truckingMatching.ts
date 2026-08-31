/**
 * Trucking Exchange percentage-fit engine.
 *
 * Sibling of `src/lib/matching.ts` and `constructionMatching.ts`.
 * Do not import or retune Media & Technology or Construction weights.
 * City bands stay Strong ≥80 / Good ≥60 / Possible ≥40.
 *
 * Criteria follow Blueprint 2.7 (loads, routes, availability) plus documented
 * Trucking concepts (equipment/capability, capacity). No DOT/MC fields.
 *
 * WEIGHT STATUS: kit-proposed sibling table. Owner has not locked Trucking
 * weights. UI must not present this table as Framing §8.
 *
 * Breakdown uses relevance labels, not per-criterion percentages.
 */

import { matchBands } from "./tokens";

export const TRUCKING_MATCH_WEIGHTS = {
  origin: 20,
  destination: 20,
  equipment: 16,
  capacity: 12,
  availability: 14,
  capabilities: 10,
  experience: 4,
  completeness: 4,
} as const;

export type TruckingMatchCriterion = keyof typeof TRUCKING_MATCH_WEIGHTS;

export const TRUCKING_MATCH_WEIGHT_SUM = Object.values(TRUCKING_MATCH_WEIGHTS).reduce((a, b) => a + b, 0);

export type TruckingMatchable = {
  origin: string;
  destination: string;
  equipment: string;
  capacity: string;
  availability: string;
  capabilities: string[];
  experienceYears: number;
  completeness: number;
};

export type TruckingRelevance = "relevant" | "partial" | "missing" | "not-listed";

export type TruckingCriterionScore = {
  label: string;
  key: TruckingMatchCriterion;
  weight: number;
  applied: boolean;
  earned: number;
  ratio: number;
  relevance: TruckingRelevance;
};

const LABELS: Record<TruckingMatchCriterion, string> = {
  origin: "Origin",
  destination: "Destination",
  equipment: "Equipment",
  capacity: "Capacity",
  availability: "Availability",
  capabilities: "Capability",
  experience: "Experience",
  completeness: "Completeness",
};

function norm(value: string) {
  return value.trim().toLowerCase();
}

function setOf(values: string[]) {
  return new Set(values.map(norm).filter(Boolean));
}

function jaccard(a: string[], b: string[]): number | null {
  const A = setOf(a);
  const B = setOf(b);
  if (A.size === 0 && B.size === 0) return null;
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((item) => {
    if (B.has(item)) inter += 1;
  });
  return inter / new Set([...A, ...B]).size;
}

function exact(a: string, b: string): number | null {
  if (!norm(a) && !norm(b)) return null;
  if (!norm(a) || !norm(b)) return 0;
  return norm(a) === norm(b) ? 1 : 0;
}

function placeScore(a: string, b: string): number | null {
  const left = norm(a);
  const right = norm(b);
  if (!left && !right) return null;
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.7;
  return 0;
}

function experienceScore(a: number, b: number): number | null {
  if (!a && !b) return null;
  if (!a || !b) return 0;
  const delta = Math.abs(a - b);
  return Math.max(0, 1 - delta / 10);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function truckingRelevanceFromRatio(ratio: number | null): TruckingRelevance {
  if (ratio === null) return "not-listed";
  if (ratio >= 0.7) return "relevant";
  if (ratio > 0) return "partial";
  return "missing";
}

export function scoreTruckingMatch(
  capacitySide: TruckingMatchable,
  loadSide: TruckingMatchable,
): {
  percent: number;
  breakdown: TruckingCriterionScore[];
} {
  const ratios: Record<TruckingMatchCriterion, number | null> = {
    origin: placeScore(capacitySide.origin, loadSide.origin),
    destination: placeScore(capacitySide.destination, loadSide.destination),
    equipment: exact(capacitySide.equipment, loadSide.equipment),
    capacity: exact(capacitySide.capacity, loadSide.capacity),
    availability: exact(capacitySide.availability, loadSide.availability),
    capabilities: jaccard(capacitySide.capabilities, loadSide.capabilities),
    experience: experienceScore(capacitySide.experienceYears, loadSide.experienceYears),
    completeness: (clamp01(capacitySide.completeness) + clamp01(loadSide.completeness)) / 2,
  };

  let applicable = 0;
  let earned = 0;
  const breakdown: TruckingCriterionScore[] = (Object.keys(TRUCKING_MATCH_WEIGHTS) as TruckingMatchCriterion[]).map(
    (key) => {
      const weight = TRUCKING_MATCH_WEIGHTS[key];
      const ratio = ratios[key];
      const applied = ratio !== null;
      if (applied) {
        applicable += weight;
        earned += weight * ratio;
      }
      return {
        label: LABELS[key],
        key,
        weight,
        applied,
        earned: applied ? Math.round(weight * (ratio ?? 0) * 10) / 10 : 0,
        ratio: applied ? Math.round((ratio ?? 0) * 100) : 0,
        relevance: truckingRelevanceFromRatio(ratio),
      };
    },
  );

  const percent = applicable === 0 ? 0 : Math.round((earned / applicable) * 100);
  return { percent, breakdown };
}

export function isInTruckingBand(percent: number) {
  return percent >= matchBands.possible;
}
