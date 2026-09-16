import { profileFieldsFor, requiredFieldsFilled } from "./profileFields";
import {
  getActiveListing,
  getConnections,
  getDocuments,
  getProfile,
  type ProfileDocument,
  type ProfileRecord,
  type VaelSide,
} from "./vaelStore";

/** Centralized in-app home for an onboarded Professional. Marketing stays at `/`. */
export const PRODUCT_HOME = "/media-technology";

/**
 * Dark mode is scoped to the Media & Technology dashboard flow — its own pages
 * plus the shared utility pages that flow reaches (inbox, saved posts, search,
 * account, notifications). Other Districts' own product pages stay untouched.
 */
export function isDarkModeFlowPath(pathname: string) {
  if (pathname.startsWith(PRODUCT_HOME)) return true;
  if (pathname === "/messages" || pathname === "/feed/saved" || pathname === "/search") return true;
  if (pathname === "/notifications" || pathname === "/account" || pathname.startsWith("/account/")) return true;
  return false;
}

/** Ordered provider journey — one direction, no loops. */
export const JOURNEY_STEPS = [
  "Join",
  "Profile",
  "District",
  "Availability",
  "Vael In",
  "Matches",
  "Handshake",
  "Connected",
  "Chat",
] as const;

export type JourneyStep = (typeof JOURNEY_STEPS)[number];

export function profileReady(profile: ProfileRecord | undefined): boolean {
  return requiredFieldsFilled(profile);
}

/** Field-level completeness for the product home card — not a matching weight. */
export function profileCompletion(
  profile: ProfileRecord | undefined,
  documents: ProfileDocument[] = [],
  side: VaelSide = "in",
): { percent: number; prompt: string } {
  const fields = profileFieldsFor(side);
  if (!profile) {
    return { percent: 0, prompt: fields[0].prompt };
  }
  const filled = fields.filter((field) => field.filled(profile, documents)).length;
  const missing = fields.find((field) => !field.filled(profile, documents));
  return {
    percent: Math.round((filled / fields.length) * 100),
    prompt: missing?.prompt ?? "Your profile is complete.",
  };
}

export function profileCompletionFor(handle: string, side: VaelSide = "in") {
  return profileCompletion(getProfile(handle), getDocuments(handle), side);
}

export function journeyStep(handle: string): JourneyStep {
  const profile = getProfile(handle);
  const listing = getActiveListing(handle);
  const connections = getConnections().filter(
    (item) => item.requesterHandle === handle || item.counterpartHandle === handle,
  );
  const connected = connections.find((item) => item.status === "connected");
  const pending = connections.find((item) => item.status === "pending");

  if (connected) {
    return "Chat";
  }
  if (pending) {
    return "Handshake";
  }
  if (listing) {
    return "Matches";
  }
  if (profileReady(profile)) {
    return "Availability";
  }
  return "Profile";
}

/** The one route the user should land on to keep moving forward. */
export function journeyRoute(handle: string): string {
  switch (journeyStep(handle)) {
    case "Profile":
      return `/media-technology/profile/${handle}/edit`;
    case "Availability":
      return "/media-technology";
    case "Vael In":
      return "/media-technology/vael?create=1";
    case "Matches":
      return "/media-technology/board";
    case "Handshake": {
      const pending = getConnections().find(
        (item) =>
          item.status === "pending" &&
          (item.requesterHandle === handle || item.counterpartHandle === handle),
      );
      return pending ? `/media-technology/connections/${pending.id}` : "/media-technology/board";
    }
    case "Chat": {
      const connected = getConnections().find(
        (item) =>
          item.status === "connected" &&
          (item.requesterHandle === handle || item.counterpartHandle === handle),
      );
      return connected ? `/media-technology/connections/${connected.id}` : "/media-technology/connections";
    }
    case "Join":
    default:
      return "/join";
  }
}

export function journeyStepIndex(step: JourneyStep): number {
  return JOURNEY_STEPS.indexOf(step);
}
