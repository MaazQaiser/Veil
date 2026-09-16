/**
 * Two-account Vael In / Vael Out client-demo reset.
 *
 * Separate from the single-persona walkthrough reset in demoJourney.ts
 * (resetClientDemoData / DEMO_HANDLE = "alexmorgan") — that one keeps only the
 * guided-tour persona. This one surgically removes exactly the given demo
 * accounts (by email) and everything they touched, leaving every other
 * account, the seed/sample people, and the walkthrough persona untouched.
 */

import { findAccountByEmail, removeAccountByHandle } from "./accounts";
import { clearOnboardingDraftFor } from "./onboarding";
import { clearManuallyJoinedDistricts } from "./myDistricts";
import { clearSavedMatches } from "./savedMatches";
import { clearDemoDraft } from "./demoJourney";
import { purgeHandle as purgeMtHandle } from "./vaelStore";
import { purgeRxHandle } from "./residentialStore";
import { purgeCxHandle } from "./constructionStore";
import { purgeTxHandle } from "./truckingStore";
import { purgeCmHandle } from "./commercialStore";
import { purgeHandleFromCommunity } from "./communityStore";

/** The two named client-demo accounts this reset targets by default. */
export const VAEL_DEMO_ACCOUNT_EMAILS = ["aqsa.amjad@gmail.com", "aqsa.amjad005@gmail.com"];

/**
 * Removes every trace of the given demo accounts (profile, listings, documents,
 * district membership, saved matches, onboarding draft, connections, messages,
 * notices, community activity, and the account row itself) across every
 * district store. Accounts that don't exist on this device are skipped.
 * Returns the handles actually removed.
 */
export function resetVaelDemoAccounts(emails: string[] = VAEL_DEMO_ACCOUNT_EMAILS): string[] {
  const removedHandles: string[] = [];
  for (const email of emails) {
    const account = findAccountByEmail(email);
    if (!account) continue;
    const { handle } = account;

    purgeMtHandle(handle);
    purgeRxHandle(handle);
    purgeCxHandle(handle);
    purgeTxHandle(handle);
    purgeCmHandle(handle);
    purgeHandleFromCommunity(handle);
    clearManuallyJoinedDistricts(handle);
    clearSavedMatches(handle);
    clearDemoDraft(handle);
    clearOnboardingDraftFor(handle);
    removeAccountByHandle(handle);

    removedHandles.push(handle);
  }
  return removedHandles;
}
