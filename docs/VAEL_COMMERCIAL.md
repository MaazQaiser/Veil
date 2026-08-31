# THE CITY OF VAEL — Commercial

**Date:** 27 August 2026  
**Milestone:** Milestone 3 — Commercial Experience  
**Principle:** Continue, don’t rebuild. New business-need flow — not a copy of Residential, not Construction Exchange.  
**Runtime:** Local `cm_mock_*` keys. Handshake/messages reuse the existing connection store with `district: "commercial"`. No Supabase, Stripe, SMS, email, push, cloud files, maps, or geolocation.

---

## Audit (this tree, before this milestone)

| Surface | State |
|---|---|
| Registry lot **Commercial** | Display Commercial, slug `/districts/commercial`, status **Future** |
| Page | `DistrictPlaceholderPage` via `/districts/:slug` |
| Business components / store / matching | **None** |
| Residential | Live homeowner Room. Not this flow |
| Construction | Live professional Room (trade / job type). Not this flow |

### KEEP / IMPROVE / REUSE / MISSING

| | |
|---|---|
| **KEEP** | City shell, Handshake lock, 24h veil, match bands, Real Estate as Early Access, M&T / Construction / Trucking / Residential scorers untouched |
| **IMPROVE** | Commercial lot is now **Live**; Go Visible includes Create a Need; City messages include Commercial threads |
| **REUSE** | Shared Handshake, `MessageThread`, `MatchPercent`, `DistrictRoomNav`, `RequireMember`, City filters/drawer |
| **MISSING (still)** | Owner-locked capability taxonomy, Owner-locked Commercial weights, live map/geo, Community posts, cross-device Handshake, company verification |

Residential and Construction were not converted or retuned.

---

## 1. Commercial product model

Commercial is a **VAEL district** whose primary job is:

**Business need → company/provider capability**, scored by Commercial fit, locked by Handshake.

It is not a consumer homeowner marketplace, job board, CRM, procurement system, Construction Exchange, or Residential.

Spine:

```
Need (Create a Need, 24h VAEL)
  → Matching Board
  → Match detail
  → Request Handshake
  → both accept → Connection (reveal) → Message
```

Provider availability exists as the opposite side so matching works. The **primary CTA and copy** are business-need first.

Relationship the UI makes visible:

```
Business → Need → Requirement → Provider → Match
```

---

## 2. Target user

A business that needs a service or capability.

A company or professional who can fulfill that need can still list availability, but that path is secondary (“I can fulfill a commercial need”).

---

## 3. User intent

| Intent | Veil | Copy |
|---|---|---|
| **Need (primary)** | Out | “I need a business capability.” |
| **Available (secondary)** | In | “I can fulfill a commercial need.” |

One Room, two sides. Opposite-side listings rank on the Board.

The experience helps the business answer:

- What do we need?
- Where do we need it?
- When do we need it?
- What are the requirements?
- Who is a good match?

---

## 4. Information architecture

City shell. Routes live under `/districts/commercial`. Residential stays `/districts/residential`. Construction stays `/districts/contractor`.

| Screen | Route |
|---|---|
| Commercial Home | `/districts/commercial` |
| How it works | `/districts/commercial/how-it-works` |
| Create Commercial VAEL | `/districts/commercial/veil` |
| Matching Board | `/districts/commercial/board` |
| Match Detail | `/districts/commercial/board/:listingId` |
| Company / provider profile | `/districts/commercial/profile/:username` |
| Edit profile | `/districts/commercial/profile/:username/edit` |
| Handshakes | `/districts/commercial/connections` |
| Handshake / Connection / Messaging | `/districts/commercial/connections/:id` |

No second application shell.

---

## 5. Request flow

Progressive disclosure. Three steps after intent. Not a long enterprise form.

1. **Capability + context + description** — what is needed, what it is for  
2. **Location + timing** — where and when  
3. **Requirements + optional scope + contact** — what must be true

Provider side adds capability labels and experience years on step 3.

Publish stores a 24-hour Daily VAEL. Updating starts a new 24-hour window. Ending the request expires the listing on this device.

---

## 6. Business context

