/**
 * Wizard-only onboarding state. The post-join provider journey stays in providerJourney.ts.
 */

import {
  handleIssue,
  isHandleAvailable,
  renameAccountHandle,
} from "./accounts";
import { districts } from "./districts";
import { PRODUCT_HOME, profileReady } from "./providerJourney";
import { getProfile, renameProfileHandle } from "./vaelStore";

const KEY = "vael_onboarding_v1";

export const ONBOARDING_STEPS = [
  "Sign Up",
  "Intent",
  "Welcome",
  "Profile Setup",
  "Identity",
  "Credentials",
  "Preview",
  "Done",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

const PROFILE_BUILD_STEPS: readonly OnboardingStep[] = ["Identity", "Credentials"];

export type OnboardingIntent = "in" | "out" | "need" | "";
export type OnboardingNeedPlace = "home" | "business" | "";

/** VAEL OUT request steps. Separate from the VAEL IN wizard indexes. */
export const VAEL_OUT_STEPS = ["need", "who", "location", "requirements", "timing", "details", "review"] as const;

export type VaelOutStep = (typeof VAEL_OUT_STEPS)[number];

export type OnboardingDraft = {
  handle: string;
  intent: OnboardingIntent;
  profileType: "individual" | "business" | "";
  districtId: string;
  handleClaimed: boolean;
  completedStep: OnboardingStep;
  completedAt?: string;
  /** Home vs business after "I need something done". Internal only. */
  needPlace?: OnboardingNeedPlace;
  /** Current VAEL OUT step. "submitted" means the request was posted. */
  outStep?: VaelOutStep | "submitted";
};

export function isVaelOutStep(value: string): value is VaelOutStep {
  return (VAEL_OUT_STEPS as readonly string[]).includes(value);
}

export function vaelOutPath(step: VaelOutStep) {
  return `/join/out/${step}`;
}

/** Step the person should see. `outStep` is the step they are on. */
export function vaelOutResume(draft: OnboardingDraft | undefined): string {
  const step = draft?.outStep;
  if (step && isVaelOutStep(step)) return vaelOutPath(step);
  return vaelOutPath("need");
}

export function vaelOutPrevious(step: VaelOutStep): string | null {
  const index = VAEL_OUT_STEPS.indexOf(step);
  if (index <= 0) return null;
  return vaelOutPath(VAEL_OUT_STEPS[index - 1]);
}

export function vaelOutNext(step: VaelOutStep): VaelOutStep | "submitted" {
  const next = VAEL_OUT_STEPS[VAEL_OUT_STEPS.indexOf(step) + 1];
  return next ?? "submitted";
}

/** `/join/out`, a known step, or an unknown step under that prefix. */
export function vaelOutVisit(pathname: string): VaelOutStep | "index" | "invalid" | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (normalized === "/join/out") return "index";
  const match = normalized.match(/^\/join\/out\/([^/]+)$/);
  if (!match) return null;
  return isVaelOutStep(match[1]) ? match[1] : "invalid";
}

export const ONBOARDING_PATH: Record<OnboardingStep | "Need", string> = {
  "Sign Up": "/join",
  Intent: "/join/intent",
  Need: "/join/need",
  Welcome: "/join/welcome",
  "Profile Setup": "/join/setup",
  Identity: "/join/identity",
  Credentials: "/join/credentials",
  Preview: "/join/preview",
  Done: "/join/done",
};

export const CONTRACTOR_HOME_PATH = "/need/home";
export const CONTRACTOR_BUSINESS_PATH = "/districts/contractor/vael?side=out";

export function isNeedIntent(draft: OnboardingDraft | undefined) {
  return draft?.intent === "need";
}

/** Where a "I need something done" member should land. Never names districts. */
export function needExperienceLanding(draft: OnboardingDraft | undefined) {
  if (!draft || draft.intent !== "need") return ONBOARDING_PATH.Need;
  if (draft.needPlace === "home") return CONTRACTOR_HOME_PATH;
  if (draft.needPlace === "business") return CONTRACTOR_BUSINESS_PATH;
  return ONBOARDING_PATH.Need;
}

export function signedInLanding(_handle: string) {
  return PRODUCT_HOME;
}

type StoredDraft = Omit<OnboardingDraft, "completedStep"> & { completedStep: string };
type Store = Record<string, OnboardingDraft>;

function migrateCompletedStep(step: string): OnboardingStep {
  if (step === "Profile") return "Credentials";
  if ((ONBOARDING_STEPS as readonly string[]).includes(step)) return step as OnboardingStep;
  return "Sign Up";
}

function readStore(): Store {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredDraft>;
    const next: Store = {};
    let changed = false;
    for (const [handle, draft] of Object.entries(parsed)) {
      const completedStep = migrateCompletedStep(draft.completedStep);
      if (completedStep !== draft.completedStep) changed = true;
      next[handle] = { ...draft, completedStep };
    }
    if (changed) writeStore(next);
    return next;
  } catch {
    return {};
  }
}

