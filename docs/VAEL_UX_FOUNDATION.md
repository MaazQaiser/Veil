# THE CITY OF VAEL — UX Foundation

**Document type:** Analysis and planning only. No product code. No architecture change. No Change Order.  
**Date:** 27 August 2026  
**Principle:** Continue, don’t rebuild.  
**Prepared from:** Milestone 1 Technical Audit pack (00–06, 25 August 2026 live-tree inspection), this workspace’s README, audit visual language, and VAEL medallion.

---

## Evidence boundary (read this first)

This workspace copy contains the **Milestone 1 Technical Audit pack**, not the running React application.

| Present in this workspace | Not present in this workspace |
|---|---|
| `milestone-1/html/` 00–06 | `src/` (pages, components, routes) |
| `milestone-1/pdf/` | `package.json`, Vite/Tailwind config |
| `milestone-1/assets/` (audit CSS, medallion) | `design/VAEL_DESIGN_SYSTEM.md` |
| `milestone-1/README.md` | `src/index.css` tokens |
| This document | `App.tsx`, layouts, live screens |

The 25 August 2026 inspection **did** read the live application tree. Named files, routes, layouts, mock modules, district registry, and Rooms in documents 00–06 are treated as verified by that inspection.

Where Framing lists Media & Technology Rooms by **name** but not by exact nested path, those paths are marked **Inferred**. They are not invented product screens; they are the documented Rooms, with likely `react-router` paths reconstructed from the city-prefix pattern (`/board` → `/media-technology/board`).

**Do not treat this document as a substitute for opening `src/App.tsx` on the canonical clone.** Restore that tree before any design-to-code work. Re-confirm routes against `App.tsx` as the first action of Phase 1.

---

## 1. Product understanding

VAEL is an **availability network**, not a job board.

A person or business enters the City, keeps an identity, then **Veils In** (available) or **Veils Out** (needs someone). VAEL scores listings by **percentage fit**. Full profiles stay hidden until **both parties accept** in a Handshake Room. Then a private connection and messages begin.

The success question from the PRD, restated in the Owner Brief: **does the City function as that product?**

The inspection answer: **parts of it do, in one district, on one device, in a prototype.**

| Truth | Implication for UX |
|---|---|
| Every account, listing, Handshake, and message lives in that visitor’s browser storage. Two phones do not share a City. | Design for the intended multi-user product, but label the current prototype honestly. Do not mock “live across devices” in UI copy. |
| Media & Technology is the only fully working district. Contractor and Trucking are Coming Soon placeholders. Residential and Commercial are not lots on the map. | Design the reusable district pattern from Media & Technology. Do not open fake Boards for unfinished lots. |
| Continue, don’t rebuild, is the right call. | Evolve the existing City shell, Rooms, and visual language. Do not replace React / TypeScript / Vite / Tailwind. Do not melt Media & Technology into a generic blob. |

### What a user can actually do today (Media & Technology, single device)

1. Enter the City (home, feed, search, districts, concierge).
2. Sign up / sign in (mock accounts in localStorage).
3. Claim a handle and join with a profile type.
4. Maintain a resume-like profile, portfolio links, and a documents tab.
5. Veil In or Veil Out; 24-hour default visibility; re-veil exists.
6. See a Matching Board ranked by percentage fit (media/tech weights).
7. Start a Handshake from a board match or a profile.
8. After mutual accept, see the private room and message (local attachments).
9. Use city + Media & Technology community (posts, comments, reactions, saves).
10. Manage account visibility / notification preferences (in-app only).
11. View Extended VAEL plans as a labeled demo — not purchasable.

### What a user cannot do today

- Share a Handshake, listing, or message with another real device/user.
- Use Construction, Trucking, Residential, or Commercial as working Rooms.
- Complete a verified-identity workflow (documents exist; verification does not).
- Buy extended visibility or pay for anything.
- Receive SMS, email, or push.
- Trust that flipping a “Supabase” flag would move Board, Handshake, or Messages onto a live Foundation — those screens still call mock modules.

---

## 2. Existing architecture summary

### Stack (as running)

| Layer | Choice | UX relevance |
|---|---|---|
| UI | React 18 + TypeScript + Vite 5 | Keep. npm package name is still `media-tech-exchange` (lineage, not a second product). |
| Routing | react-router-dom v6, flat list in `src/App.tsx` | City shell, nested Media & Technology, legal, legacy redirects. |
| Styling | Tailwind CSS + VAEL design tokens | `design/VAEL_DESIGN_SYSTEM.md`, `src/index.css`. Files not in this copy; audit CSS follows the same charcoal/gold/paper language. |
| Client state | `AuthProvider` / `useAuth` only | No Redux/Zustand as the product store. |
| Data at runtime | `mockX.ts` → `localStorage` | Prototype is real; it is not a shared City. |
| Tests | vitest, logic modules only | Zero `.tsx` component tests by convention. UX QA is click-through, not component tests, unless the Owner changes that. |

### Folder map that matters for UX

| Path | Role |
|---|---|
| `src/pages/city/*` | City-wide Rooms: home, feed, search, go visible, districts, account, notifications, messages, Extended VAEL demo |
| `src/pages/mediaTechnology/*` | District layout wrapper only |
| `src/pages/*.tsx` (legacy flat) | Actual Media & Technology marketplace: Board, Veil, Handshake, profile, admin, community |
| `src/components/city/*` | City chrome (nav, district cards, homepage) |
| `src/lib/districts.ts` | District registry — the map of lots |
| `src/lib/matching.ts` | Percentage-fit engine — Media & Technology fields. **Protected.** |
| `src/lib/mock*.ts` | Ownership of localStorage domains |

### Layouts (verified)

1. **`CityLayout`** — parent shell for city-wide routes.
2. **`MediaTechnologyLayout`** — district wrapper for the one live Room.
3. **Legal** — city chrome, not district.
4. **`DistrictPlaceholder`** — every non-live lot.

A second live district must be a **new parallel folder/layout**, not a generic rewrite of Media & Technology, unless the Owner orders that refactor.

### District registry vs PRD lots

| Slug | Name in product | Status | Route | vs PRD |
|---|---|---|---|---|
| `media-technology` | Media & Technology | Live | `/media-technology` | Matches |
| `contractor` | Contractor | Coming Soon | `/districts/contractor` | PRD says **Construction Exchange** |
| `trucking` | Trucking | Coming Soon | `/districts/trucking` | Matches name; Room not built |
| `nursing-healthcare` | Nursing / Healthcare | Coming Soon | `/districts/nursing-healthcare` | Out of PRD scope unless Change Order |
| `equipment` | Equipment | Early Access | `/districts/equipment` | Out of PRD scope |
| `government` | Government | Early Access | `/districts/government` | Out of PRD scope |
| `real-estate` | Real Estate | Early Access | `/districts/real-estate` | **Not** Residential |
| `legal-finance` | Legal & Finance | Early Access | `/districts/legal-finance` | Out of PRD scope |
| — | Residential | **Not in registry** | — | PRD Room missing |
| — | Commercial | **Not in registry** | — | PRD Room missing |

