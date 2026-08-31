/**
 * Media & Technology percentage-fit engine.
 *
 * Weights and bands are transcribed from Milestone 1 Framing §8
 * (`src/lib/matching.ts` on the 25 Aug 2026 live tree). This file is not in
 * that clone. Do not retune weights. Do not reuse for Construction/Trucking.
 *
 * “When applicable, sum 100”: empty-on-both-sides criteria are excluded and
 * remaining weights renormalize.
 */

import { matchBands } from "./tokens";

export const MATCH_WEIGHTS = {
  discipline: 22,
  skills: 10,
  tools: 9,
  certifications: 6,
  location: 10,
  remoteOnsite: 6,
  timing: 11,
  experience: 9,
  engagement: 6,
  budget: 5,
  completeness: 6,
} as const;

export type MatchCriterion = keyof typeof MATCH_WEIGHTS;

export const MATCH_WEIGHT_SUM = Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0);

export type MatchableListing = {
  discipline: string;
  skills: string[];
  tools: string[];
  certifications: string[];
  location: string;
  remoteOnsite: string;
  timing: string;
  experienceYears: number;
  engagement: string;
  budgetProxy: string;
  completeness: number;
};

export type CriterionScore = {
  label: string;
  key: MatchCriterion;
  weight: number;
  applied: boolean;
  earned: number;
  ratio: number;
};

const LABELS: Record<MatchCriterion, string> = {
  discipline: "Discipline",
  skills: "Skills",
  tools: "Tools",
  certifications: "Certifications",
  location: "Location",
  remoteOnsite: "Remote / onsite",
  timing: "Timing",
  experience: "Experience",
  engagement: "Engagement",
  budget: "Budget",
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

function locationScore(a: string, b: string): number | null {
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

function completenessScore(a: number, b: number): number {
  return (clamp01(a) + clamp01(b)) / 2;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function scoreMatch(offering: MatchableListing, seeking: MatchableListing): {
  percent: number;
  breakdown: CriterionScore[];
} {
  const ratios: Record<MatchCriterion, number | null> = {
    discipline: exact(offering.discipline, seeking.discipline),
    skills: jaccard(offering.skills, seeking.skills),
    tools: jaccard(offering.tools, seeking.tools),
    certifications: jaccard(offering.certifications, seeking.certifications),
    location: locationScore(offering.location, seeking.location),
    remoteOnsite: exact(offering.remoteOnsite, seeking.remoteOnsite),
    timing: exact(offering.timing, seeking.timing),
    experience: experienceScore(offering.experienceYears, seeking.experienceYears),
    engagement: exact(offering.engagement, seeking.engagement),
    budget: exact(offering.budgetProxy, seeking.budgetProxy),
    completeness: completenessScore(offering.completeness, seeking.completeness),
  };

  let applicable = 0;
  let earned = 0;
  const breakdown: CriterionScore[] = (Object.keys(MATCH_WEIGHTS) as MatchCriterion[]).map((key) => {
    const weight = MATCH_WEIGHTS[key];
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
    };
  });

  const percent = applicable === 0 ? 0 : Math.round((earned / applicable) * 100);
  return { percent, breakdown };
}

export function isInMatchBand(percent: number) {
  return percent >= matchBands.possible;
}
