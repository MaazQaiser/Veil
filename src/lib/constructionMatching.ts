/**
 * Construction Exchange percentage-fit engine.
 *
 * Sibling of `src/lib/matching.ts`. Do not import or retune Media & Technology
 * weights. Bands (Strong ≥80 / Good ≥60 / Possible ≥40) stay City-wide.
 *
 * Criteria follow Blueprint 2.6 (trades, job type, licenses) plus documented
 * Construction concepts (service area, availability, experience, capabilities).
 *
 * WEIGHT STATUS: kit-proposed sibling table. Owner has not locked Construction
 * weights. UI must not present this table as Framing §8.
 *
 * Match breakdown in the Room uses relevance labels (Relevant / Partial /
 * Missing / Not listed), not per-criterion percentages.
 */

import { matchBands } from "./tokens";

export const CONSTRUCTION_MATCH_WEIGHTS = {
  trade: 28,
  jobType: 16,
  capabilities: 12,
  serviceArea: 14,
  availability: 12,
  credentials: 8,
  experience: 6,
  completeness: 4,
} as const;

export type ConstructionMatchCriterion = keyof typeof CONSTRUCTION_MATCH_WEIGHTS;

export const CONSTRUCTION_MATCH_WEIGHT_SUM = Object.values(CONSTRUCTION_MATCH_WEIGHTS).reduce(
  (a, b) => a + b,
  0,
);

export type ConstructionMatchable = {
  trade: string;
  jobType: string;
  capabilities: string[];
  serviceArea: string;
  availability: string;
  credentials: string[];
  experienceYears: number;
  completeness: number;
};

export type ConstructionRelevance = "relevant" | "partial" | "missing" | "not-listed";

export type ConstructionCriterionScore = {
  label: string;
  key: ConstructionMatchCriterion;
  weight: number;
  applied: boolean;
  earned: number;
  ratio: number;
  relevance: ConstructionRelevance;
};

const LABELS: Record<ConstructionMatchCriterion, string> = {
  trade: "Trade",
  jobType: "Job type",
  capabilities: "Capabilities",
  serviceArea: "Service area",
  availability: "Availability",
  credentials: "Licenses / insurance",
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

function areaScore(a: string, b: string): number | null {
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

export function relevanceFromRatio(ratio: number | null): ConstructionRelevance {
  if (ratio === null) return "not-listed";
  if (ratio >= 0.7) return "relevant";
  if (ratio > 0) return "partial";
  return "missing";
}

export function scoreConstructionMatch(
  available: ConstructionMatchable,
  need: ConstructionMatchable,
): {
  percent: number;
  breakdown: ConstructionCriterionScore[];
} {
  const ratios: Record<ConstructionMatchCriterion, number | null> = {
    trade: exact(available.trade, need.trade),
    jobType: exact(available.jobType, need.jobType),
    capabilities: jaccard(available.capabilities, need.capabilities),
    serviceArea: areaScore(available.serviceArea, need.serviceArea),
    availability: exact(available.availability, need.availability),
    credentials: jaccard(available.credentials, need.credentials),
    experience: experienceScore(available.experienceYears, need.experienceYears),
    completeness: (clamp01(available.completeness) + clamp01(need.completeness)) / 2,
  };

  let applicable = 0;
  let earned = 0;
  const breakdown: ConstructionCriterionScore[] = (
    Object.keys(CONSTRUCTION_MATCH_WEIGHTS) as ConstructionMatchCriterion[]
  ).map((key) => {
    const weight = CONSTRUCTION_MATCH_WEIGHTS[key];
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
      relevance: relevanceFromRatio(ratio),
    };
  });

  const percent = applicable === 0 ? 0 : Math.round((earned / applicable) * 100);
  return { percent, breakdown };
}

export function isInConstructionBand(percent: number) {
  return percent >= matchBands.possible;
}