`context` (“What is this for?”) is a first-class display field.

- Shown on match cards, match detail, and connected Handshake  
- Included in completeness  
- **Not a scored column of its own** (no invented NLP)  
- Not a procurement SKU, invoice, or contract type

The UI keeps the chain short: company identity, need, requirement, provider, match %. It does not become a CRM.

---

## 7. Matching Board

Primary hierarchy on each card:

1. Match %  
2. Provider / company  
3. Capability  
4. Location  
5. Availability  
6. Requirements  
7. Trust / credentials (Unverified)  
8. Why this match  
9. Handshake / View Match  

This is not a generic directory. Rank is opposite-side Commercial fit.

---

## 8. Match Breakdown

Relevance labels only: **Relevant / Partial / Missing / Not listed**.

Criteria shown if they exist in the sibling engine:

| Criterion | How |
|---|---|
| Capability | Exact on kit category |
| Location | Exact or substring on area text |
| Timing | Exact on This cycle / Next two weeks / Flexible |
| Requirements | Exact or substring on requirement text |
| Scope labels | Jaccard on user labels |
| Experience | Distance on years when both listed |
| Credentials | Jaccard on labels |
| Completeness | Average of listed core fields |

**No per-criterion percentages in the UI.**

---

## 9. Provider / company profile

Company-first. Progressive disclosure.

Public after local sign-in: identity, capability, service area, experience, credential labels, verification state (Unverified).

Closed until Handshake: rates, case work, private documents, contact.

Reputation is not modeled. This kit does not verify companies.

---

## 10. Match Detail

Answers:

- Who are they? (company or handle; display name after Handshake)  
- What do they provide?  
- Why are they relevant?  
- Where do they operate?  
- When are they available?  
- What requirements do they meet?  
- What trust information is available?  
- What remains private?  
- What happens next?

Primary action: **Request Handshake**.

---

## 11. Handshake

Shared VAEL Handshake. No Commercial-specific lock.

States used: Request, Sent/Pending, Incoming, Accepted (via Incoming), Declined, Connected, Closed, Blocked.

Expired Handshake is **not** a separate status in the shared store. An expired listing is shown as an unavailable match.

Sample counterpart accept works for `northyard` and `ledgerwell` on this device only.

---

## 12. Connection

After mutual acceptance:

- Connection status  
- Commercial request context (capability, area, timing, context)  
- Company information now available  
- Documents listed on this device  
- Conversation via shared `MessageThread`

---

## 13. Messaging

Reuse existing VAEL messaging. No separate Commercial messenger. No SMS, email, or external chat.

States: empty (locked until connected), active, sending, failed, attachment pending (filename only, local).

---

## 14. Returning-user experience

Home surfaces:

- Active need / availability card  
- Pending Handshake count  
- Connected count  
- Update need instead of forcing a blank start  

Uses existing account / message / notification architecture. No invented persistence.

---

## 15. Filters

Supported from listing data only:

- Match band (Strong / Good / Possible)  
- Capability  
- Location (area text present on matches)  
- Availability / timing  

Desktop: filter chips. Mobile: filter drawer.

No invented procurement filters (budget, SKU, vendor tier, NAICS, etc.).

---

## 16. States

| Area | States |
|---|---|
| Entry | First visit; returning user with active work |
| Request | Empty; editing; saving; saved; error |
| Matching | No listing yet; loading is instant local; matches found; no matches; filtered empty |
| Match | Available; Handshake pending / incoming / connected; listing expired (unavailable) |
| Handshake | Request; pending; incoming; accepted (connected); declined; closed; blocked |
| Connection | Active; closed; blocked |
| Messaging | Empty/locked; active; sending; failed; attachment pending |

---

## 17. Responsive behavior

Same City shell breakpoints. Intentional mobile:

- Request form is a single column, one step at a time  
- Match cards stack: % above company details below 640px  
- Filters open in a drawer on small screens  
- Profile tabs scroll; Handshake is two stacked columns on small screens  
- Messaging uses the shared thread layout  

Tested at 320 / 375 / 390 / 768 / 1024 / 1280 / 1440+ in the in-session browser.

---

## 18. Accessibility

