# THE CITY OF VAEL — Residential

**Date:** 27 August 2026  
**Milestone:** Milestone 3 — Residential Experience  
**Principle:** Continue, don’t rebuild. New homeowner/civilian flow — not a copy of Construction, not Real Estate.  
**Runtime:** Local `rx_mock_*` keys. Handshake/messages reuse the existing connection store with `district: "residential"`. No Supabase, Stripe, SMS, email, push, cloud files, maps, or geolocation.

---

## Audit (this tree, before this milestone)

| Surface | State |
|---|---|
| Registry lot **Residential** | Display Residential, slug `/districts/residential`, status **Future** |
| Registry lot **Real Estate** | `/districts/real-estate`, **Early Access** placeholder. Explicitly not the homeowner flow |
| Page | `DistrictPlaceholderPage` via `/districts/:slug` |
| Homeowner components / store / matching | **None** |
| Construction | Live professional Room (trade / job type). Not this flow |

### KEEP / IMPROVE / REUSE / MISSING

| | |
|---|---|
| **KEEP** | City shell, Handshake lock, 24h veil, match bands, Real Estate as Early Access, Commercial as Future, M&T / Construction / Trucking scorers |
| **IMPROVE** | Residential lot is now **Live**; Go Visible includes Post a Need; City messages include Residential threads |
| **REUSE** | Shared Handshake, `MessageThread`, `MatchPercent`, `DistrictRoomNav`, `RequireMember`, City filters/drawer |
| **MISSING (still)** | Owner-locked service taxonomy, Owner-locked Residential weights, live map/geo, Community posts, cross-device Handshake |

**Real Estate was not converted.** It remains an Early Access placeholder. The placeholder now points people to Residential so the two lots stay distinct.

---

## 1. Residential product model

Residential is a **VAEL district** whose primary job is:

**Homeowner / civilian need → available people**, scored by Residential fit, locked by Handshake.

It is not a contractor directory, job board, estimating tool, marketplace, Construction Exchange, or Real Estate.

Spine:

```
Need (Post a Need, 24h VAEL)
  → Matching Board
  → Match detail
  → Request Handshake
  → both accept → Connection (reveal) → Message
```

Provider availability exists as the opposite side so matching works. The **primary CTA and copy** are homeowner-first.

---

## 2. Target user

A homeowner or civilian who needs help at home.

A person available for that work can still veil in, but that path is secondary (“I am available for home work”).

---

## 3. User intent

| Intent | Veil | Copy |
|---|---|---|
| **Need (primary)** | Out | “I need someone.” |
| **Available (secondary)** | In | “I am available for home work.” |

One Room, two sides. Opposite-side listings rank on the Board.

---

## 4. Information architecture

City shell. Routes live under `/districts/residential`. Real Estate stays `/districts/real-estate`.

| Screen | Route |
|---|---|
| Residential Home | `/districts/residential` |
| How it works | `/districts/residential/how-it-works` |
| Post a Need / Veil | `/districts/residential/veil` |
| Matching Board | `/districts/residential/board` |
| Match detail | `/districts/residential/board/:listingId` |
| Provider profile | `/districts/residential/profile/:username` |
| Profile edit | `/districts/residential/profile/:username/edit` |
| Handshakes | `/districts/residential/connections` |
| Handshake Room | `/districts/residential/connections/:id` |

Messaging reuses the Handshake Room and City `/messages`. Community: **not implemented**.

---

## 5. Request flow

Progressive 3-step form (not a giant Construction form):

1. **What do you need?** — service (kit starter) + short description  
2. **Where and when** — city/area, optional postal code, timing  
3. **Anything else?** — optional requirements, extra note, contact (hidden until Handshake)

Primary submit: **Post a Need**. Returning users see **Update need**.

Service list is a **kit starter** (Plumbing, Electrical, Heating and cooling, Painting, General home repair, Yard and outdoor, Other). Owner may replace. Not Construction’s trade catalog.

---

## 6. Location

- **City or area** — required text  
- **Postal code** — optional text, not validated, not geocoded  
- No map, no browser geolocation  

Location scoring: area substring/exact (same class as other Rooms). Postal exact only if both sides listed it.

---

## 7. Timing

City timing language, labeled for homeowners:

- This cycle  
- Next two weeks  
- Flexible  

No calendar, dispatch, or scheduling engine.

---

## 8. Matching Board

Hierarchy for a homeowner (Veil Out): **percent → provider → service → location → timing → why → Handshake**.

Cards, not ads or tables. Filters: band + service. Desktop chips; mobile drawer.

Sample providers on this device: `porchlight` (General home repair, Atlanta, This cycle), `hearthside` (Painting, Atlanta, Next two weeks).

