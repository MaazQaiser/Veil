# THE CITY OF VAEL — Trucking Exchange

**Date:** 27 August 2026  
**Milestone:** Trucking Exchange  
**Principle:** Continue, don’t rebuild. Parallel Room — not a relabeled Construction or Media & Technology copy.  
**Runtime:** Local `tx_mock_*` keys. Handshake/messages reuse the existing connection store with `district: "trucking"`. No Supabase, Stripe, SMS, email, push, cloud files, or maps.

---

## Audit (this tree, before this milestone)

| Surface | State |
|---|---|
| Registry lot | Display **Trucking**, slug `/districts/trucking`, status **Coming Soon** |
| Page | `DistrictPlaceholderPage` via `/districts/:slug` |
| Trucking components / store / matching | **None** |
| Matching | Media & Technology `matching.ts` (protected) + Construction sibling `constructionMatching.ts` |

### KEEP / IMPROVE / REPLACE / MISSING

| | |
|---|---|
| **KEEP** | City shell, Handshake lock, 24h veil, match bands, `/districts/trucking` slug, M&T weights, Construction Room |
| **IMPROVE** | Lot is now **Live**; Go Visible includes Trucking Veil; City messages include Trucking threads |
| **REPLACE** | Placeholder landing for this slug only — other lots stay `DistrictPlaceholder` |
| **MISSING (still)** | Owner-locked Trucking weights, DOT/MC fields (intentionally not invented), live map, Trucking Community posts, cross-device Handshake |

Do not assume freight-marketplace functionality that did not exist. The documented current state was **Coming Soon**.

---

## 1. Trucking product model

Trucking Exchange is a **VAEL district**: available transportation capacity against a load / transportation need, scored by Trucking fit, locked by Handshake.

It is not a freight board, dispatch dashboard, public load board, or map product.

Spine (same as the City):

```
Profile → Veil In/Out (24h VAEL) → Matching Board
  → Match detail → Request Handshake
  → both accept → Connection (reveal) → Message
```

**Do not** reuse Construction fields (trade, job type, service area as the primary geography).  
**Do not** reuse Media & Technology fields (discipline, tools, remote/onsite, engagement, budget proxy).

Primary information personality: **LOAD · ROUTE · AVAILABILITY · CAPABILITY**.

---

## 2. User intents

| Intent | Veil | Copy |
|---|---|---|
| **AVAILABLE** | In | “I have transportation capacity available.” |
| **NEED** | Out | “I need transportation.” |

One Room, two sides. Opposite-side listings rank on the Board. Not two disconnected apps.

---

## 3. Information architecture

City shell. Routes live under `/districts/trucking`. No independent application chrome.

| Screen | Route |
|---|---|
| Trucking Home | `/districts/trucking` |
| How it works | `/districts/trucking/how-it-works` |
| Veil / create VAEL | `/districts/trucking/veil` |
| Matching Board | `/districts/trucking/board` |
| Match detail | `/districts/trucking/board/:listingId` |
| Profile | `/districts/trucking/profile/:username` |
| Profile edit | `/districts/trucking/profile/:username/edit` |
| Handshakes | `/districts/trucking/connections` |
| Handshake Room | `/districts/trucking/connections/:id` |

Messaging reuses the Handshake Room composer and City `/messages`. Community: **not implemented**. Home states that honestly. No fake posts.

---

## 4. Profile

Separate `tx_mock_profiles_v1` so a handle can hold a Trucking record without overwriting Media & Technology or Construction.

| Section | Fields | Notes |
|---|---|---|
| Identity | display name, individual/company, headline | Public (same PL-021 option (c) as other Rooms) |
| About | about | After local sign-in |
| Equipment / capability | equipment, capabilities[] | Kit starter equipment list — Owner may replace |
| Route / service area | serviceLanes (text) | No geo API, no map |
| Experience | free text | |
| Credentials | user labels only | **Not** DOT/MC/license numbers |
| Rates / history | | Closed to counterpart until Handshake `connected` |
| Documents | license / insurance / capability | Existing City `DOC_TYPES`; local preview |
| Verification | Unverified | Only honest state |
| Reputation | — | Not modeled |

