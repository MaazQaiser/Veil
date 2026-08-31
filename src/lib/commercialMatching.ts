/**
 * Commercial percentage-fit engine.
 *
 * Sibling of matching.ts, constructionMatching.ts, truckingMatching.ts,
 * and residentialMatching.ts. Do not import or retune those tables.
 * City bands stay Strong ≥80 / Good ≥60 / Possible ≥40.
 *
 * Criteria: business need against available company/provider —
 * capability, location, timing, requirements. Not Residential home services.
 * Not Construction trades.
 *
 * WEIGHT STATUS: kit-proposed sibling table. Owner has not locked Commercial
 * weights. UI must not present this table as Framing §8.
 *
 * Breakdown uses relevance labels, not per-criterion percentages.
 */

import { matchBands } from "./tokens";

export const COMMERCIAL_MATCH_WEIGHTS = {
  capability: 26,
  location: 18,
  availability: 14,
  requirements: 14,
  capabilities: 10,
  experience: 8,
  credentials: 6,
  completeness: 4,
} as const;

export type CommercialMatchCriterion = keyof typeof COMMERCIAL_MATCH_WEIGHTS;

export const COMMERCIAL_MATCH_WEIGHT_SUM = Object.values(COMMERCIAL_MATCH_WEIGHTS).reduce((a, b) => a + b, 0);

export type CommercialMatchable = {
  capability: string;
  area: string;
  availability: string;
  requirements: string;
  capabilities: string[];
  experienceYears: number;
  credentials: string[];
  completeness: number;
};

export type CommercialRelevance = "relevant" | "partial" | "missing" | "not-listed";

export type CommercialCriterionScore = {
  label: string;
  key: CommercialMatchCriterion;
  weight: number;
  applied: boolean;
  earned: number;
  ratio: number;
  relevance: CommercialRelevance;
};

const LABELS: Record<CommercialMatchCriterion, string> = {
  capability: "Capability",
  location: "Location",
  availability: "Timing",
  requirements: "Requirements",
  capabilities: "Scope labels",
  experience: "Experience",
  credentials: "Credentials",
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

function textScore(a: string, b: string): number | null {
  return placeScore(a, b);
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

export function commercialRelevanceFromRatio(ratio: number | null): CommercialRelevance {
  if (ratio === null) return "not-listed";
  if (ratio >= 0.7) return "relevant";
  if (ratio > 0) return "partial";
  return "missing";
}

export function scoreCommercialMatch(
  need: CommercialMatchable,
  provider: CommercialMatchable,
): {
  percent: number;
  breakdown: CommercialCriterionScore[];
} {
  const ratios: Record<CommercialMatchCriterion, number | null> = {
    capability: exact(need.capability, provider.capability),
    location: placeScore(need.area, provider.area),
    availability: exact(need.availability, provider.availability),
    requirements: textScore(need.requirements, provider.requirements),
    capabilities: jaccard(need.capabilities, provider.capabilities),
    experience: experienceScore(need.experienceYears, provider.experienceYears),
    credentials: jaccard(need.credentials, provider.credentials),
    completeness: (clamp01(need.completeness) + clamp01(provider.completeness)) / 2,
  };

  let applicable = 0;
  let earned = 0;
  const breakdown: CommercialCriterionScore[] = (Object.keys(COMMERCIAL_MATCH_WEIGHTS) as CommercialMatchCriterion[]).map(
    (key) => {
      const weight = COMMERCIAL_MATCH_WEIGHTS[key];
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
        relevance: commercialRelevanceFromRatio(ratio),
      };
    },
  );

  const percent = applicable === 0 ? 0 : Math.round((earned / applicable) * 100);
  return { percent, breakdown };
}

export function isInCommercialBand(percent: number) {
  return percent >= matchBands.possible;
}