---

## 9. Match Breakdown

Relevance labels, not per-criterion percentages: Relevant / Partial / Does not overlap / Not listed.

Overall % from the sibling engine. City bands unchanged.

---

## 10. Provider Profile

Identity, service, experience, area, Unverified, credential labels, City-generic documents. Rates and history closed until Handshake. Reputation is not modeled.

---

## 11. Match Detail

Answers who, what they can help with, why, where, when, what trust info exists, what stays private, Request Handshake.

---

## 12. Handshake

Same connection model (`mtx_mock_connections_v1`) with `district: "residential"`. **No Residential-specific handshake system.**

States: request, pending, incoming, declined, connected, closed, blocked.

Sample handles `porchlight` / `hearthside` can **Simulate counterpart accept (this device only)**.

---

## 13. Connection

After mutual accept: status, revealed provider profile, relevant need/listing context, conversation (`MessageThread`).

---

## 14. Messaging

Shared `MessageThread`. City `/messages` lists Residential threads. No SMS, email, or push.

---

## 15. Returning-user experience

Home shows an active request instead of forcing a blank start. CTAs become Update need / Find Matches. Pending Handshake and connection counts link to Handshakes. Re-publishing expires the current Residential VAEL and starts a new 24-hour window (existing veil model).

---

## 16. States

| Area | Represented | Not represented |
|---|---|---|
| Entry | First visit; returning with active request / pending / connected | Cross-device resume |
| Request | empty, editing (3 steps), saving, saved, error | Paid extended duration |
| Board | empty (no need), matches, filtered empty, expired match | Async spinner; live multi-user |
| Match | request, pending, connected, unavailable (expired) | |
| Handshake | request, pending, incoming, declined, connected, closed, blocked | Cross-device accept; listing-expiry auto-close |
| Messaging | empty, active, sending, failed, attachment filename | Cloud files |
| Community | Not on this device | Posts |

---

## 17. Responsive behavior

Request steps are one column. Match cards stack below `sm`. Filters in a sheet below `md`. Handshake actions wrap. Room nav scrolls. Tested 375px and 1280px in this milestone; City dock padding unchanged (320–1440+).

---

## 18. Accessibility

Labeled fields, real buttons for I need someone / available, numeric match %, `HandshakeStatus` text, existing `Drawer`, City focus rings, status not color-only.

---

## 19. Components

**Residential-specific:** `ResidentialServiceBadge`, `ResidentialNeedSummary`, `ResidentialLocationSummary`, `ResidentialTimingSummary`, `ResidentialTrustCard`, `ResidentialMatchCard`, `ResidentialMatchBreakdown`, `ResidentialAvailabilityCard`.

**Reused:** City shell, `DistrictRoomNav`, `MatchPercent`, `HandshakeStatus`, `ProfileCard`, `DocumentCard`, `VerificationState`, `MessageThread`, `RequireMember`, Button, Card, PageHeader, Drawer, Tabs, FilterChip.

---

## 20. Data-model limitations

- Listings/profiles/documents are **local-only** (`rx_mock_*`).  
- Area/postal are text. No geo API.  
- Extra note, requirements, contact are not Foundation `vaels` columns (PL-004 analog). Extra note is **not scored**.  
- Documents are local previews — NOT YET CONNECTED.  
- No budget engine. No license validation.

---

## 21. Matching limitations

- `src/lib/residentialMatching.ts` is a **sibling**. It does not import or change Framing §8, Construction, or Trucking weights.  
- Kit-proposed weights: service 28, location 22, availability 16, capabilities 12, experience 8, credentials 8, completeness 6. **Owner has not locked this table.**  
- Overlap math is the same class of reconstruction (exact / Jaccard / area substring). Not a generic shared engine.

---

## 22. Owner decisions required

| ID | Decision |
|---|---|
| PL-012 | Residential is implemented as its **own live district**, not a mode inside Construction. Confirm. |
| PL-020 | Lot names: Residential stays `/districts/residential`. Real Estate remains a different lot. |
| Service taxonomy | Kit starter list. Replace with Owner-approved homeowner categories. |
| Residential weights | Lock or replace the kit-proposed sibling table. |
| Map / geo | Not implemented. Confirm they stay out until architecture exists. |
| Community | No Residential posts until a real post model exists. |

---

## 23. Remaining implementation work

- Owner lock on taxonomy and weights  
- Persist beyond localStorage  
- Optional geo **only** if the product architecture adds it  
- Cross-device Handshake  
- Community when a post model exists  

**Do not start Commercial from this milestone.** Commercial remains a Future placeholder (PL-013).