function writeStore(next: Store) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getOnboardingDraft(handle: string): OnboardingDraft | undefined {
  if (!handle) return undefined;
  return readStore()[handle];
}

export function startOnboarding(handle: string): OnboardingDraft {
  const draft: OnboardingDraft = {
    handle,
    intent: "",
    profileType: "",
    districtId: "",
    handleClaimed: false,
    completedStep: "Sign Up",
    needPlace: "",
  };
  writeStore({ ...readStore(), [handle]: draft });
  return draft;
}

export function patchOnboarding(handle: string, patch: Partial<OnboardingDraft>): OnboardingDraft {
  const current = getOnboardingDraft(handle) ?? startOnboarding(handle);
  const next: OnboardingDraft = { ...current, ...patch, handle: patch.handle ?? current.handle };
  const store = { ...readStore() };
  if (next.handle !== handle) delete store[handle];
  store[next.handle] = next;
  writeStore(store);
  return next;
}

export function completeOnboardingStep(handle: string, step: OnboardingStep): OnboardingDraft {
  return patchOnboarding(handle, { completedStep: step });
}

export function finishOnboarding(handle: string): OnboardingDraft {
  return patchOnboarding(handle, { completedStep: "Done", completedAt: new Date().toISOString() });
}

export function clearOnboardingDrafts() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
}

/** Removes one handle's draft, leaving every other handle's draft untouched. Used by the demo reset. */
export function clearOnboardingDraftFor(handle: string) {
  const store = readStore();
  if (!(handle in store)) return;
  const { [handle]: _removed, ...rest } = store;
  writeStore(rest);
}

export function onboardingComplete(handle: string): boolean {
  if (!handle) return false;
  const draft = getOnboardingDraft(handle);
  if (draft?.completedAt) return true;
  if (!draft && profileReady(getProfile(handle))) return true;
  return false;
}

export function onboardingStepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

function nextStep(completed: OnboardingStep): OnboardingStep {
  const index = ONBOARDING_STEPS.indexOf(completed);
  return ONBOARDING_STEPS[Math.min(index + 1, ONBOARDING_STEPS.length - 1)];
}

export function onboardingStep(handle: string): OnboardingStep | "Need" {
  if (!handle) return "Sign Up";
  if (onboardingComplete(handle)) return "Done";
  const draft = getOnboardingDraft(handle);
  if (!draft) return "Sign Up";
  if (draft.intent === "need") return "Need";
  return nextStep(draft.completedStep);
}

export function districtProfileEditRoute(districtId: string, handle: string): string {
  const district = districts.find((item) => item.id === districtId);
  if (!district || district.id === "media-technology") return ONBOARDING_PATH.Identity;
  return `${district.route}/profile/${handle}/edit`;
}

export function matchingBoardRoute(districtId: string): string {
  if (!districtId || districtId === "recommended") return "/matches";
  if (districtId === "all") return "/matches?district=all";
  const district = districts.find((item) => item.id === districtId);
  return district ? `/matches?district=${district.id}` : "/matches";
}

export function onboardingRoute(handle: string): string {
  const draft = getOnboardingDraft(handle);
  if (isNeedIntent(draft)) return needExperienceLanding(draft);
  if (draft?.intent === "out" && draft.outStep && draft.outStep !== "submitted") {
    return vaelOutResume(draft);
  }
  if (draft?.intent === "out" && !onboardingComplete(handle)) {
    return vaelOutResume(draft);
  }

  const step = onboardingStep(handle);
  if (step !== "Need" && PROFILE_BUILD_STEPS.includes(step)) {
    if (draft?.districtId && draft.districtId !== "media-technology") {
      return districtProfileEditRoute(draft.districtId, handle);
    }
  }
  if (step === "Need") return ONBOARDING_PATH.Need;
  return ONBOARDING_PATH[step];
}

export function pathToOnboardingStep(pathname: string): OnboardingStep | "Need" | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (normalized === "/join") return "Sign Up";
  if (normalized === "/join/profile") return "Identity";
  const found = (Object.entries(ONBOARDING_PATH) as Array<[OnboardingStep | "Need", string]>).find(
    ([, path]) => path === normalized,
  );
  return found?.[0] ?? null;
}

export function claimOnboardingHandle(
  currentHandle: string,
  requested: string,
): { ok: true; handle: string } | { ok: false; error: string } {
  const handle = requested.trim().toLowerCase().replace(/^@/, "");
  const issue = handleIssue(handle);
  if (issue) return { ok: false, error: issue };
  if (!isHandleAvailable(handle, currentHandle)) return { ok: false, error: "That handle is taken." };

  if (handle !== currentHandle) {
    renameAccountHandle(currentHandle, handle);
    renameProfileHandle(currentHandle, handle);
    patchOnboarding(currentHandle, { handle, handleClaimed: true });
  } else {
    patchOnboarding(currentHandle, { handleClaimed: true });
  }
  return { ok: true, handle };
}