Placeholder copy already states: this district is not open; Media & Technology is the only fully working district. Interest is stored locally (`mockEarlyAccess.ts`), not a real waitlist.

### Two frames (UX seam)

A newer service/provider seam exists so a future Foundation cutover could flip a flag. **Most Rooms people walk through still call mock modules.**

| Domain | Wired into UI today? | What the user actually hits |
|---|---|---|
| auth | Session only | Sign-in works locally. Directory/handle/admin still ask `mockAuth` by id. |
| profileDirectory | Yes | Public username/identity reads |
| profile | Writes only | Display reads still hit `mockProfiles` |
| documents | Yes | Profile documents tab |
| community | Yes | City feed save + district community |
| vael | **No** | Board / VaelFlow use `mockListings` |
| connection | **No** | Handshake screens use `mockConnections` |
| notification / messaging / media | **No** | Bell, messages, attachments on old path |

UX implication: screens can be redesigned on the current prototype. Wiring the seam is an engineering milestone, not a visual redesign. Do not design “connected backend” states as if they exist.

### Navigation (as framed)

- **City chrome** lives in `src/components/city/*` (nav, district cards, homepage).
- **City routes** include home, feed, search, go visible, districts, today, concierge, account, notifications, messages, Extended VAEL.
- **District chrome** is `MediaTechnologyLayout` for the live Room; placeholders have no district nav of their own.
- **Legacy flat paths** (`/board`, `/connections/:id`, `/profile/:username`, …) redirect into `/media-technology/…`.

Exact nav item labels and mobile treatment were **not** inventoried as a viewport audit in Milestone 1. Treat current nav as retained chrome to be inspected on the canonical clone during Phase 2.

### Responsive behavior

**Not independently verified.** Milestone 1 inspected architecture, data, auth, and integrations — not breakpoints. Tailwind is the styling system, so utility breakpoints almost certainly exist, but there is no documented mobile/tablet pass.

Phase 10 must include a real click-through at desktop and mobile. Do not assume the Board, Handshake thread, or Veil forms are production-ready on small screens.

---

## 3. Existing route / screen inventory

### Counting rules

- Count a **unique product experience**, not every URL.
- `/districts/:slug` is **one** placeholder screen (many lots).
- `/profile/:username` is **one** profile screen.
- Connection pending vs connected is **one** detail screen with states.
- Profile documents / team are **tabs**, not separate product screens.
- Legacy redirects are **not** product screens.
- Handle claim is an **overlay/gate**, listed under Auth but not counted as a full screen.

**Unique product screens: 36**  
**Plus 1 overlay (handle claim) and a redirect set (not counted).**

Status key:

| Status | Meaning |
|---|---|
| Live | Working in the prototype (single device) |
| Partial | Standing, but short of the PRD sentence |
| Demo | Labeled demo; not a real purchase/utility |
| Placeholder | Honest empty lot |
| Inferred | Room named in Framing; exact path reconstructed |

Disposition key: **Retain** (keep the Room) · **Redesign** (evolve visual/UX, same product) · **Extend** (reuse as the pattern for more districts) · **Replace** (only if the experience is wrong — none of the live Rooms are marked Replace).

---

### A. City-wide screens

Parent layout: `CityLayout` unless noted.

| # | Route | Screen | Purpose | Primary user | Main actions | Status | Components (named) | Important states | Disposition |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `/` | City Home | Civic front door: City metaphor, district lots, mixed community + listings | Visitor and member | Enter a district, go visible, scan feed, open search | Live | `src/components/city/*`, homepage, district cards, community cards via `homeFeed.ts` | Signed out / signed in; empty vs seeded community; only M&T live | **Retain + redesign** shell; **extend** later for more live lots |
| 2 | `/feed` | City Feed | City-wide stream of community + listings | Member (usable by visitor) | Open post, save, jump to listing/district | Live | `CommunityFeed.tsx`, `homeFeed.ts` | Mixes M&T data + placeholders — honest, not every district’s community | **Retain + extend** when more Rooms exist |
| 3 | `/search` | City Search | Find people / listings / districts across the City | Visitor and member | Query, open result | Live | `mockSearch.ts` (aggregated reads) | Empty query, no results, M&T-heavy results | **Retain + redesign** results density |
| 4 | `/go-visible` | Go Visible | City-level entry into Veil / becoming available or posting a need | Member | Start Veil In / Veil Out; choose district | Live (pattern is M&T) | City chrome + Veil entry | Not signed in; no handle; only M&T can complete | **Retain + redesign** as the City CTA into the core loop |
| 5 | `/districts` | Districts directory | Map of lots | Visitor and member | Open a live Room or a placeholder | Live | District cards, registry | Live / Coming Soon / Early Access badges | **Retain**; naming of lots is an Owner decision |
| 6 | `/districts/:slug` | District placeholder | Honest empty lot + local interest form | Visitor | Read status, express interest | Placeholder | `DistrictPlaceholder.tsx`, `mockEarlyAccess.ts` | Coming Soon vs Early Access | **Retain** until a real Room exists. Do not replace with a fake Board |
| 7 | `/today` | Today | Time-local City surface (named in Framing) | Member | Scan what’s active now | Live (Room exists; depth not specified in audit) | City pages | Unknown empty/active | **Retain**; inspect on clone before redesign |
| 8 | `/concierge` | Concierge | Keyword routing helper — **not** a live AI service | Visitor and member | Type intent, get routed | Live (local rules) | `concierge.ts` | No network; no “thinking” AI | **Retain**. Copy must stay honest: not AI |
| 9 | `/notifications` | Notification center | In-app notices | Member | Open item, mark read | Live (in-app only) | `mockNotifications.ts`; bell still on mock path | Empty; unread; SMS/email labeled NOT YET CONNECTED | **Retain + redesign** as one City inbox |
| 10 | `/messages` | City messages | City-level inbox of conversations | Member | Open a thread | Live (local) | `mockConnections` messages | Empty; connected-only threads | **Retain**. Clarify vs connection-detail chat (same messages, two doors) |
| 11 | `/account` | Account hub | Identity, settings entry | Member | Open visibility, notifications, profile | Live | Account pages | Signed out redirect (assumed) | **Retain + redesign** as the City account, not a SaaS settings dump |
| 12 | `/account/visibility` | Visibility | Plan / duration / re-veil controls | Member | See 24h default; view extended (demo) | Partial / demo hooks | `visibilityPlans.ts`, `visibilityLifecycle.ts` | Free Daily 24h; extended labeled demo | **Retain**. Do not design a real checkout |
| 13 | `/account/notifications` | Notification preferences | Channel toggles | Member | Toggle in-app; see other channels as disconnected | Live (honest) | `notificationChannels.ts`, consent mocks | Only `in_app` connected | **Retain**. Keep NOT YET CONNECTED labels |

`/today` and `/concierge` are documented city routes. They were **not** in the IA sketch in the request; they stay in the real City.

---

### B. Media & Technology screens

Parent layout: `MediaTechnologyLayout`.  
Exact nested paths are **Inferred** from Framing §5 names and the documented redirect rule (`/board` → `/media-technology/board`).

