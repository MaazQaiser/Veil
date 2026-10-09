/**
 * Two-account Vael In / Vael Out client demo.
 *
 * The In member stays whoever is already on this device. Vael Out is a second
 * signable account (Akshay Amjad) whose listing mirrors the In side so matches
 * and handshakes connect both dashboards.
 */

import {
  findAccountByEmail,
  findAccountByHandle,
  getAccounts,
  registerAccount,
} from "./accounts";
import { finishOnboarding, patchOnboarding } from "./onboarding";
import { getActiveDistrictId, setActiveDistrict } from "./myDistricts";
import {
  getActiveListing,
  getProfile,
  patchVisibleListing,
  publishListing,
  upsertProfile,
  type ProfileRecord,
  type VaelListing,
} from "./vaelStore";

export const VAEL_OUT_HANDLE = "akshayamjad";
export const VAEL_OUT_EMAIL = "aqsaamjad099@gmail.com";
export const VAEL_OUT_PASSWORD = "123456";
export const VAEL_OUT_DISPLAY_NAME = "Akshay Amjad";
export const VAEL_OUT_PHONE = "+1 (415) 555-0198";

export function isVaelOutIdentity(raw: string) {
  const value = raw.trim().toLowerCase();
  return value === VAEL_OUT_EMAIL || value === VAEL_OUT_HANDLE || value === VAEL_OUT_DISPLAY_NAME.toLowerCase();
}

const DEFAULT_SKILLS = ["UX/UI", "Design Systems", "Brand"];
const DEFAULT_TOOLS = ["Figma"];

/** "Software designer" / "Software specialist" when the category is the same word as the discipline (e.g. both "Software"). */
function roleLabel(discipline: string, category: string) {
  return category.trim() && category.trim().toLowerCase() !== discipline.trim().toLowerCase()
    ? `${discipline} ${category.toLowerCase()}`
    : `${discipline} specialist`;
}

function findCounterpartHandle(): string | undefined {
  const accounts = getAccounts().filter(
    (account) => account.handle !== VAEL_OUT_HANDLE && account.handle !== "alexmorgan",
  );
  const withIn = accounts.find((account) => getActiveListing(account.handle)?.side === "in");
  if (withIn) return withIn.handle;
  return accounts[0]?.handle;
}

function listingFromCounterpart(handle?: string): {
  category: string;
  discipline: string;
  skills: string[];
  tools: string[];
  certifications: string[];
  location: string;
  remoteOnsite: VaelListing["remoteOnsite"];
  timing: string;
  experienceYears: number;
  engagement: string;
  budgetProxy: string;
  requirements: string;
  timeline: string;
} {
  const listing = handle ? getActiveListing(handle) : undefined;
  const profile = handle ? getProfile(handle) : undefined;
  const discipline = listing?.discipline || profile?.disciplines[0] || "Software";
  const category = listing?.category || "Designer";
  return {
    category,
    discipline,
    skills: listing?.skills.length ? listing.skills : profile?.skills.length ? profile.skills : DEFAULT_SKILLS,
    tools: listing?.tools.length ? listing.tools : profile?.tools.length ? profile.tools : DEFAULT_TOOLS,
    certifications: listing?.certifications ?? [],
    location: listing?.location || profile?.location || "Lahore",
    remoteOnsite: listing?.remoteOnsite ?? profile?.workPreference ?? "remote",
    timing: listing?.timing ?? "This cycle",
    experienceYears: listing?.experienceYears ?? profile?.experienceYears ?? 8,
    engagement: listing?.engagement ?? "Project",
    budgetProxy: listing?.budgetProxy ?? "Day rate",
    requirements: listing?.requirements || "Available this cycle.",
    timeline: listing?.timeline ?? "This cycle",
  };
}

function outProfile(fields: ReturnType<typeof listingFromCounterpart>): ProfileRecord {
  return {
    handle: VAEL_OUT_HANDLE,
    displayName: VAEL_OUT_DISPLAY_NAME,
    profileType: "individual",
    headline: `Needs ${fields.category}`,
    bio: `Hiring a ${roleLabel(fields.discipline, fields.category)} this cycle. Looking for someone available now.`,
    disciplines: [fields.discipline],
    skills: fields.skills,
    tools: fields.tools,
    experience: "",
    experienceYears: fields.experienceYears,
    credentials: fields.requirements,
    location: fields.location,
    workPreference: fields.remoteOnsite,
    rates: `${fields.budgetProxy} after Handshake.`,
    portfolio: [{ label: "Studio", url: "https://example.com/akshayamjad" }],
    avatarUrl: "/people/p04.jpg",
    coverUrl: "/scenes/city-skyline-wide.jpg",
  };
}

/** Seeds (or refreshes) the Vael Out demo account so it can be signed into. */
export function ensureVaelOutAccount() {
  const existingAccount =
    findAccountByHandle(VAEL_OUT_HANDLE) ??
    (findAccountByEmail(VAEL_OUT_EMAIL)?.handle === VAEL_OUT_HANDLE ? findAccountByEmail(VAEL_OUT_EMAIL) : undefined);
  const handle = existingAccount?.handle || VAEL_OUT_HANDLE;
  registerAccount({
    handle,
    email: VAEL_OUT_EMAIL,
    phone: existingAccount?.phone || VAEL_OUT_PHONE,
    displayName: VAEL_OUT_DISPLAY_NAME,
    createdAt: existingAccount?.createdAt ?? new Date().toISOString(),
  });

  const counterpart = findCounterpartHandle();
  const fields = listingFromCounterpart(counterpart);
  const profile = getProfile(handle);
  if (!profile || profile.displayName === handle) {
    upsertProfile({ ...outProfile(fields), handle });
  }

  const districtId = (counterpart && getActiveDistrictId(counterpart)) || "media-technology";
  patchOnboarding(handle, {
    intent: "out",
    districtId,
    handleClaimed: true,
    profileType: "individual",
  });
  finishOnboarding(handle);
  setActiveDistrict(handle, districtId);

  const listingFields = {
    category: fields.category,
    discipline: fields.discipline,
    skills: fields.skills,
    tools: fields.tools,
    certifications: fields.certifications,
    location: fields.location,
    remoteOnsite: fields.remoteOnsite,
    timing: fields.timing,
    experienceYears: fields.experienceYears,
    engagement: fields.engagement,
    budgetProxy: fields.budgetProxy,
    description: `Need a ${roleLabel(fields.discipline, fields.category)} this cycle.`,
    requirements: fields.requirements,
    timeline: fields.timeline,
  };

  const live = getActiveListing(handle);
  if (!live || live.side !== "out") {
    publishListing({
      handle,
      side: "out",
      ...listingFields,
      contact: "",
    });
  } else {
    patchVisibleListing(handle, listingFields);
  }

  return handle;
}
