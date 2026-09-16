/**
 * Single source of truth for Professional Profile sections and field tiers.
 * Presentation only — ProfileRecord stays one record.
 */

import type { ProfileDocument, ProfileRecord, VaelSide } from "./vaelStore";

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
  | "documents"
  | "hiringFor"
  | "need";

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
  hiringFor: "Say what you're hiring for.",
  need: "Describe what you need.",
};

/** Vael In (provider) profile — the original field set. */
export const PROVIDER_FIELDS: ProfileFieldDef[] = [
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
    tier: "recommended",
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

/**
 * Vael Out (hiring) profile — mirrors the fields the hiring onboarding wizard
 * actually collects (headline = "what you're hiring for", bio = "what you need").
 * No disciplines/skills/tools/experience — a hirer doesn't have their own.
 */
export const HIRING_FIELDS: ProfileFieldDef[] = [
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
    id: "hiringFor",
    section: "expertise",
    tier: "required",
    prompt: "Add what you're hiring for to improve your profile.",
    filled: (profile) => Boolean(profile.headline.trim()),
  },
  {
    id: "need",
    section: "work",
    tier: "required",
    prompt: "Add a description of what you need to improve your profile.",
    filled: (profile) => Boolean(profile.bio.trim()),
  },
  {
    id: "portfolio",
    section: "work",
    tier: "recommended",
    prompt: "Add links to improve your profile.",
    filled: (profile) => profile.portfolio.some((item) => item.url.trim()),
  },
  {
    id: "credentials",
    section: "credentials",
    tier: "optional",
    prompt: "Add requirements to improve your profile.",
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

/** Legacy alias — most callers haven't been made side-aware yet. */
export const PROFILE_FIELDS = PROVIDER_FIELDS;

export function profileFieldsFor(side: VaelSide = "in"): ProfileFieldDef[] {
  return side === "out" ? HIRING_FIELDS : PROVIDER_FIELDS;
}

export const DOC_TYPE_LABELS = {
  license: "License",
  insurance: "Insurance",
  capability: "Capability statement",
} as const;

export function sectionErrors(
  section: ProfileSectionId,
  profile: ProfileRecord,
  side: VaelSide = "in",
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of profileFieldsFor(side)) {
    if (field.section !== section || field.tier !== "required") continue;
    if (!field.filled(profile)) {
      errors[field.id] = REQUIRED_MESSAGES[field.id] ?? field.prompt;
    }
  }
  return errors;
}

/** Matching-critical fields only. Photo, bio, portfolio, and credentials stay skippable. */
export function requiredFieldsFilled(profile: ProfileRecord | undefined, side: VaelSide = "in"): boolean {
  if (!profile) return false;
  return profileFieldsFor(side)
    .filter((field) => field.tier === "required")
    .every((field) => field.filled(profile));
}

/** Same shape as profileCompletion() in providerJourney.ts, scoped to one section (e.g. "identity" vs "expertise"). */
export function sectionCompletion(
  profile: ProfileRecord | undefined,
  section: ProfileSectionId,
  documents: ProfileDocument[] = [],
  side: VaelSide = "in",
): { percent: number; prompt: string } {
  const fields = profileFieldsFor(side).filter((field) => field.section === section);
  if (!profile) return { percent: 0, prompt: fields[0]?.prompt ?? "" };
  const filled = fields.filter((field) => field.filled(profile, documents)).length;
  const missing = fields.find((field) => !field.filled(profile, documents));
  return {
    percent: fields.length ? Math.round((filled / fields.length) * 100) : 100,
    prompt: missing?.prompt ?? "Complete.",
  };
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
