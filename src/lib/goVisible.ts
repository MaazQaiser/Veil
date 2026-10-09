/**
 * Website entry only. Picks which existing flow to enter after Go Visible.
 * Does not merge Vael In, Vael Out, project creation, or opportunity search.
 */

import {
  ONBOARDING_PATH,
  getOnboardingDraft,
  isVaelOutStep,
  onboardingComplete,
  patchOnboarding,
  vaelOutPath,
  type VaelOutStep,
} from "./onboarding";
import { NEED_PATH } from "./cxRoutes";
import { PRODUCT_HOME } from "./providerJourney";
import { getActiveListing } from "./vaelStore";

export const GO_VISIBLE_ENTRIES = ["in", "out", "opportunities"] as const;

export type GoVisibleEntry = (typeof GO_VISIBLE_ENTRIES)[number];

export function parseGoVisibleEntry(value: string | null): GoVisibleEntry | "" {
  return GO_VISIBLE_ENTRIES.includes(value as GoVisibleEntry) ? (value as GoVisibleEntry) : "";
}

/** Where a chosen Go Visible intent should land once the person is signed in. */
export function routeForGoVisibleEntry(handle: string, entry: GoVisibleEntry): string {
  if (entry === "opportunities") return NEED_PATH;
  if (entry === "out") return routeVaelOutEntry(handle);
  if (onboardingComplete(handle)) return PRODUCT_HOME;
  patchOnboarding(handle, { intent: entry, completedStep: "Intent" });
  return ONBOARDING_PATH.Welcome;
}

/** VAEL OUT onboarding, or the existing OUT home when that request is already posted. */
function routeVaelOutEntry(handle: string): string {
  const draft = getOnboardingDraft(handle);
  const inProgress = Boolean(draft?.outStep && draft.outStep !== "submitted");
  if (!inProgress && onboardingComplete(handle) && getActiveListing(handle)?.side === "out") {
    return PRODUCT_HOME;
  }
  if (!inProgress && onboardingComplete(handle) && draft?.intent === "out") {
    return PRODUCT_HOME;
  }
  const step: VaelOutStep = inProgress && isVaelOutStep(String(draft?.outStep)) ? (draft!.outStep as VaelOutStep) : "need";
  patchOnboarding(handle, {
    intent: "out",
    outStep: step,
    ...(draft?.completedAt ? {} : { completedStep: "Intent" }),
  });
  return vaelOutPath(step);
}
