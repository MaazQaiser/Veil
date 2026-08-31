/**
 * Wizard-only onboarding state. The post-join provider journey stays in providerJourney.ts.
 */

import {
  handleIssue,
  isHandleAvailable,
  renameAccountHandle,
} from "./accounts";
import { districts } from "./districts";
import { profileReady } from "./providerJourney";
import { getProfile, renameProfileHandle } from "./vaelStore";

const KEY = "vael_onboarding_v1";

export const ONBOARDING_STEPS = [
  "Sign Up",
  "Welcome",
  "Handle",
  "Profile Type",
  "District",
  "Identity",
  "Expertise",
  "Work",
  "Credentials",
  "Preview",
  "Veil In",
  "Done",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

const PROFILE_BUILD_STEPS: readonly OnboardingStep[] = ["Identity", "Expertise", "Work", "Credentials"];

export type OnboardingDraft = {
  handle: string;
  profileType: "individual" | "business" | "";
  districtId: string;
  handleClaimed: boolean;
  completedStep: OnboardingStep;
  completedAt?: string;
};

export const ONBOARDING_PATH: Record<OnboardingStep, string> = {
  "Sign Up": "/join",
  Welcome: "/join/welcome",
  Handle: "/join/handle",
  "Profile Type": "/join/type",
  District: "/join/district",
  Identity: "/join/identity",
  Expertise: "/join/expertise",
  Work: "/join/work",
  Credentials: "/join/credentials",
  Preview: "/join/preview",
  "Veil In": "/join/veil",
  Done: "/join/done",
};

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
    profileType: "",
    districtId: "",
    handleClaimed: false,
    completedStep: "Sign Up",
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

export function onboardingStep(handle: string): OnboardingStep {
  if (!handle) return "Sign Up";
  if (onboardingComplete(handle)) return "Done";
  const draft = getOnboardingDraft(handle);
  if (!draft) return "Sign Up";
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
  const step = onboardingStep(handle);
  if (PROFILE_BUILD_STEPS.includes(step)) {
    const draft = getOnboardingDraft(handle);
    if (draft?.districtId && draft.districtId !== "media-technology") {
      return districtProfileEditRoute(draft.districtId, handle);
    }
  }
  return ONBOARDING_PATH[step];
}

export function pathToOnboardingStep(pathname: string): OnboardingStep | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (normalized === "/join") return "Sign Up";
  if (normalized === "/join/profile") return "Identity";
  const found = (Object.entries(ONBOARDING_PATH) as Array<[OnboardingStep, string]>).find(
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
    patchOnboarding(currentHandle, { handle, handleClaimed: true, completedStep: "Handle" });
  } else {
    patchOnboarding(currentHandle, { handleClaimed: true, completedStep: "Handle" });
  }
  return { ok: true, handle };
}
