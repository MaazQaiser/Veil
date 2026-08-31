/**
 * Structural visibility catalog only.
 *
 * Free Daily VAEL is what listings already use (`plan: "daily"`, 24 hours).
 * Extended VAEL is the documented demo suite — not purchasable.
 *
 * No Stripe, no cents invented beyond the existing DEMO PRICING label,
 * no duration invented for Extended (this kit never writes a non-daily plan).
 */

import { DEFAULT_DURATION_HOURS, EXPIRING_HOURS, hoursLeft } from "./vaelStore";

export const DEMO_PRICING_LABEL = "DEMO PRICING — NOT YET AVAILABLE FOR PURCHASE";

export type VisibilityPlanId = "daily" | "extended";

export type VisibilityPlanStatus = "current" | "available" | "demo" | "unavailable";

export type VisibilityPlan = {
  id: VisibilityPlanId;
  name: string;
  duration: string;
  status: VisibilityPlanStatus;
  purchasable: false;
  included: string[];
  notIncluded: string[];
};

export const VISIBILITY_PLANS: VisibilityPlan[] = [
  {
    id: "daily",
    name: "Free Daily VAEL",
    duration: `${DEFAULT_DURATION_HOURS} hours`,
    status: "current",
    purchasable: false,
    included: [
      "Appear on the Matching Board in a live Room",
      "Veil In (available) or Veil Out (need someone)",
      "Re-veil starts a new 24-hour window on this device",
    ],
    notIncluded: [
      "Identity verification",
      "Paid promotion",
      "Duration beyond 24 hours",
    ],
  },
  {
    id: "extended",
    name: "Extended VAEL",
    duration: "Not active in this kit",
    status: "demo",
    purchasable: false,
    included: [
      "Structural plan page, checkout review, and success copy",
      "A place for Owner-locked longer visibility later",
    ],
    notIncluded: [
      "A real purchase",
      "A change to the 24-hour listing clock",
      "Stripe, invoices, or a billing record",
    ],
  },
];

export function planById(id: string | null | undefined) {
  return VISIBILITY_PLANS.find((item) => item.id === id);
}

export type VisibilityKind = "none" | "in" | "out" | "expiring" | "expired";

export function visibilityKindFromListing(listing?: { side: "in" | "out"; expiresAt: string } | null): VisibilityKind {
  if (!listing) return "none";
  if (Date.parse(listing.expiresAt) <= Date.now()) return "expired";
  if (hoursLeft(listing.expiresAt) <= EXPIRING_HOURS) return "expiring";
  return listing.side;
}

export function visibilityHours(listing?: { expiresAt: string } | null) {
  if (!listing) return undefined;
  if (Date.parse(listing.expiresAt) <= Date.now()) return 0;
  return hoursLeft(listing.expiresAt);
}