**Not collected:** DOT number, MC number, CDL fields, legal weight, insurance policy numbers. Those are not in the product architecture.

---

## 5. Veil

- Veil In / Veil Out with Trucking copy (capacity vs load)
- Current status, lane (`origin → destination`), equipment, capacity, availability, 24h duration
- Re-veil expires the current Trucking listing and publishes a new one
- Same `DEFAULT_DURATION_HOURS = 24` and expiring threshold (4h) as the City

---

## 6. VAEL creation

Trucking-only form. Hierarchy: **intent → route → load/capacity → capability → availability → details**.

| Group | Fields |
|---|---|
| Intent | Available / Need |
| Route | Origin, destination (required text) |
| Load / capacity | Full / Partial / Dedicated (kit starter, qualitative) |
| Description | What is available / what needs to move (required) |
| Equipment | Dry van, Flatbed, Reefer, Box, Other (kit starter — not a regulatory class list) |
| Capability labels | Comma-separated user labels |
| Availability | This cycle / Next two weeks / Flexible |
| Pickup / delivery notes | Optional, **not scored**, not a dispatch clock |
| Requirements / contact | Local-only; contact hidden until Handshake |

**Not collected:** Construction trade/job type, M&T discipline/tools, maps, DOT/MC.

---

## 7. Matching Board

Hierarchy: **percent → route (`origin → destination`) → availability → capacity → equipment → load/need context → Handshake**.

Cards, not freight tables. No map.

Filters: band (All / Strong / Good / Possible), equipment. Desktop chips; mobile drawer.

Sample counterparts on this device: `lanewest` (Veil In, Atlanta → Savannah) and `cargohold` (Veil Out, same lane).

---

## 8. Match Breakdown

Relevance labels, not per-criterion percentages:

| Relevance | Meaning |
|---|---|
| Relevant | Strong overlap on that Trucking criterion |
| Partial | Some overlap |
| Does not overlap | Both sides listed, no overlap |
| Not listed | Empty on both sides (criterion excluded from the %) |

Overall % still comes from the sibling engine. City bands unchanged: Strong ≥80 / Good ≥60 / Possible ≥40.

---

## 9. Match Detail

Answers: who/what, which route, what is available vs needed, when, equipment/capacity, why (relevance), what is public now, what stays private, Request Handshake.

Private until Handshake: contact, rates, history, full profile payload.

---

## 10. Handshake

Same connection model as the rest of VAEL (`mtx_mock_connections_v1`) with `district: "trucking"`. **No Trucking-specific handshake system.**

States: request, pending, incoming (accept/decline), connected, declined, closed, blocked.

Sample handles `lanewest` / `cargohold` can **Simulate counterpart accept (this device only)**.

Listing expiry is a Veil state, not a Handshake expiry clock. Handshake records do not auto-close when a VAEL expires.

---

## 11. Connection

After mutual accept: status, revealed Trucking profile (equipment, about, service lanes, rates), relevant listing lane/timing if the Handshake came from the Board, documents according to existing rules, conversation (shared `MessageThread`).

---

## 12. Messaging

Shared `MessageThread`. Same composer, attachment filename-only, sending/failed/empty. City `/messages` lists Media & Technology, Construction, and Trucking threads and routes into the correct Handshake Room. No SMS, email, or push.

---

## 13. Filters

Supported: match band, equipment (stored on the listing).

**Not exposed:** live map radius, DOT class, legal weight, Construction trade, M&T discipline. Origin/destination are scored but not a separate filter chip in this milestone (text fields; no geo index).

---

## 14. States

| Area | Represented | Not represented |
|---|---|---|
| District | Live (this Room); Coming Soon / Future remain on other lots | |
| Veil | none, active In/Out, expiring, expired, creating, error | Paid extended duration |
| Board | empty (no veil), matches, filtered empty, expired match | Async spinner (local store is sync); live multi-user |
| Match | request, pending, connected, unavailable (expired listing) | |
| Profile | empty, incomplete, editing, saving, saved, error, unverified | Verified DOT/MC |
| Handshake | request, pending, incoming, declined, connected, closed, blocked | Cross-device accept; listing-expiry auto-close |
| Messaging | empty, active, sending, failed, attachment filename | Cloud files |
| Community | Honest “not on this device” | Posts |