- Semantic form fields with labels  
- Required fields announced  
- Errors via `role="alert"`; success via `role="status"`  
- Filter chips are buttons; drawer has a title  
- Handshake actions are real buttons  
- Match % is text as well as the visual ring  
- Status uses label + hint, not color alone  
- Visible focus from the City design system  
- Touch targets follow Room nav / button sizes  

---

## 19. Components

**Shared:** `CityPage`, `DistrictRoomNav`, `MatchPercent`, `HandshakeStatus`, `VeilStatus`, `VerificationState`, `ProfileCard`, `DocumentCard`, `MessageThread`, `RequireMember`, `FilterBar` / `FilterChip`, `Drawer`.

**Commercial-specific:** `CommercialCapabilityBadge`, `CommercialNeedSummary`, `CommercialContextCard`, `CommercialLocationSummary`, `CommercialTimingSummary`, `CommercialRequirementsCard`, `CommercialTrustCard`, `CommercialMatchBreakdown`, `CommercialAvailabilityCard`, `CommercialMatchCard`.

---

## 20. Data-model limitations

| Field | Status |
|---|---|
| Capability (kit list) | Local listing + profile |
| Business context | Local display + completeness. Not scored as its own column |
| Area (text) | Local. No geo |
| Timing | Kit three values |
| Requirements | Local string. Substring/exact overlap only |
| Scope note | Local. Not scored |
| Capability labels / years / credentials | Local labels |
| Company vs individual | Profile type only |
| Documents | Local preview. No cloud |
| Invoices, contracts, SKUs, vendor IDs | **Not modeled. Do not fake.** |
| Maps, live scheduling, CRM pipeline | **Not modeled.** |

### Missing data structures (if product later needs them)

1. Structured requirement objects (must/should, certifications as first-class)  
2. Company entity separate from member handle  
3. Service-area polygons or postal scoring  
4. Verified credential records  
5. Cross-device listing identity  

### Required engineering work (later)

Persist beyond `localStorage`. Company verification workflow. Optional geo only if architecture adds it.

### UX readiness

The Room is usable locally: create a need, see matches, Handshake, message.

### Backend readiness

**Not ready.** Prototype only. Nothing is connected.

---

## 21. Matching limitations

`src/lib/commercialMatching.ts` is a **sibling** engine.

| | |
|---|---|
| Weights | Kit-proposed. Sum 100. Owner has **not** locked them |
| Not used | Framing §8 Media & Technology table; Construction; Trucking; Residential |
| Bands | Unchanged City bands Strong ≥80 / Good ≥60 / Possible ≥40 |
| Honest % | A need with blank requirements/labels will not score 100% against a complete provider |
| Requirements | Exact/substring only — not semantic matching |

Do not present this table as Framing §8.

**Kit-proposed weights:** capability 26, location 18, availability 14, requirements 14, capabilities 10, experience 8, credentials 6, completeness 4.

---

## 22. Community limitations

Commercial Community is **not implemented**.

There is no district post model for this Room. The Home states that honestly. No fake posts. No fake activity.

Dependency: City community architecture that can attach posts to a live district without inventing them.

---

## 23. Owner decisions required

| ID | Decision |
|---|---|
| PL-013 | Commercial is implemented as its **own live district**, not a mode inside Residential or Construction. Confirm. |
| Capability taxonomy | Kit starter: Facilities, Operations, Professional services, Technology, Maintenance, Other. Replace with Owner-approved business categories. |
| Commercial weights | Lock or replace the kit-proposed sibling table. |
| Business context | Confirm it stays display-only (not a scored column) until a structured model exists. |
| Map / geo | Not implemented. Confirm they stay out until architecture exists. |
| Community | No Commercial posts until a real post model exists. |
| Company verification | Unverified is honest. Do not invent a verified-company program here. |

---

## 24. Remaining implementation work

- Owner lock on taxonomy and weights  
- Persist beyond localStorage  
- Structured requirements if the product needs them  
- Cross-device Handshake  
- Community when a post model exists  
- Company verification when a workflow exists  

**Do not start Community from this milestone.** Community remains a later Room (blueprint 3.4).
