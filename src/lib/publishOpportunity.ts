import { findAccountByHandle } from "@/lib/accounts";
import {
  attachDraftToHandle,
  CX_LIVE_DAYS,
  notifyVaelInOfOpportunity,
  patchCxProject,
  RX_PROJECT_CATEGORIES,
  saveProjectContact,
  startCxDraft,
  type CxBudgetBand,
  type CxTiming,
  type RxProjectCategory,
} from "@/lib/cxProjectStore";
import { readNeedWork } from "@/lib/needWork";
import { patchOnboarding } from "@/lib/onboarding";

function isCategory(value: string): value is RxProjectCategory {
  return (RX_PROJECT_CATEGORIES as readonly string[]).includes(value);
}

/** Turns what was entered in the posting steps into a live opportunity for the signed-in account. */
export function publishResidentialOpportunity(handle: string) {
  const work = readNeedWork();
  const category = work.categories.find(isCategory);
  if (!category || !handle) throw new Error("Sign in to publish this opportunity.");
  const account = findAccountByHandle(handle);
  const draft = startCxDraft(category);
  saveProjectContact(draft.id, work.saveEmail || account?.email || "", work.savePhone || account?.phone || "");
  const attached = attachDraftToHandle(draft.id, handle, account?.displayName.split(" ")[0] || "");
  const publishedAt = new Date().toISOString();
  const liveUntil = new Date(Date.parse(publishedAt) + CX_LIVE_DAYS * 86400000).toISOString();
  const live = patchCxProject(attached.id, {
    description: work.description.trim(),
    photos: work.photos,
    video: work.video,
    city: work.city.trim(),
    postalCode: work.postalCode.trim(),
    timing: work.timing as CxTiming,
    budgetBand: work.budget as CxBudgetBand,
    emailConfirmed: true,
    phoneConfirmed: true,
    status: "live",
    publishedAt,
    liveUntil,
    history: [
      ...attached.history,
      { at: publishedAt, kind: "published", note: `Opportunity published for ${CX_LIVE_DAYS} days.` },
    ],
  });
  patchOnboarding(handle, { intent: "out", needPlace: "home" });
  notifyVaelInOfOpportunity(live);
  return draft.id;
}