---

## 15. Responsive behavior

Match cards stack below `sm`; route and percent stay readable. Filters in a sheet below `md`. Handshake actions wrap. Room nav scrolls. City dock padding unchanged (320–1440+). No map pane to collapse.

---

## 16. Accessibility

- Veil intent and Available/Need are real buttons, not color-only
- Form fields use `Field` labels (`htmlFor`)
- Handshake dialogs/actions are native buttons; status via `HandshakeStatus` text
- Match % is numeric text, not color alone
- Filter drawer is the existing accessible `Drawer`
- Focus rings follow the City design system

---

## 17. Components

**Trucking-specific:** `EquipmentBadge`, `RouteSummary`, `AvailabilitySummary`, `CapacitySummary`, `LoadSummary`, `TruckingMatchCard`, `TruckingMatchBreakdown`, `TruckingRequirementCard`, `TruckingAvailabilityCard`.

**Reused:** City shell, `DistrictRoomNav`, `MatchPercent`, bands, `HandshakeStatus`, `ProfileCard`, `DocumentCard`, `VerificationState`, `MessageThread`, `RequireMember`, Button, Card, PageHeader, Modal/Drawer, Tabs, FilterChip.

---

## 18. Data-model limitations

- Trucking listings/profiles/documents are **local-only** (`tx_mock_listings_v1`, `tx_mock_profiles_v1`, `tx_mock_documents_v1`).
- Origin/destination are **text**, not geocoded coordinates. There is no map.
- Pickup/delivery notes persist locally and are **not scored**.
- Equipment and capacity lists are **kit starters**, not regulatory catalogs or legal weight.
- Description, requirements, and contact are not Foundation `vaels` columns (same class of gap as PL-004).
- Documents are local previews — NOT YET CONNECTED to storage.
- No DOT, MC, CDL, or license-number columns. Do not invent them.

---

## 19. Matching limitations

- `src/lib/truckingMatching.ts` is a **sibling**. It does not import or change Framing §8 weights or Construction weights.
- Trucking weights are **kit-proposed** (origin 20, destination 20, equipment 16, capacity 12, availability 14, capabilities 10, experience 4, completeness 4). **Owner has not locked this table.**
- Overlap math is the same class of reconstruction (exact / Jaccard / place substring). Not a generic shared engine module.
- Pickup/delivery notes do not affect the score.
- UI must not present this table as Framing §8.

---

## 20. Community limitations

There is no Trucking post model. Home states Community is not on this device. Do not invent activity.

---

## 21. Owner decisions required

| ID | Decision |
|---|---|
| Trucking weights | Lock or replace the kit-proposed sibling table. |
| Equipment list | Kit starter (Dry van, Flatbed, Reefer, Box, Other). Replace with Owner-approved catalog. |
| Capacity list | Kit starter (Full, Partial, Dedicated). Qualitative only until a real capacity model exists. |
| Regulatory fields | DOT/MC/license are **not** in this kit. Confirm they stay out until a real data model exists. |
| Map | Not implemented. Confirm no map until a geo architecture exists. |
| PL-021 | Same option (c) as other Rooms. |
| Community | No Trucking posts until a real community architecture exists for this Room. |

---

## 22. Remaining implementation work

- Owner lock on Trucking weights and equipment/capacity catalogs
- Persist origin/destination/equipment/capacity on a real backend (not localStorage)
- Optional geo / map **only** if the product architecture adds it
- Cross-device Handshake
- Trucking Community when a post model exists
- Do **not** start Residential or Commercial from this milestone

**Recommended next milestone:** Owner lock on Trucking (or Construction) weights, **or** a later Room only after Owner directs it. Residential and Commercial are **not** started here.