| # | Route (inferred) | Screen | Purpose | Primary user | Main actions | Status | Components | Important states | Disposition |
|---|---|---|---|---|---|---|---|---|---|
| 14 | `/media-technology` | District home | Enter the live Room; district-specific chrome | Visitor and member | Go to Board, Veil, community, how-it-works | Live | District layout wrapper | Signed out vs member | **Retain + redesign** as the **template** for future district homes |
| 15 | `/media-technology/how-it-works` | How it works | Explain Veil → match → Handshake | Visitor | Understand the product; go visible | Live | District pages | — | **Retain + redesign** copy for City-wide language, keep M&T examples honest |
| 16 | `/media-technology/board` | Matching Board | Ranked percentage-fit of offering vs seeking | Member (core) | Filter, open match, start Handshake | Live | `Board.tsx` (protected sort), `matching.ts` | Strong ≥80 / Good ≥60 / Possible ≥40; expired listings hidden; empty board | **Retain + redesign**. Do **not** change sort/weights without Owner. This is the pattern other Boards copy |
| 17 | `/media-technology/veil` | Veil flow | Veil In (available) or Veil Out (need) | Member | Choose side, complete listing, publish 24h | Live | `VaelFlow`, `mockListings.ts` | In vs Out; expiry; re-veil; missing fields | **Retain + redesign** as the generic Veil ritual with M&T fields as a variant |
| 18 | `/media-technology/post-opportunity` | Post opportunity | Named separately from Veil in Framing | Member | Post a need/opportunity | Live (may be Veil Out sibling) | Veil / listing forms | Confirm on clone whether this is a distinct screen or an alias | **Retain**; merge in UX only if clone shows it is the same flow |
| 19 | `/media-technology` match dashboard | Match dashboard | Named in Framing: match-side dashboard | Member who is matching | Review matches, act | Live | District pages | Empty vs ranked list | **Retain**; inspect vs Board to avoid duplicate UX |
| 20 | `/media-technology` buyer dashboard | Buyer dashboard | Named in Framing: buyer-side dashboard | Member seeking | Review incoming fit | Live | District pages | Empty vs list | **Retain**; inspect vs Board. If it is Board with a role filter, do not count it as a second product after clone review |

**Note:** Match dashboard and buyer dashboard are counted because Framing lists them as Rooms. If the clone shows they are Board filters, collapse them and lower the unique count by up to two. Do not design two extra dashboards if they are the same Board.

Legacy redirects (not counted): `/board` and other pre-city flat paths into `/media-technology/…`.

---

### C. Authentication / onboarding

Framing places auth and join **under Media & Technology**, not under the City shell. That is an IA problem: people should enter the **City**, not “log into Media & Technology.”

| # | Route / surface | Screen | Purpose | Primary user | Main actions | Status | Components | Important states | Disposition |
|---|---|---|---|---|---|---|---|---|---|
| 21 | M&T auth (inferred `/media-technology` auth) | Sign in / sign up | Mock account + session | Visitor | Create account, sign in, sign out | Live (local) | `useAuth` → `authService` → `mockAuth` | Unverified email (dev simulate); password reset simulated | **Retain**. **Redesign** as City-level auth chrome. Do not swap to Supabase from UX work |
| 22 | Join | Join network | Choose profile type | New member | `updateProfile(…, { profileType })` | Live (mock) | `JoinNetwork.tsx` | Missing type; mock id mismatch if auth were swapped | **Retain + redesign** as City onboarding, district type later |
| — | Overlay | Handle claim | Username gate | New member | Check availability, claim | Live (mock) | `HandleClaimGate.tsx`, `ClaimHandleDialog.tsx` | Taken / available / not signed in | **Retain** as overlay, not a full page |
| — | Simulated | Password reset / verify email | Dev/demo only | Dev / prototype user | Simulate reset / verify | Demo | `mockAuth` | Not real mail | **Retain** as prototype; do not design as a production mail flow |

---

### D. Account / profile

| # | Route | Screen | Purpose | Primary user | Main actions | Status | Components | Important states | Disposition |
|---|---|---|---|---|---|---|---|---|---|
| 23 | `/media-technology/profile/:username` (legacy `/profile/:username` redirects here) | Profile | Resume-like public/self identity | Visitor and member | View, edit (self), Handshake, open documents tab | Partial vs PRD “verified” | `ProfilePage`, `mockProfiles`, `profileService` (writes), directory service (reads) | Self vs other; signed out visitors **still see details** in prototype; completeness heuristic; no verification state machine | **Retain + redesign**. Align visitor visibility with Owner decision PL-021. Add a clear verification **state** (even if the only honest value is Unverified) |
| — | Tab | Documents | License, insurance, capability statement, etc. | Self; public if flagged | Upload/list (local data URLs) | Partial | `ProfileDocumentsTab`, `docTypes.ts`, `documents` service | Empty; pending; mock admin review | **Extend** later; not a separate screen |
| — | Tab | Team | Search accounts to attach team | Self | Search mock accounts | Live (mock) | Team tab, `searchAccounts` | Empty team; mock-only directory | Tab, not a screen |

Account hub / visibility / notification prefs are in section A.

---

### E. Handshake / messaging

| # | Route | Screen | Purpose | Primary user | Main actions | Status | Components | Important states | Disposition |
|---|---|---|---|---|---|---|---|---|---|
| 24 | `/media-technology/connections` (inferred; legacy `/connections` redirects) | Connections list | All Handshakes / matches for this member | Member | Open pending or connected | Live | `mockConnections` | Pending / declined / connected / closed; `board_match` vs `handshake` source | **Retain + redesign** as the City Handshake inbox (district-aware) |
| 25 | `/media-technology/connections/:id` | Connection detail | Mutual accept, then private profile + thread | Both parties | Accept, decline, message, attach, block/report | Live (local) | ConnectionDetail, handshake button, `mockAttachments` | Pending (hidden full profile) → connected (reveal + chat) → closed; attachments are local preview | **Retain + redesign**. This is the Handshake Room. Block/report still on mock path (PL-016) |

City `/messages` (screen 10) is the other door into threads. Design should treat **one messaging system, two entries** — not two products.

---

### F. Community

| # | Route | Screen | Purpose | Primary user | Main actions | Status | Components | Important states | Disposition |
|---|---|---|---|---|---|---|---|---|---|
| 26 | `/media-technology/community` | District community | Discussion inside the live Room | Member | Post, comment, react, save | Live | Community composer/cards, `communityService` | Sample/demo posts local-only by design | **Retain + extend** to future live districts. Do not invent posts for unfinished lots |
| — | (see A) | City Home / Feed | City-wide mix | — | — | Live | `homeFeed.ts` | M&T + placeholders | Already counted |

Community is one of the more complete Rooms. It is **not** “does not exist.” Milestone 3 asks to put communities in each **live** district and keep the city feed honest.

---

### G. Admin

Prototype admin is an **`isAdmin` boolean** flipped by a development simulate function — not the SQL role hierarchy.

