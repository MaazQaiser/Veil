/**
 * Single source of truth for Professional Profile sections and field tiers.
 * Presentation only — ProfileRecord stays one record.
 */

import type { ProfileDocument, ProfileRecord } from "./vaelStore";

export type ProfileSectionId = "identity" | "expertise" | "work" | "credentials";
export type ProfileFieldTier = "required" | "recommended" | "optional";

export type ProfileFieldId =
  | "displayName"
  | "location"
  | "avatarUrl"
  | "disciplines"
  | "skills"
  | "tools"
  | "bio"
  | "experience"
  | "portfolio"
  | "credentials"
  | "documents";

export type ProfileFieldDef = {
  id: ProfileFieldId;
  section: ProfileSectionId;
  tier: ProfileFieldTier;
  prompt: string;
  filled: (profile: ProfileRecord, documents?: ProfileDocument[]) => boolean;
};

const REQUIRED_MESSAGES: Partial<Record<ProfileFieldId, string>> = {
  displayName: "Enter the name you work under.",
  location: "Enter a location.",
  disciplines: "Choose at least one discipline.",
  skills: "Add at least one skill.",
  tools: "Add at least one tool.",
};

export const PROFILE_FIELDS: ProfileFieldDef[] = [
  {
    id: "displayName",
    section: "identity",
    tier: "required",
    prompt: "Add your name to improve your profile.",
    filled: (profile) => Boolean(profile.displayName.trim()),
  },
  {
    id: "location",
    section: "identity",
    tier: "required",
    prompt: "Add a location to improve your profile.",
    filled: (profile) => Boolean(profile.location.trim()),
  },
  {
    id: "avatarUrl",
    section: "identity",
    tier: "recommended",
    prompt: "Add a profile photo to improve your profile.",
    filled: (profile) => Boolean(profile.avatarUrl),
  },
  {
    id: "disciplines",
    section: "expertise",
    tier: "required",
    prompt: "Add a discipline to improve your profile.",
    filled: (profile) => profile.disciplines.length > 0,
  },
  {
    id: "skills",
    section: "expertise",
    tier: "required",
    prompt: "Add skills to improve your profile.",
    filled: (profile) => profile.skills.length > 0,
  },
  {
    id: "tools",
    section: "expertise",
    tier: "required",
    prompt: "Add tools to improve your profile.",
    filled: (profile) => profile.tools.length > 0,
  },
  {
    id: "bio",
    section: "work",
    tier: "recommended",
    prompt: "Add a short bio to improve your profile.",
    filled: (profile) => Boolean(profile.bio.trim()),
  },
  {
    id: "experience",
    section: "work",
    tier: "recommended",
    prompt: "Add your experience to improve your profile.",
    filled: (profile) => Boolean(profile.experience.trim() || profile.experienceYears),
  },
  {
    id: "portfolio",
    section: "work",
    tier: "recommended",
    prompt: "Add a portfolio to improve your profile.",
    filled: (profile) => profile.portfolio.some((item) => item.url.trim()),
  },
  {
    id: "credentials",
    section: "credentials",
    tier: "optional",
    prompt: "Add certifications to improve your profile.",
    filled: (profile) => Boolean(profile.credentials.trim()),
  },
  {
    id: "documents",
    section: "credentials",
    tier: "optional",
    prompt: "Add documents to improve your profile.",
    filled: (_profile, documents = []) => documents.length > 0,
  },
];

export const DOC_TYPE_LABELS = {
  license: "License",
  insurance: "Insurance",
  capability: "Capability statement",
} as const;

export function sectionErrors(section: ProfileSectionId, profile: ProfileRecord): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of PROFILE_FIELDS) {
    if (field.section !== section || field.tier !== "required") continue;
    if (!field.filled(profile)) {
      errors[field.id] = REQUIRED_MESSAGES[field.id] ?? field.prompt;
    }
  }
  return errors;
}

/** Matching-critical fields only. Photo, bio, portfolio, and credentials stay skippable. */
export function requiredFieldsFilled(profile: ProfileRecord | undefined): boolean {
  if (!profile) return false;
  return PROFILE_FIELDS.filter((field) => field.tier === "required").every((field) => field.filled(profile));
}

export function normalizePortfolio(items: ProfileRecord["portfolio"]): ProfileRecord["portfolio"] {
  return items
    .map((item) => ({
      label: item.label.trim(),
      url: item.url.trim(),
      note: item.note?.trim() || undefined,
    }))
    .filter((item) => item.url || item.label || item.note);
}

export function documentChecklist(profile: ProfileRecord | undefined, documents: ProfileDocument[]) {
  return [
    { label: "Portfolio", done: Boolean(profile?.portfolio.some((item) => item.url.trim())) },
    { label: "Certifications", done: Boolean(profile?.credentials.trim()) },
    { label: "License", done: documents.some((item) => item.type === "license") },
    { label: "Insurance", done: documents.some((item) => item.type === "insurance") },
    { label: "Capability statement", done: documents.some((item) => item.type === "capability") },
  ];
}
