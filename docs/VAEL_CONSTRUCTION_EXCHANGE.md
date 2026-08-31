# THE CITY OF VAEL — Construction Exchange

**Date:** 27 August 2026  
**Milestone:** Construction Exchange  
**Principle:** Continue, don’t rebuild. Parallel Room — not a relabeled Media & Technology copy.  
**Runtime:** Local `cx_mock_*` keys. Handshake/messages reuse the existing connection store with `district: "construction"`. No Supabase, Stripe, SMS, or cloud files.

---

## Audit (this tree, before this milestone)

| Surface | State |
|---|---|
| Registry lot | Display **Construction**, slug `/districts/contractor`, status **Coming Soon** (PL-020) |
| `DistrictPlaceholder` | Honest empty lot + “no Board / Veil / Handshake” |
| Construction components / data | **None** |
| Matching | Media & Technology `matching.ts` only (protected) |

### KEEP / IMPROVE / REPLACE / MISSING

| | |
|---|---|
| **KEEP** | City shell, Handshake lock, 24h veil, match bands, `/districts/contractor` slug, registry name Contractor, M&T weights untouched |
| **IMPROVE** | Lot is now **Live**; Go Visible chooses a Room; City messages include Construction threads |
| **REPLACE** | Placeholder landing for this slug only — other lots stay `DistrictPlaceholder` |
| **MISSING (still)** | Owner-locked Construction weights, license validation, Construction Community posts, cross-device Handshake |

---

## 1. Construction product model

Construction Exchange is a **VAEL district**: availability and need, scored by Construction fit, locked by Handshake.

It is not a job board, contractor directory, or marketplace.

Spine (same as the City):

```
Profile → Veil In/Out (24h VAEL) → Matching Board
  → Match detail → Request Handshake
  → both accept → Connection (reveal) → Message
```

**Do not** reuse Media & Technology fields (discipline, tools, remote/onsite, engagement, budget proxy).

---

## 2. User intents

| Intent | Veil | Copy |
|---|---|---|
| **Available** | In | “I am available for construction work.” |
| **Need** | Out | “I need construction capability.” |

One Room, two sides. Opposite-side listings rank on the Board.

---

## 3. Information architecture

City shell. Routes stay on the Contractor slug (PL-020). `/construction` redirects here.

| Screen | Route |
|---|---|
| Construction Home | `/districts/contractor` |
| How it works | `/districts/contractor/how-it-works` |
| Veil / create VAEL | `/districts/contractor/veil` |
| Matching Board | `/districts/contractor/board` |
| Match detail | `/districts/contractor/board/:listingId` |
| Profile | `/districts/contractor/profile/:username` |
| Profile edit | `/districts/contractor/profile/:username/edit` |
| Handshakes | `/districts/contractor/connections` |
| Handshake Room | `/districts/contractor/connections/:id` |

Community: **not implemented** (no post architecture for this district). Home states that honestly. No fake posts.

---

## 4. Profile model

Separate `cx_mock_profiles_v1` so a handle can hold a Construction record without overwriting Media & Technology.

| Section | Fields | Notes |
|---|---|---|
| Identity | display name, professional/company, headline | Public (PL-021 option c) |
| About | about, service area | After local sign-in |
| Trade | trade, specialization, capabilities | Kit starter trades — Owner may replace |
| Experience | free text | |
| Credentials | user labels only | **Not** validated licenses |
| Rates / portfolio | | Closed to counterpart until Handshake `connected` |
| Documents | license / insurance / capability | Existing `DOC_TYPES`; local preview |
| Verification | Unverified | Only honest state |
| Reputation | — | Not modeled |

---

## 5. Veil flow

- Veil In / Veil Out with Construction copy
- Current status, trade, service area, availability, 24h duration
- Re-veil expires the current Construction listing and publishes a new one
- Same `DEFAULT_DURATION_HOURS = 24` and expiring threshold (4h) as the City

---

## 6. VAEL creation

Construction-only form:

- Intent
- Trade, job type, capabilities
- Credential labels + “insurance listed” flag
- Service area, availability, experience years
- Description / requirements / contact / timeline / optional scope note (local-only)

**Not collected:** media discipline, tools, remote/onsite, engagement, budget proxy as a scored field.

---

## 7. Matching Board