| # | Route (inferred) | Screen | Purpose | Primary user | Main actions | Status | Components | Important states | Disposition |
|---|---|---|---|---|---|---|---|---|---|
| 27 | `/media-technology/admin` | Admin console | Users, documents, badges, activity, campaigns | Dev / mock admin | Roster, document review, campaigns | Partial / mock | UsersPanel, DocumentsPanel, `mockAdmin.ts`, `mockCampaigns.ts`, `mockBadges.ts` | Simulate-grant admin; bulk reads still on mocks | **Retain** as prototype governance. Do not design a full staff OS until roles exist. **Redesign** only the surfaces that members feel (e.g. document rejection notes) |
| 28 | Protected demo | Live Exchange Demo | Named protected file `LiveExchangeDemo.tsx` | Demo / Owner | Show the live exchange | Live (protected) | `LiveExchangeDemo.tsx` | Confirm with Owner before changing | **Retain**. Confirm with Owner before visual change |

---

### H. Legal

City chrome, not district.

| # | Route | Screen | Purpose | Primary user | Main actions | Status | Disposition |
|---|---|---|---|---|---|---|---|
| 29 | `/legal/terms` | Terms | Legal | Visitor | Read | Live (pages exist) | **Retain** |
| 30 | `/legal/privacy` | Privacy | Legal | Visitor | Read | Live | **Retain** |
| 31 | `/legal/sms-terms` | SMS terms | Legal for a channel that is **not connected** | Visitor | Read | Live | **Retain**. Keep aligned with NOT YET CONNECTED |

---

### I. Placeholder / future district screens

| # | Route | Screen | Purpose | Status | Disposition |
|---|---|---|---|---|---|
| 6 (same) | `/districts/contractor` | Contractor lot | PRD Construction Exchange | Placeholder | **Retain** label. Rename only after PL-020. Do not implement Construction in this UX-foundation task |
| 6 | `/districts/trucking` | Trucking lot | PRD Trucking Exchange | Placeholder | **Retain** |
| 6 | `/districts/nursing-healthcare` | Nursing / Healthcare | Extra registry lot | Placeholder | **Retain** as labeled lot. Building it is a Change Order (PL-023) |
| 6 | `/districts/equipment` | Equipment | Extra | Early Access placeholder | **Retain** |
| 6 | `/districts/government` | Government | Extra | Early Access placeholder | **Retain** |
| 6 | `/districts/real-estate` | Real Estate | Extra — **not** Residential | Early Access placeholder | **Retain**. Do not pretend this is the homeowner flow |
| 6 | `/districts/legal-finance` | Legal & Finance | Extra | Early Access placeholder | **Retain** |

**Not screens today:** Residential flow, Commercial flow, Construction Board, Trucking Board, district-specific matching, verified-identity workflow, Stripe checkout, SMS/email/push settings that actually send.

### Extended VAEL (city demo suite)

Counted as unique because they are distinct steps, but they are **one demo purchase theater**.

| # | Route | Screen | Status | Disposition |
|---|---|---|---|---|
| 32 | `/extended-vael` | Plans | Demo (`DEMO PRICING — NOT YET AVAILABLE FOR PURCHASE`) | **Retain** as structural hook. Protected page set |
| 33 | `/extended-vael` checkout | Checkout | Demo (`ExtendedVaelCheckout.tsx`) | **Retain**. No Stripe |
| 34 | `/extended-vael` success | Success | Demo | **Retain** |

### Screen count summary

