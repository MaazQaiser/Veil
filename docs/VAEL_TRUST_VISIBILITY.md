# THE CITY OF VAEL — Trust, Visibility & Structural Subscription

**Date:** 27 August 2026  
**Milestone:** Trust / Visibility / Structural subscription  
**Principle:** Continue, don’t rebuild. Trust and Visibility stay separate. Payments stay out of scope.

---

## Audit (this tree, before this milestone)

| Surface | State |
|---|---|
| Profile | Resume-like tabs; PL-021 public handle, district after sign-in; rates/portfolio Handshake-locked |
| Verification | `VerificationState` with Unverified / Pending / Verified tokens. **Product only used Unverified** |
| Documents | Local `dataUrl` per Room (`mtx_mock_documents_v1`, `cx_`, `tx_`, `rx_`, `cm_`). No cloud |
| Credentials | Free-text / label arrays. Matching may score overlap. **Not validated** |
| Completeness | Already a **matching** weight. Not a trust score |
| `/account/visibility` | Stub: demo pricing line + Go Visible |
| `/extended-vael` | Header only. Checkout/success routes **missing** |
| Admin console | **Not in this kit.** Original clone had mock admin; roles are documented, not a live staff OS |
| Stripe | **Not present** |

### KEEP / IMPROVE / MISSING / UNSUPPORTED

| | |
|---|---|
| **KEEP** | 24-hour Free Daily VAEL, `plan: "daily"`, Handshake privacy, Unverified as honest default, local documents |
| **IMPROVE** | Profile hierarchy, document restricted empty, visibility by Room, Extended VAEL demo suite |
| **MISSING** | Identity workflow, credential records, cloud files, billing, admin document review |
| **UNSUPPORTED** | Verified badges from filled profiles, trust scores, purchasable plans, Stripe |

---

## 1. Trust model

Trust answers: **can I understand who this is, without pretending they are verified?**

Trust is **not** visibility and **not** a subscription.

Spine for a connection decision:

```
Identity → Capabilities → Experience → Credentials → Documents → Portfolio → Verification → Reputation
```

Reputation is **not modeled**. Verification is **Unverified** only.

---

## 2. Profile hierarchy

Tabs (same structure in every live Room):

1. **Identity** — handle, name, type, about, location/area (after local sign-in)
2. **Capabilities / Trade / Lanes / Service** — district fields, experience, credential **labels**, portfolio/history after Handshake
3. **Documents** — local files; restricted until Handshake unless `publicFlag` or self
4. **Trust** — Unverified, fill count, reputation not modeled

Fill count copy: “Details listed on this device: N of M · Incomplete/Complete”. Screen readers hear that this is **not a trust score**.

---

## 3. Verification

| State | In product? |
|---|---|
| Unverified | **Yes — only honest product state** |
| Review pending | Design-system token only. Not written by profile/document flows |
| Verified | Design-system token only. **Never shown because a profile has data** |

Future dependency: an Owner-locked identity/credential workflow (PL-014).

---

## 4. Credentials

Labels on the profile and, where the listing has them, on the VAEL.

UX: listed vs none listed. Copy states they are **not validated**.

Matching may already use credential overlap. This milestone does **not** change matching weights.

---

## 5. Documents

Local only. Types remain City-generic: license / insurance / capability.

| Viewer | Sees |
|---|---|
| Self | All of their files |
| Public flag | Listed card |
| Handshake `connected` | Remaining private files |
| Others | Restricted empty if files exist but are private; “No documents” if none |

Status labels: **On this device**, **Listed**, **Restricted**. Gallery may show “Review (demo)” — there is no admin review backend here.

No cloud storage. `dataUrl` stays on this device.

---

## 6. Privacy

PL-021 option **(c)** unchanged:

- Public: handle, display name, headline, Unverified
- After local sign-in: district payload
- After Handshake `connected`: rates, portfolio/history, private documents, contact

Anonymous visitors still do not receive district payload.

---

## 7. Handshake visibility boundary

Match detail may show: Unverified, credential labels present/absent, **public** documents listed (existence only), listing fill complete/incomplete, public profile link. Private document existence is not disclosed.

Match detail does **not** show private rates, portfolio URLs, document files, or contact.

After mutual accept: existing revealed profile + documents rules. Copy notes that **connected is not verification**.

---

## 8. Visibility status

Visibility answers: am I on a Board, for what, for how long?

