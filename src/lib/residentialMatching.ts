/**
 * Residential percentage-fit engine.
 *
 * Sibling of matching.ts, constructionMatching.ts, and truckingMatching.ts.
 * Do not import or retune Media & Technology, Construction, or Trucking weights.
 * City bands stay Strong ≥80 / Good ≥60 / Possible ≥40.
 *
 * Criteria: homeowner need against available provider — service, location,
 * timing, capability. No Construction trade/job-type table. No maps.
 *
 * WEIGHT STATUS: kit-proposed sibling table. Owner has not locked Residential
 * weights. UI must not present this table as Framing §8.
 *
 * Breakdown uses relevance labels, not per-criterion percentages.
 */

import { matchBands } from "./tokens";

export const RESIDENTIAL_MATCH_WEIGHTS = {
  service: 28,
  location: 22,
  availability: 16,
  capabilities: 12,
  experience: 8,
  credentials: 8,
  completeness: 6,
} as const;

export type ResidentialMatchCriterion = keyof typeof RESIDENTIAL_MATCH_WEIGHTS;

export const RESIDENTIAL_MATCH_WEIGHT_SUM = Object.values(RESIDENTIAL_MATCH_WEIGHTS).reduce((a, b) => a + b, 0);

export type ResidentialMatchable = {
  service: string;
  area: string;
  postalCode: string;
  availability: string;
  capabilities: string[];
  experienceYears: number;
  credentials: string[];
  completeness: number;
};

export type ResidentialRelevance = "relevant" | "partial" | "missing" | "not-listed";

export type ResidentialCriterionScore = {
  label: string;
  key: ResidentialMatchCriterion;
  weight: number;
  applied: boolean;
  earned: number;
  ratio: number;
  relevance: ResidentialRelevance;
};

const LABELS: Record<ResidentialMatchCriterion, string> = {
  service: "Service",
  location: "Location",
  availability: "Timing",
  capabilities: "Capability",
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

function locationScore(need: ResidentialMatchable, provider: ResidentialMatchable): number | null {
  const zip = exact(need.postalCode, provider.postalCode);
  const area = placeScore(need.area, provider.area);
  if (zip === null && area === null) return null;
  if (zip === 1) return 1;
  if (area !== null) return area;
  return zip;
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

export function residentialRelevanceFromRatio(ratio: number | null): ResidentialRelevance {
  if (ratio === null) return "not-listed";
  if (ratio >= 0.7) return "relevant";
  if (ratio > 0) return "partial";
  return "missing";
}

export function scoreResidentialMatch(
  need: ResidentialMatchable,
  provider: ResidentialMatchable,
): {
  percent: number;
  breakdown: ResidentialCriterionScore[];
} {
  const ratios: Record<ResidentialMatchCriterion, number | null> = {
    service: exact(need.service, provider.service),
    location: locationScore(need, provider),
    availability: exact(need.availability, provider.availability),
    capabilities: jaccard(need.capabilities, provider.capabilities),
    experience: experienceScore(need.experienceYears, provider.experienceYears),
    credentials: jaccard(need.credentials, provider.credentials),
    completeness: (clamp01(need.completeness) + clamp01(provider.completeness)) / 2,
  };

  let applicable = 0;
  let earned = 0;
  const breakdown: ResidentialCriterionScore[] = (Object.keys(RESIDENTIAL_MATCH_WEIGHTS) as ResidentialMatchCriterion[]).map(
    (key) => {
      const weight = RESIDENTIAL_MATCH_WEIGHTS[key];
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
        relevance: residentialRelevanceFromRatio(ratio),
      };
    },
  );

  const percent = applicable === 0 ? 0 : Math.round((earned / applicable) * 100);
  return { percent, breakdown };
}

export function isInResidentialBand(percent: number) {
  return percent >= matchBands.possible;
}