| Group | Unique screens |
|---|---|
| A. City-wide | 13 |
| B. Media & Technology marketplace | 7 (including match/buyer dashboards pending clone collapse) |
| C. Auth / onboarding | 2 (+ 1 overlay) |
| D. Profile (full page) | 1 |
| E. Handshake / messaging | 2 (plus city messages already in A) |
| F. Community (district) | 1 |
| G. Admin | 2 |
| H. Legal | 3 |
| I. Placeholders | 0 additional (same screen as #6) |
| Extended VAEL demo | 3 |
| **Total unique** | **36** |
| Overlays | 1 (handle claim) |
| Redirects | Not counted |

If match dashboard and buyer dashboard collapse into Board on clone review: **34**.

---

## 4. Core VAEL user journey

The intended journey (PRD / Owner Brief):

```
Enter the City
  → create / maintain identity
  → Veil In (available) OR Veil Out (need someone)
  → create an availability / need listing
  → VAEL calculates percentage-based matches
  → discover potential matches
  → both parties accept a Handshake
  → private profile information becomes available
  → private connection / message begins
```

### How that journey is framed today (Media & Technology)

```
City Home (`/`) or District home (`/media-technology`)
  → Auth (M&T-scoped) + Handle claim + Join (profile type)
  → Profile (headline, bio, disciplines, skills, tools, location, rates, portfolio, documents tab)
  → Go Visible (`/go-visible`) or Veil / Post opportunity
  → Listing written to mockListings (24h expiry)
  → Matching Board (`Board.tsx` + matching.ts)
  → Match card (Strong / Good / Possible)
  → Handshake request (source: board_match OR handshake from profile)
  → Connection detail: pending → (mutual accept) connected
  → Reveal + messages + local attachments
```

### Generic VAEL pattern vs Media & Technology-specific

| Step | Generic City pattern (reuse) | Media & Technology-specific (do not genericize without Owner) |
|---|---|---|
| Enter City | City shell, nav, districts map, honest lot status | — |
| Identity | Handle, display name, profile type, documents tab, completeness | Disciplines, skills, tools, media portfolio language |
| Veil ritual | In vs Out, 24h default, re-veil, expiry, plan label | Form fields: media discipline, tools, certs, engagement, budget proxy |
| Listing / Need | Side, category, location, timing, visibility window | Requirements/tools/certs copy; rich description fields that the SQL drawing does not yet store |
| Matching | Percentage, bands (Strong/Good/Possible), ranked Board, filters | Weights: Discipline 22, Skills 10, Tools 9, Certifications 6, Location 10, Remote/Onsite 6, Timing 11, Experience 9, Engagement 6, Budget 5, Completeness 6. **Protected.** |
| Match detail | Why this %, overlapping fields, Handshake CTA | Field-level reasons tied to media/tech schema |
| Handshake | Mutual accept, pending/declined/connected/closed, no full reveal until both accept | Same spine; no district-specific Handshake rules documented |
| Connection | Party-private room | Same |
| Messages | Thread per connection, attachments, block/report | Same spine; attachment Utility is local-only |
| Community | City feed + per-live-district community | M&T topics/samples |
| Account | Visibility 24h, notification prefs, Extended VAEL demo | — |

**Rule for future districts:** copy the **spine** (shell → identity → veil → board → handshake → messages). Give each district its **own fields and matching weights** (or a documented sibling of `matching.ts`). Do not retune Media & Technology weights to fake Construction fit.

---

## 5. Reusable UX patterns

These are the patterns to keep drawing from. Not a new framework — a naming of what already works.

### 5.1 City as a place, not an app

- Lots have status: Live / Coming Soon / Early Access.
- Empty lots stay labeled. Interest forms do not pretend to be Boards.
- Home mixes civic feed + district entry, not a KPI dashboard.

### 5.2 Veil as a time-boxed visibility ritual

- Default **24 hours** (`visibilityLifecycle.ts`, Free Daily VAEL).
- Re-veil exists; open connections reconcile in the prototype (`reconcileConnectionsAfterReVael`).
- Extended duration is a **labeled demo**, not a purchase.

### 5.3 Percentage as the civic instrument

- Match is a **fit percentage**, not a swipe and not a job application.
- Bands: Strong ≥80, Good ≥60, Possible ≥40.
- Board sort is protected. Visual redesign may not quietly change order.

### 5.4 Handshake as a lock, not a button

- Full profiles revealed only after **both** accept.
- Two sources: board match and profile handshake — one connection model.
- Chat lives on the connection after connect.

### 5.5 Honest utilities

- In-app notices: real (local).
- SMS / email / push: **NOT YET CONNECTED**.
- Payments: **DEMO PRICING — NOT YET AVAILABLE FOR PURCHASE**.
- Concierge: local keyword routing, not AI.

### 5.6 Parallel Rooms, not one generic exchange

- One live district folder/layout.
- Next districts are siblings, not a melted engine.
- City search/feed may aggregate, but a lot without a Room must not grow a fake Board.

---

## 6. Component architecture proposal

**Do not implement these now.** This is the target structure for design-system and later UI work, mapped onto the existing tree.

Keep `src/components/city/*`. Add shared primitives beside it; do not replace city chrome with a new kit that ignores existing pages.

```
src/components/
  city/                 ← already exists (nav, district cards, homepage)
  shell/                ← proposed: AppHeader, CityFooter, DistrictSwitcher, MobileNav
  district/             ← proposed: DistrictLayoutChrome, DistrictHeader, LotStatusBadge
  vael/                 ← proposed: VeilToggle, VisibilityCountdown, ListingCard, ListingForm
  matching/             ← proposed: Board, MatchCard, MatchPercent, MatchBand, MatchWhy, BoardFilters
  handshake/            ← proposed: HandshakeActions, HandshakeStatus, RevealGate
  messaging/            ← proposed: Inbox, Thread, Composer, AttachmentChip
  profile/              ← proposed: ProfileHeader, ProfileCard, Completeness, DocumentsList, VerificationState
  community/            ← proposed: PostCard, Composer, ReactionBar, SaveButton (already partly via communityService)
  account/              ← proposed: AccountNav, VisibilityPanel, ChannelToggle
  notices/              ← proposed: Bell, NotificationList, NotificationItem
  feedback/             ← proposed: EmptyState, LoadingState, ErrorState, ConfirmDialog
  overlays/             ← proposed: Modal, Drawer, ClaimHandleDialog (exists)
  legal/                ← proposed: LegalLayout
```

### Proposed reuse map

| Need | Proposed piece | Exists today (named) | Notes |
|---|---|---|---|
| City shell | `CityLayout` + `shell/*` | `CityLayout`, `src/components/city/*` | Redesign in place |
| Navigation | `AppHeader`, `MobileNav` | City nav (file names not fully listed in audit) | Inspect clone |
| District navigation | `DistrictLayoutChrome` | `MediaTechnologyLayout` | Copy per new district; extract shared chrome later **without** melting M&T |
| Page headers | `PageHeader` | Unknown | Add as primitive; don’t invent a dashboard title bar |
| Cards | `SurfaceCard` | District cards, community cards | Gold/navy/paper, not generic shadcn-default |
| Listing cards | `ListingCard` | Board / feed listing presentation | Side (in/out), expiry, discipline |
| Match cards | `MatchCard` | Board rows | Must show % and band |
| Profile cards | `ProfileCard` | Profile + directory | Visitor vs member visibility is a product door |
| Match % indicators | `MatchPercent`, `MatchBand` | matching.ts bands | Distinctive VAEL control — not a KPI sparkline |
| Filters | `BoardFilters` | Board | District-specific filter fields |
| Search | `CitySearch` | `/search`, `mockSearch.ts` | |
| Forms | `FormField`, `VeilForm` | VaelFlow, join, interest form | |
| Availability controls | `VeilToggle`, `VisibilityCountdown` | visibility lifecycle | 24h is the default story |
| Handshake actions | `HandshakeActions` | handshake button on Board/profile/detail | Pending/accept/decline |
| Messaging | `Thread`, `Composer` | ConnectionDetail + `/messages` | One system |
| Notifications | `Bell`, list | mock notifications | In-app only |
| Documents | `DocumentsList` | `ProfileDocumentsTab` | Local bytes today |
| Community posts | `PostCard` | CommunityFeed, district community | |
| Empty / loading / error / confirm | `feedback/*` | Not inventoried in M1 | Design these once; Board empty is a P1 |
| Modals / drawers | `overlays/*` | `ClaimHandleDialog` | |
| Responsive layouts | Tailwind templates in shell | **Not audited** | Phase 10 |

Protected / do not casually restyle into a different product: `matching.ts`, `Board.tsx` sort order, `LiveExchangeDemo.tsx`, Extended VAEL page set.

---

## 7. UX gaps and priorities

Priorities map Punch List severity onto design:

- **P0** — blocks the core product *experience* (including honesty of the prototype vs a real City)
- **P1** — important for the next approved development milestone (M2: stabilize pattern + Construction + Trucking)
- **P2** — polish / hygiene / later Rooms

No invented requirements.

### P0 — blocks the core product experience

| ID | Gap | UX meaning | Punch List |
|---|---|---|---|
| P0-1 | Runtime Foundation is browser storage | Two people cannot complete a real Handshake. UI must not imply a shared live market. | PL-001 |
| P0-2 | Auth cutover would drop identity | Handle, join, team, admin still keyed to mock ids. Do not design a “connected account” cutover in this phase. | PL-002 |
| P0-3 | VAEL / Handshake / messaging seams unwired | Board, Veil, connections, messages, bell still on mocks. Visual redesign is safe; “backend ready” UI is not. | PL-003 |
| P0-4 | Listing body not in Foundation drawing | Description, contact, requirements, budget, timeline exist in the prototype form and would vanish on a naive pour. UX must keep rich listing content until Owner chooses add-to-drawing vs shrink-the-form (PL-004). | PL-004 |
| P0-5 | No file Utility | Documents and chat attachments are local. Do not design cloud file management as if it works. | PL-005 |
| P0-6 | Matching is Media & Technology only | Construction/Trucking Boards cannot reuse these weights honestly. Future district design needs **sibling** scoring, not a generic slider. | PL-006 |
| P0-7 | Anonymous profile details still open | Prototype ProfilePage shows details to signed-out visitors; Foundation drawing hides district profiles. Two answers to one door. | PL-021 (Owner) |

### P1 — important for upcoming milestone

| ID | Gap | UX meaning | Punch List |
|---|---|---|---|
| P1-1 | Construction Exchange does not exist | Placeholder only. Do not design it as live until fields + matching exist. | PL-010, PL-020 |
| P1-2 | Trucking Exchange does not exist | Same. | PL-011 |
| P1-3 | Verified profile is partial | Documents tab exists; no verification workflow, no reputation model. Need a visible **Unverified / Verified** state even if Unverified is the only honest value. | PL-014 |
| P1-4 | Block / report / moderation scaffolding | Connection-level mock only; no platform moderation UI. Handshake Room needs a trustworthy safety pattern before a real market. | PL-016 |
| P1-5 | Auth lives under Media & Technology | City-wide product should sign in at City level. | Framing §5 |
| P1-6 | Two doors into messages | `/messages` vs connection detail. Needs one inbox model in UX. | Framing |
| P1-7 | Match vs buyer dashboards vs Board | Risk of three rooms for one Board. Confirm on clone. | Framing §5 |
| P1-8 | Responsive behavior unaudited | Board, Veil form, thread may be desktop-first. | Evidence gap |
| P1-9 | File story has two plumbing stacks | Parallel media keys — UX should show one attachment pattern. | PL-038, PL-005 |

### P2 — improvement / later Rooms

| ID | Gap | UX meaning | Punch List |
|---|---|---|---|
| P2-1 | Residential flow missing | Not a lot on the map. Do not use Real Estate as a stand-in. | PL-012, PL-020 |
| P2-2 | Commercial flow missing | Same. | PL-013 |
| P2-3 | Subscription gating is demo theater | Keep demo labels. No real gating of homeowner leads. | PL-015, PL-022 |
| P2-4 | Communities not district-complete | City + M&T work; other districts have no community because they have no Rooms. | PL-017 |
| P2-5 | Extra registry districts | Healthcare, Government, etc. must stay labeled, not designed as live. | PL-023 |
| P2-6 | Legal SMS terms vs disconnected SMS | Keep copy consistent. | Utilities |
| P2-7 | Admin as a simulate flag | Do not ship a staff-looking OS. | PL-002, PL-036 |
| P2-8 | Hygiene | Dead listings module, package name, missing `.env.example`, no CI/deploy in this copy. | PL-030–035 |

### Out of scope for UX (do not design as live)

Stripe, SMS/email/push vendors, pouring Supabase, new districts beyond PRD, rewriting M&T matching weights, AI concierge.

---

## 8. Information architecture

### Requested sketch (validated)

```
VAEL
├── City
│   ├── Home
│   ├── Feed
│   ├── Search
│   ├── Go Visible
│   ├── Districts
│   ├── Notifications
│   ├── Messages
│   └── Account
│
├── Districts
│   ├── Media & Technology
│   ├── Construction
│   ├── Trucking
│   ├── Residential
│   └── Commercial
│
└── Shared
    ├── Profile
    ├── Handshake
    ├── Messages
    └── Community
```

### What is correct

- City parent + district Rooms is how the product is already framed.
- Home, Feed, Search, Go Visible, Districts, Notifications, Messages, Account **all exist** as city routes.
- Shared spine (Profile, Handshake, Messages, Community) is the right reuse model.
- Media & Technology is the only live district; Construction and Trucking are the next PRD Rooms; Residential and Commercial are later.

### What is incorrect or incomplete if used blindly

| Sketch item | Reality | UX recommendation |
|---|---|---|
| Construction | Registry name is **Contractor** | Show **Coming Soon** until Owner closes PL-020. Do not relabel in UI without Owner. |
| Residential / Commercial | **Not in `districts.ts`** | Do not put them on the map as live lots. Optional: “future Room” only if Owner wants them visible; otherwise keep them off the directory until named. |
| Missing City routes | `/today`, `/concierge`, `/account/visibility`, `/account/notifications`, `/extended-vael` | Keep them. Concierge and Today are part of the current City. Extended VAEL stays a demo suite under Account / Visibility. |
| Shared Profile | Implemented as **M&T profile** (`/media-technology/profile/:username`) | Target IA: City-level profile with **district sections**. Do not fork a second profile system. |
| Shared Handshake / Messages | Implemented on M&T connection routes + city `/messages` | Target: one connection model, district-tagged. |
| Shared Community | City feed + M&T community | Target: city feed aggregates **live** districts only. |
| Auth | Under MediaTechnologyLayout | Move **chrome** to City (design), without changing auth architecture (engineering constraint). |
| Legal / Admin | Omitted | Keep Legal under City. Keep Admin as a non-member, prototype-only branch. |
| Extra lots | Nursing, Equipment, Government, Real Estate, Legal & Finance | Remain on the map as labeled placeholders. Building them is a Change Order. Real Estate ≠ Residential. |

### Recommended IA (evolve in place)

```
VAEL
├── City                              ← CityLayout (exists)
│   ├── Home                    `/`
│   ├── Feed                    `/feed`
│   ├── Search                  `/search`
│   ├── Go Visible              `/go-visible`
│   ├── Today                   `/today`
│   ├── Concierge               `/concierge`
│   ├── Districts               `/districts`
│   ├── District lot            `/districts/:slug`   ← placeholder until live
│   ├── Notifications           `/notifications`
│   ├── Messages                `/messages`          ← same threads as Handshake
│   ├── Account                 `/account`
│   │     ├── Visibility        `/account/visibility`
│   │     └── Notification prefs `/account/notifications`
│   ├── Extended VAEL (demo)    `/extended-vael` …
│   └── Legal                   `/legal/*`
│
├── Districts
│   ├── Media & Technology      `/media-technology/*`   ← LIVE pattern
│   │     ├── Home
│   │     ├── How it works
│   │     ├── Board
│   │     ├── Veil / Post
│   │     ├── Community
│   │     ├── Connections       ← Handshake list/detail
│   │     └── Profile           ← until City-level profile is extended
│   ├── Contractor / Construction `/districts/contractor`  ← placeholder (name: Owner)
│   ├── Trucking                `/districts/trucking`     ← placeholder
│   ├── (not on map yet)        Residential, Commercial
│   └── Extra labeled lots      Healthcare, Equipment, Government, Real Estate, Legal & Finance
│
└── Shared spine (pattern, not necessarily new URLs yet)
    ├── Identity / Profile
    ├── Veil (24h)
    ├── Board (district engine)
    ├── Handshake
    ├── Messages
    └── Community
```

**Do not** add Construction/Trucking/Residential/Commercial as live IA nodes in the UI until those Rooms exist. Honest labels beat greyed-out fake Boards.

---

## 9. Visual / design direction

### What already is VAEL

From the medallion, audit covers, and the audit stylesheet (which follows the product design system):

| Token | Value / treatment |
|---|---|
| Gold | `#c4890a` · bright `#e9a20b` · deep `#8a5a00` |
| Navy / charcoal | `#0a1015` · `#141c24` · cover `#05080b` |
| Paper | `#f7f4ec` · `#efe8d6` |
| Ink | `#12161a` · soft `#3a4148` · muted `#5c646c` |
| Status | Live green `#1f6b43` · Soon amber `#9a5b00` · Early blue `#1d4a6e` · Block red `#8b1e1e` |
| Display type | Serif (Palatino / equivalent) for City titles |
| UI type | Avenir Next / geometric sans; wide tracking on kickers |
| Mark | Angular gold **V** medallion; wordmark with a bar-style E; concentric gold ring |
| Cover language | Double gold rule, charcoal field, medallion, uppercase kicker |

The product already has a **civic + metallic + paper** identity: a City with a seal, not a SaaS tenant.

The canonical token file is `design/VAEL_DESIGN_SYSTEM.md` + `src/index.css` on the clone. **Phase 1 starts by transcribing those tokens**, not by inventing a new palette.

### How to evolve (not replace)

**Keep**

- Charcoal + gold + warm paper. The City is dark at the gate and paper-lit inside Rooms.
- Medallion, double rules, uppercase kickers, serif for place names.
- Lot badges (Live / Coming Soon / Early Access).
- Percentage as a **seal / instrument**, not a dashboard metric.
- Honest disconnected labels.

**Evolve**

- **Density for work:** Board, Handshake, and Veil forms need more functional density than a marketing cover, without becoming a table-admin tool.
- **Network, not funnel:** show *who is visible now* and *fit between two sides*, not conversion charts.
- **Handshake as ceremony + utility:** pending state should feel like a closed door (not a disabled checkbox); connected state should feel like a private room.
- **District color as accent only:** do not give each district a rainbow brand. Gold stays civic; district identity is typography, fields, and lot names.
- **Type:** keep serif for City/district titles; use the existing sans for body and forms. Do not switch the product to Inter/system-default SaaS.
- **Motion:** short, mechanical (veil countdown, match % settling). No playful consumer-app bouncing.
- **Surfaces:** paper cards on charcoal, gold hairlines, not glassmorphism stacks and not white-grey CRUD.

**Avoid**

- Generic sidebar dashboards, purple gradients, “cards in a 12-column bootstrap grid,” Inter-on-white settings.
- Fake AI, fake live maps, fake presence avatars that imply a multi-user server.
- Redesigning the medallion or renaming VAEL.
- A second visual system for Construction “because trades apps look like that.” Construction should feel like another **district of the same City**.

### Tailwind

Stay on Tailwind. Map existing CSS variables / `@theme` (from `src/index.css` on clone) to utilities. Add component classes only where the Board/Handshake repeat. Do not add a new CSS-in-JS layer.

---

## 10. Design-build roadmap

Engineering Blueprint (document 06) remains the development sequence. This UX roadmap **sits beside it**, does not replace it, and does not authorize pouring Foundation, Stripe, SMS, or new districts.

Owner approval is still required before Milestone 2 code. This UX work can proceed as **foundation design** without implementing Rooms.

### Phase 0 — UX Foundation

| | |
|---|---|
| **Goal** | Shared map of screens, pattern, IA, and gaps. This document. |
| **Screens** | None built. Inventory of 36 unique screens. |
| **Major UX flows** | Documented core loop; generic vs M&T split. |
| **Reusable components** | Proposed only. |
| **Dependencies** | Milestone 1 pack accepted as the map. Canonical clone still required before visual QA. |
| **Priority** | P0 for design. |
| **Acceptance** | This file exists; Owner can see screen count, first screen, and open decisions. |

### Phase 1 — Design system

| | |
|---|---|
| **Goal** | Transcribe and tighten the **existing** VAEL tokens into a usable UI kit — not a new brand. |
| **Screens** | Token reference, component gallery (design, not product routes). |
| **Major UX flows** | None shipped. |
| **Reusable components** | Color, type, spacing, badges, cards, MatchPercent, buttons, forms, empty/loading/error, modal. |
| **Dependencies** | Canonical `design/VAEL_DESIGN_SYSTEM.md` + `src/index.css`. Medallion. |
| **Priority** | P0 for any visual work. |
| **Acceptance** | Tokens match existing gold/navy/paper; no new primary brand color; MatchPercent and LotStatus exist as specs; Tailwind mapping documented. |

### Phase 2 — City Shell

| | |
|---|---|
| **Goal** | Make the City feel like one place. Auth chrome reads as City-level. Lots stay honest. |
| **Screens** | Home, Districts directory, placeholder lot, Search, Feed (chrome), Go Visible entry, Account hub, nav (desktop + first mobile pass). |
| **Major UX flows** | Enter City → scan lots → enter M&T or read Coming Soon; signed-out vs signed-in shell. |
| **Reusable components** | AppHeader, DistrictSwitcher, DistrictCard, LotStatusBadge, PageHeader, MobileNav. |
| **Dependencies** | Phase 1 tokens. Do not implement new districts. |
| **Priority** | P0 UX. Aligns with “keep the frame.” |
| **Acceptance** | Home is clearly a City, not a dashboard. Only M&T is enterable as a working Room. Placeholder copy remains honest. Existing routes unchanged. |

### Phase 3 — Core VAEL

| | |
|---|---|
| **Goal** | Redesign the live loop so it is the pattern other districts copy — without changing matching weights or removing features. |
| **Screens** | Veil, Board, match detail, Handshake list/detail, Profile (incl. documents tab + verification **state**), Messages, Notifications. |
| **Major UX flows** | Veil In/Out → Board → Handshake → reveal → message. Profile Handshake path. 24h expiry / re-veil. |
| **Reusable components** | ListingCard, MatchCard, MatchPercent, BoardFilters, VeilToggle, HandshakeActions, Thread, ProfileHeader, DocumentsList, EmptyState. |
| **Dependencies** | Phase 2 shell. Owner on PL-021 (anonymous profiles) before locking profile visitor state. Do not change `matching.ts` weights. |
| **Priority** | P0 product UX. Parallel to engineering 2.1–2.4 (seam, identity, listing payload, profile state) — design does not wait on Foundation pour. |
| **Acceptance** | A new designer could specify Construction Board by swapping fields, not by inventing a new product. Handshake still hides full profile until both accept. Demo/disconnected labels remain. |

### Phase 4 — Construction

| | |
|---|---|
| **Goal** | **Design** Construction Exchange as a parallel Room. **Do not implement** until Owner names the lot and engineering 2.6 is approved. |
| **Screens** | District home, Veil (trades fields), Board, Handshake (shared), Profile district section. |
| **Major UX flows** | Same spine; Owner-approved trades/license/job-type fields. |
| **Reusable components** | District layout clone; new filter/field set; **new matching weights spec** (sibling of matching.ts — Owner). |
| **Dependencies** | PL-020 name (Construction vs Contractor). Phase 3 pattern. PL-006. |
| **Priority** | P1. |
| **Acceptance** | Spec exists; UI stays Coming Soon in the product until the Board actually matches construction people. |

### Phase 5 — Trucking

| | |
|---|---|
| **Goal** | Same as Construction for loads/routes/availability (Owner-approved fields). |
| **Screens** | Parallel set. |
| **Major UX flows** | Same spine. |
| **Reusable components** | Same chrome; trucking field/filter set; sibling matching spec. |
| **Dependencies** | Phase 3–4 pattern. PL-011. |
| **Priority** | P1. |
| **Acceptance** | Honest Coming Soon until the Board is real. |

### Phase 6 — Residential

| | |
|---|---|
| **Goal** | Homeowner/civilian need → available people. Only after Owner names the lot (new district vs mode inside Construction). |
| **Screens** | Intake + Board + Handshake spine. |
| **Major UX flows** | Civilian Veil Out → match to available contractors (or named Room). |
| **Reusable components** | Simplified Veil; shared Handshake. |
| **Dependencies** | PL-012, PL-020. Not Real Estate early-access. |
| **Priority** | P2 until M3. |
| **Acceptance** | Named Room in IA; no pretend Real Estate flow. |

### Phase 7 — Commercial

| | |
|---|---|
| **Goal** | Business/civilian need-posting Room as specified in the PRD. |
| **Screens** | Parallel to Residential with commercial intake. |
| **Major UX flows** | Same Handshake spine, different intake. |
| **Reusable components** | Shared. |
| **Dependencies** | PL-013, PL-020. |
| **Priority** | P2 until M3. |
| **Acceptance** | Named Room; same spine. |

### Phase 8 — Community

| | |
|---|---|
| **Goal** | City feed + community inside **each live** district. No invented posts for unfinished lots. |
| **Screens** | Existing Home/Feed + M&T community; later Construction/Trucking community when those Rooms are live. |
| **Major UX flows** | Post → react → save → jump to profile/listing. |
| **Reusable components** | PostCard, Composer (already partly wired via `communityService`). |
| **Dependencies** | Live districts only. PL-017. |
| **Priority** | P2 for new districts; P1 to keep current feed honest during shell redesign. |
| **Acceptance** | Feed does not fabricate activity for Coming Soon lots. |

### Phase 9 — Trust / Visibility / Structural subscription

| | |
|---|---|
| **Goal** | Verification **state** on profiles; one attachment pattern; visibility plans remain structural; demo pricing labeled. |
| **Screens** | Profile verification state; document review as seen by the member; Extended VAEL demo pages (already protected); visibility settings. |
| **Major UX flows** | Unverified → (future) verified; 24h veil; demo extended plans. |
| **Reusable components** | VerificationState, ChannelToggle, DocumentsList. |
| **Dependencies** | PL-014, PL-015, PL-022. No Stripe. No SMS vendor. |
| **Priority** | P1 for verification **state**; P2 for subscription theater. |
| **Acceptance** | PRD can point at a verification state. Paid tiers still say not available for purchase. |

### Phase 10 — QA / Responsive / Handoff

| | |
|---|---|
| **Goal** | Viewport pass, empty/error states, design-to-dev notes. No deploy without Owner. |
| **Screens** | Every **live** screen at desktop and a representative mobile width. |
| **Major UX flows** | Core loop click-through; signed-out vs signed-in; placeholder lots. |
| **Reusable components** | Feedback states completed. |
| **Dependencies** | Canonical clone; `npm install`; known 7-error fingerprint. Component tests remain optional unless Owner asks. |
| **Priority** | Required before calling any visual milestone done. |
| **Acceptance** | Board, Veil, Handshake thread, Home usable on small screens; no fake connected utilities; punch-list UX items done or explicitly deferred. |

---

## 11. Recommended first screen to design

**First screen: City Home (`/`).**

Reasons:

1. It is the civic front door. If Home looks like a generic dashboard, the rest of the City will follow that mistake.
2. It already exists and must be **retained**, not replaced — this is the continue-don’t-rebuild test.
3. It exercises shell, nav, district cards, lot status, feed mix, and Go Visible — the pieces every later screen hangs on.
4. It does **not** require Owner field lists for Construction/Trucking, and it does not tempt a matching-weight change.
5. Blueprint: finish and clarify the frame, then copy the district pattern.

**Immediately after Home (still Phase 2–3):** **Matching Board** — the distinctive product control (percentage fit). That is the first *district* screen to design, and the template for Construction/Trucking later.

**Do not start with** Construction, Residential, a new Community app, or a settings redesign. Those either do not exist or are not the pattern.

---

## 12. Open questions / Owner decisions

Engineering must not invent these. UX must not paper over them.

| ID | Decision | Why it blocks design | Suggested options (Owner chooses) |
|---|---|---|---|
| PL-020 | Lot names: Construction vs Contractor; whether Residential/Commercial appear on the map before they are Rooms | Directory, Home cards, and any sitemap | (a) Rename Contractor → Construction Exchange when the Room is framed. (b) Keep Contractor. (c) Add Residential/Commercial as labeled future lots vs hide until built. |
| PL-021 | Anonymous visitors seeing profile details | Profile visitor state, Handshake “closed door” story | (a) Align product to Foundation: district details signed-in only. (b) Keep prototype-open profiles. (c) Public teaser, full district payload after sign-in. |
| PL-022 | Monetization / ads / premium visibility | Extended VAEL pages stay demo until this is closed | Keep structural demo; do not pick a price in UI copy beyond existing demo cents. |
| PL-023 | Extra districts (Healthcare, Government, Real Estate, …) | Home/Districts density | Keep Coming Soon / Early Access labels; do not design live Rooms. |
| PL-024 | Hosted leftover `vael-media-tech-dev` | Not a UX screen; credential hygiene | Confirm abandoned vs in-scope. UX does not connect it. |
| PL-025 | Communications cadence | Process, not UI | Slack / demo rhythm. |
| PL-004 | Rich listing fields vs thinner `vaels` drawing | Veil form length | Add columns to the drawing **or** reduce the form. UX should not silently drop description/budget/timeline. |
| Match vs buyer dashboards | Are they separate Rooms or Board roles? | Screen count and nav | Confirm on canonical `App.tsx`. |
| `/today` and `/concierge` | Keep, merge, or de-emphasize in nav | City IA | Default: **keep**; concierge copy stays “not a live AI.” |

### What this UX foundation does not authorize

- Rewriting the application or leaving React / TypeScript / Vite / Tailwind  
- Connecting Supabase, storage, SMS, email, push, Stripe, or hosting  
- Implementing Construction, Trucking, Residential, Commercial  
- Changing authentication architecture  
- Changing Media & Technology matching weights  
- Removing working Rooms  

---

## Appendix A — Source map

| Need | Source |
|---|---|
| Product definition, three truths, PRD Rooms vs standing | 00 Owner Brief |
| Stack, folders, routes, registry, mock ownership, matching weights, layouts | 01 Framing |
| Prototype vs SQL; listing field gap; documents as data URLs | 02 Foundation |
| Auth door, anonymous profiles, Handshake as lock | 03 Doors & Locks |
| Disconnected utilities, Extended VAEL demo, concierge | 04 Utilities |
| Numbered gaps | 05 Punch List |
| Finish order; parallel Rooms; when not to pour Foundation | 06 Blueprint |
| Pack contents | `milestone-1/README.md` |
| Gold/navy/paper language used in this audit | `milestone-1/assets/audit.css` |
| Mark | `milestone-1/assets/vael-medallion.png` |

## Appendix B — Clone checklist before design-to-code

1. Restore the canonical application tree (`src/App.tsx`, `design/VAEL_DESIGN_SYSTEM.md`).  
2. Diff this inventory against the route list in `App.tsx`. Collapse match/buyer dashboards if they are Board aliases.  
3. Screenshot City Home, Board, Veil, Handshake detail, Profile (signed out and in), placeholder lot.  
4. Do not start Construction UI.  
5. Do not connect a backend.

---

*THE CITY OF VAEL · UX Foundation · 27 August 2026. Continue, don’t rebuild. Analysis only.*