| Kind | Meaning |
|---|---|
| Not visible | No listing for that Room |
| Visible (Veil In / Out) | Active listing, 24-hour Free Daily |
| Expiring | ≤ 4 hours left (`EXPIRING_HOURS`) — existing clock |
| Expired | Latest listing exists but `expiresAt` has passed (still in local storage; not on the Board) |

No new expiry math. Listings still use `DEFAULT_DURATION_HOURS = 24` and `plan: "daily"`.

---

## 9. Veil management

Existing Room Veil forms: Veil In, Veil Out, Re-veil (publish again), End visibility, Edit fields.

Expired latest listing shows Expired + re-veil copy. No scheduling. No recurring visibility.

---

## 10. Account visibility

`/account/visibility` lists each live Room with `VisibilityCard` (status, intent, context, hours, Go Visible / Re-veil / Edit).

Plan line: current = Free Daily VAEL. Extended is a demo link only.

Header session veil still follows Media & Technology when that Room is active (existing `vaelCore` sync). Per-Room truth is this page.

---

## 11. Plans

Catalog: `src/lib/visibilityPlans.ts`

| Plan | Status | Purchasable |
|---|---|---|
| Free Daily VAEL | Current (24 hours) | No (it is free and already what listings use) |
| Extended VAEL | Demo | **false** |

No invented dollar amounts (PL-022). No invented Extended duration — this kit never writes a non-daily `plan`.

---

## 12. Demo pricing

Label preserved exactly:

**DEMO PRICING — NOT YET AVAILABLE FOR PURCHASE**

`DemoPurchaseNotice` on plans, checkout, success, and account visibility.

---

## 13. Checkout structure

`/extended-vael/checkout?plan=extended`

Review only: selected plan, visibility truth (24-hour clock unchanged), what would happen if billing existed.

CTA: **Continue demo (no charge)** — outline, not a pay button. No card fields. No Stripe.

---

## 14. Success state

`/extended-vael/success`

“Demo complete. No purchase was made. No billing record exists.” Visibility unchanged.

---

## 15. Admin / moderation

Documented roles (owner, admin, manager, developer, moderator, member) are **not changed**.

This kit has **no** `/media-technology/admin` console. Members do not see staff controls. Handshake **Block** remains connection-only.

---

## 16. Components

**Trust:** `TrustSummary`, `ProfileCompleteness`, `CredentialCard`, `ProfileDocumentsSection`, `ProfileTrustPanel`, `MatchTrustNote`, `VerificationState`, `DocumentCard`

**Visibility:** `VisibilityStatus`, `VisibilityCard`, `VeilStatus`

**Plans:** `PlanCard`, `PlanComparison`, `DemoPurchaseNotice`

---

## 17. States

**Trust:** Incomplete / Complete (fill count); Unverified; Documents none / available / restricted.

**Visibility:** Not visible / Visible / Expiring / Expired; Re-veil on Veil forms.

**Plans:** Current / Demo / Not available for purchase.

**Checkout:** Review / Demo unavailable / Honest success. No payment error path (no payment).

---

## 18. Responsive behavior

Plan comparison is a **two-column grid that stacks** (`md:grid-cols-2`). Not a desktop table on a 320px screen.

Profile tabs wrap. Visibility cards stack. Document rows stay one column.

---

## 19. Accessibility

- Unverified is text + badge, not color alone  
- Fill count has `role="status"` and a screen-reader note that it is not a trust score  
- Demo notice is `Alert` (`role="status"`)  
- Plan CTAs are links with honest labels  
- Document restricted vs listed is text, not a green check  

---

## 20. Data-model limitations

| | UX | Data |
|---|---|---|
| Profile fields | Shown | Local profile records |
| Verification | Unverified | **No** verified flag |
| Documents | Listed / restricted | Local `dataUrl` |
| Visibility | 24h + expired latest | `expiresAt`, `plan: "daily"` only |
| Plans | Catalog UI | **No** subscription row |

---

## 21. Backend limitations

Not ready: identity provider, document review, Stripe, invoices, `visibility_plans.is_purchasable`, cloud storage, RLS.

Do not connect Supabase from this milestone.

---

## 22. Owner decisions

| ID | Decision |
|---|---|
| PL-014 | Unverified-only until a real workflow. Confirm. |
| PL-021 | Option (c) retained. Confirm. |
| PL-022 | Extended remains demo; no new prices. Confirm. |
| PL-015 | Structural hooks only; no billing vendor. |

---

## 23. Remaining work

- Identity / credential verification when architecture exists  
- Cloud document storage and staff review  
- Billing only after a Change Order  
- Optional: session veil aggregated across Rooms (today M&T drives the header)  

**Do not start QA/handoff from this milestone automatically.**