Hierarchy: **percent → why (relevant criteria) → trade → available/need → service area → timing → requirements → See Match**.

Filters: band (All / Strong / Good / Possible), trade. Desktop chips; mobile drawer.

---

## 8. Match Breakdown

Relevance labels, not per-criterion percentages:

| Relevance | Meaning |
|---|---|
| Relevant | Strong overlap on that Construction criterion |
| Partial | Some overlap |
| Does not overlap | Both sides listed, no overlap |
| Not listed | Empty on both sides (criterion excluded from the %) |

Overall % still comes from the sibling engine.

---

## 9. Match Detail

Answers who/what, why (relevance), what is available/needed, what is public now, what stays private, Request Handshake.

---

## 10. Handshake

Same connection model as Media & Technology (`mtx_mock_connections_v1`) with `district: "construction"`. Same states: request, pending, incoming, declined, connected, closed, blocked.

Sample handles `ridgeworks` / `lotnorth` can **Simulate counterpart accept (this device only)**.

---

## 11. Connection

After mutual accept: status, revealed Construction profile (trade, about, service area, rates), documents according to rules, conversation.

---

## 12. Messaging

Shared `MessageThread`. Same composer, attachment filename-only, sending/failed/empty. City `/messages` lists both districts and routes into the correct Handshake Room.

---

## 13. States

| Area | Represented | Not represented |
|---|---|---|
| District | Live (this Room); Coming Soon remains on other lots | |
| Veil | none, active, expiring, expired, creating, error | Paid extended duration |
| Board | empty (no veil), matches, filtered empty, expired match | Async spinner (local store is sync); live multi-user |
| Match | request, pending, connected, unavailable (expired) | |
| Profile | empty, incomplete, editing, saving, saved, error, unverified | Verified licenses |
| Handshake | request, pending, incoming, declined, connected, closed, blocked | Cross-device accept; listing-expiry auto-close |
| Community | Honest “not on this device” | Posts |

---

## 14. Responsive behavior

Match cards stack; filters in a sheet below `md`. Handshake actions wrap. Room nav scrolls. City dock padding unchanged (320–1440+).

---

## 15. Components

**Construction-specific:** `ConstructionTradeBadge`, `ConstructionMatchCard`, `ConstructionMatchBreakdown`, `ConstructionAvailabilityCard`, `ConstructionRequirementCard`, `ConstructionProjectSummary`.

**Reused:** City shell, `MatchPercent`, bands, `HandshakeStatus`, `ProfileCard`, `DocumentCard`, `VerificationState`, `MessageThread`, `DistrictRoomNav` (base path), `RequireMember`, Handshake actions.

---

## 16. Data-model limitations

- Construction listings/profiles are **local-only** (`cx_mock_*`).
- Description, requirements, contact, timeline, scope note are not Foundation `vaels` columns (PL-004 analog).
- No license/insurance validation, numbers, or jurisdictions.
- Scope note is not scored and is not a payment field.
- Documents are local previews — NOT YET CONNECTED to storage.

---

## 17. Matching-engine limitations

- `src/lib/constructionMatching.ts` is a **sibling**. It does not import or change Framing §8 weights.
- Construction weights are **kit-proposed** (trade 28, job type 16, capabilities 12, service area 14, availability 12, credentials 8, experience 6, completeness 4). **Owner has not locked this table.**
- Overlap math is the same class of reconstruction as Media & Technology (exact / Jaccard / area substring). Not a generic shared engine module.

---

## 18. Open Owner decisions

| ID | Decision |
|---|---|
| PL-020 | Display is Construction; slug remains `/districts/contractor`; registry still says Contractor. Confirm rename in the live product registry. |
| Construction weights | Lock or replace the kit-proposed sibling table. |
| Trade / job-type lists | Kit starter lists. Replace with Owner-approved catalogs. |
| License rules | None implemented. Do not invent regulatory requirements. |
| PL-021 | Same option (c) as Media & Technology. |
| Community | No Construction posts until a real community architecture exists for this Room. |

---

## 19. Future Construction Community

When a district community service exists: add a Room item, keep sample/demo posts local-only, do not invent activity for an empty store. Until then the Home alert is the product surface.

**Recommended next milestone:** Trucking Exchange (own fields + sibling matching) **or** Owner lock on Construction weights / trade lists. Trucking is **not** started here.
