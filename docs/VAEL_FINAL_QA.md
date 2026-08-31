# VAEL Final QA

**Date:** 27 August 2026  
**Tree:** React 18 + TypeScript + Vite 5 + Tailwind 3  
**Principle:** Stabilize. Do not invent backends. Do not retune matching.

This kit is a **local frontend City**. Listings, Handshakes, messages, and posts live in `localStorage`. Two devices do not share a City.

---

## 1. Executive Summary

THE CITY OF VAEL is **functionally coherent as a single-device prototype**. The City shell, five live Rooms, Community, Trust, Visibility, and structural Extended VAEL share one visual language and the same spine: Veil → Board → Match → Handshake → Connection → Message.

**Ship status: READY WITH KNOWN LIMITATIONS**

No P0 blockers. Core flow works on this device. TypeScript, tests, and production build pass. Payments, identity verification, search index, SMS/email/push, and a shared Foundation are **not** present and are **not** faked.

This audit pass fixed: Handshake composer empty-state density, drawer background scroll on mobile, and a missing back link on signed-out Share.

---

## 2. Route Audit

Layout: `CityLayout` except `/design-system`. Direct URLs and Vite refresh return **HTTP 200** for 48 sampled paths (SPA). Catch-all `*` renders an honest 404. Legacy `/board`, `/connections`, `/construction`, `/profile/:username` redirect as documented.

| Route | Page | Status | Issue | Priority |
|---|---|---|---|---|
| `/` | Home | Pass | — | — |
| `/feed` | City Feed | Pass | — | — |
| `/feed/new` | Share | Pass | Signed-out now has Back to Feed | FIXED |
| `/feed/:postId` | Post | Pass | — | — |
| `/search` | Search | Pass (placeholder) | No live index | P1 OPEN |
| `/go-visible` | Go Visible | Pass | Header veil still M&T-led | P2 OPEN |
| `/districts` | Districts | Pass | Extra lots soon/early | — |
| `/districts/contractor` (+ how-it-works, board, board/:id, veil, profile, edit, connections, community) | Construction Room | Pass | Slug `contractor` | P2 OPEN (PL-020) |
| `/construction` | Redirect | Pass | Keep | — |
| `/districts/trucking` (+ Room set) | Trucking | Pass | — | — |
| `/districts/residential` (+ Room set) | Residential | Pass | — | — |
| `/districts/commercial` (+ Room set) | Commercial | Pass | — | — |
| `/districts/:slug` | Placeholder | Pass | Honest Coming Soon / Early Access | — |
| `/districts/:slug/community` | Unavailable community | Pass | — | — |
| `/today` | Today | Pass (bookmark) | No calendar | P2 OPEN |
| `/concierge` | Concierge | Pass (bookmark) | Not AI | P2 OPEN |
| `/account` | Account | Pass | Local auth only | — |
| `/account/visibility` | Visibility | Pass | — | — |
| `/account/notifications` | Prefs | Pass | In-app only | — |
| `/notifications` | Notices | Pass | Cards not deep-linked | P2 OPEN |
| `/messages` | Messages | Pass | All five Rooms listed | — |
| `/extended-vael` | Plans | Pass (demo) | Not purchasable | — |
| `/extended-vael/checkout` | Review | Pass (demo) | No payment fields | — |
| `/extended-vael/success` | Demo complete | Pass | Honest non-purchase | — |
| `/media-technology` (+ how-it-works, board, veil, post-opportunity→veil, profile, connections, community) | M&T Room | Pass | — | — |
| `/board` `/connections` `/profile/:username` | Redirects | Pass | Keep | — |
| `/legal/terms` `/legal/privacy` `/legal/sms-terms` | Legal | Pass (stub) | Full copy not in kit | P2 OPEN |
| `*` | 404 | Pass | — | — |
| `/design-system` | Gallery | Pass | Footer link | P2 OPEN |

**Total mounted path patterns in `App.tsx`:** 80 (including params, redirects, catch-alls).  
**Admin:** no `/admin` route.

---

## 3. Core VAEL Flow

| Step | Result |
|---|---|
| Entry | City home; live lots enterable |
| Authentication | `Continue locally` — not a production IdP |
| Profile | Identity / capabilities / documents / Trust |
| Veil / Create VAEL | Per-Room; 24-hour Free Daily; Re-veil / End visibility |
| Matching | Percentage fit; sibling engines; empty + Clear filters |
| Match Detail | Progressive disclosure + Trust aside |
| Handshake | Request / pending / incoming / decline / connected / block |
| Connection | Private after mutual accept |
| Messaging | Labeled composer; Send disabled until body; local attachment name |

**Simulate counterpart accept** remains for sample handles (one device). Labeled. Not a second user.

User always has a next action on core paths. Loading is unused on product lists (sync localStorage) — not a fake spinner.

---

## 4. District QA

| District | Shell | Terms | Own fields | Empty | Coming soon | Match | Handshake |
|---|---|---|---|---|---|---|---|
| Media & Technology | Yes | Veil / VAEL | Disciplines | Yes | N/A (live) | Own engine | Yes |
| Construction | Yes | Trade / job | Construction | Yes | N/A | Sibling engine | Yes |
| Trucking | Yes | Capacity / load | Equipment / lane | Yes | N/A | Sibling engine | Yes |
| Residential | Yes | Need at home | Service / area | Yes | N/A | Sibling engine | Yes |
| Commercial | Yes | Business need | Capability / context | Yes | N/A | Sibling engine | Yes |

Extra lots (Healthcare, Equipment, Government, Real Estate, Legal & Finance) stay Coming Soon / Early Access. Real Estate is not Residential.

---

## 5. Community QA

City Feed and per-Room community load. Share requires local handle. Like/save prompt Continue locally when signed out (not fake network). Author handle links to district profile. Coming Soon lots have no invented discussion. Empty saved/filter has a next action. Comments work on post detail. Notifications mention comments where the local store records them.

Not a social network. Not searched from `/search`.

---

## 6. Trust & Profile QA

Unverified only on product screens. Fill count is not a trust score. Documents: none / restricted / listed; private files closed until Handshake `connected`. Match Detail reports **public** documents only. Profile edit: required display name, save/cancel, local file preview. Public handle/name; district payload after sign-in (PL-021 option c).

---

## 7. Handshake QA

Supported UI states: Request, Pending (sent), Incoming (accepted kind), Decline, Connected, Closed, Blocked. **Handshake expiry is not a connection status** (listings expire; connections do not). Mutual accept reveals rates/portfolio. Copy: “Connected is not verification.”

---

## 8. Messaging QA

City `/messages` lists connected rooms across all five districts with last-line preview (`truncate`). Handshake composer: empty copy is compact; Send disabled until text; failed send surfaces an alert if `sendMessage` throws. Attachments are filename-only, labeled NOT YET CONNECTED. Composer closed until both accept.

---

## 9. Visibility QA

Not visible / Veil In / Veil Out / Expiring (≤4h existing clock) / Expired (latest stored listing). 24-hour default unchanged. Re-veil and End visibility on Veil forms. `/account/visibility` per Room. Header session veil still follows Media & Technology when that listing is active.

---

## 10. Subscription QA

Free Daily = current. Extended = demo, `purchasable: false`. Label: **DEMO PRICING — NOT YET AVAILABLE FOR PURCHASE**. Checkout: Continue demo (no charge). Success: no purchase, no billing record. **No Stripe.**

---

## 11. Responsive QA

| Width | What was checked |
|---|---|
| 320 | Home, search, Construction Board, overflow `scrollWidth===clientWidth` |
| 375 / 390 | Prior plan comparison stack |
| 1280 | Residential home, Messages, Handshake composer |
| 768–1920 | Same primitives (`md`/`lg` breakpoints); not every pixel width screenshotted |

Room nav may **scroll horizontally** at 320px (six tabs) — intentional. Filter drawers below `md`. Bottom nav `lg:hidden`. Plan comparison stacks. Drawer now locks `body` overflow.

---

## 12. Accessibility QA

Skip link, `main`, breadcrumbs, labeled forms, FilterChip `focus-visible`, status as text + badge, `prefers-reduced-motion`, Unverified not color-only, Send disabled until content. Drawer: Escape + overlay close; **no full focus trap** (P2 OPEN). No axe CI.

---

## 13. Design System QA

Semantic tokens used in product UI. Hex only in `index.css` / `tokens.ts`. Radii tight. No competing dual primaries on core pages. Gallery MatchCard demo buttons are gallery-only.

---

## 14. UX Copy QA

Veil / VAEL / Match / Handshake / Connection consistent. No Unlock / Transform / Streamline / Empower / Revolutionize. Ticket IDs removed from member Room copy. Search and legal remain honest stubs.

---

## 15. Form QA

Veil, profile edit, Share, search: labels, required where already required, errors, cancel/back, save/success. Input preserved on validation error. Search has a visible submit. File inputs labeled. No placeholder-as-label on product forms.

---

## 16. State QA

Empty states have next actions on core and City stubs. ErrorState on missing match/handshake/post IDs and 404. Success: profile saved, VAEL saved, demo checkout. Disabled: Send, unsigned composer. Expired: listings. Pending: Handshake. **LoadingState unused** on product routes (sync storage) — documented, not faked.

---

## 17. Privacy & Role QA

Signed-out: City, lots, public identity, community read. Signed-in: district payload, Veil, Board. Handshake connected: private profile + messages. No admin console. Roles unchanged. Unauthorized staff UI not shown.

---

## 18. Runtime QA

Vite SPA: 48 routes HTTP 200. Handshake composer and Messages inbox render without a blank page. No `console.log` in `src/`. Failed network requests are not expected (no APIs). Hydration N/A (CSR).

---

## 19. Code QA

`npm run typecheck` pass. `npm test` 44 passed. `npm run build` pass. **No ESLint / lint script.** Typed `JSON.parse as T` remains in stores. No large refactors this pass.

---

## 20. Punch List Cross-check

| ID | Classification | Frontend | Backend |
|---|---|---|---|
| PL-001 Runtime storage | OUT OF SCOPE | Local stores | Shared DB not connected |
| PL-002 Auth cutover | CLOSED (local) | Unified session | Production IdP not connected |
| PL-003 Seams | CLOSED | Cores wired | — |
| PL-004 Listing body | CLOSED (local) | Fields stored | SQL not in kit |
| PL-005 Files | PARTIALLY CLOSED | Local `dataUrl` | Cloud storage not connected |
| PL-006 Matching | CLOSED | Five engines | — |
| PL-010–013 Rooms | CLOSED | Five live Rooms | — |
| PL-014 Verification | PARTIALLY CLOSED | Unverified UX | No workflow |
| PL-015 Subscription | PARTIALLY CLOSED | Demo pages | No billing |
| PL-016 Moderation | PARTIALLY CLOSED | Block | No Report/admin |
| PL-017 Community | CLOSED | City + 5 Rooms | — |
| PL-020 Naming | PARTIALLY CLOSED | Construction live; slug contractor | Owner lock |
| PL-021 Privacy | PARTIALLY CLOSED | Option (c) | Owner lock |
| PL-022 Monetization | OPEN | Demo only | Owner |
| PL-023 Extra districts | OPEN | Placeholders | Owner |
| PL-024 Hosted leftover | OUT OF SCOPE | — | — |
| PL-025 Cadence | OPEN | — | Process |
| PL-030–031 SQL | OUT OF SCOPE | — | — |
| PL-032 TS errors | CLOSED | Clean | — |
| PL-034 CI/git | PARTIALLY CLOSED | Scripts exist | No CI/deploy |
| PL-036 Admin | OUT OF SCOPE | No console | — |
| PL-037 Notifications | OUT OF SCOPE | In-app only | No vendors |
| PL-038 Media keys | CLOSED | Single path | — |

Do not mark infrastructure CLOSED because the UI exists.

---

## 21. Issues Fixed

| ID | Area | Issue | Priority | Status | Notes |
|---|---|---|---|---|---|
| QA-201 | Messaging | Giant EmptyState in Handshake composer | P1 | FIXED | Compact copy |
| QA-202 | Mobile | Filter/more drawer scrolled the page behind | P1 | FIXED | `body` overflow lock |
| QA-203 | Community | Signed-out Share had no back path | P2 | FIXED | Back to Feed |
| QA-101–120 | Empty/copy/a11y | Prior QA pass (filters, search submit, overflow, PL-* copy, RequireMember) | P1/P2 | FIXED | See previous milestone |

---

## 22. Remaining Issues

| ID | Area | Issue | Priority | Status | Notes |
|---|---|---|---|---|---|
| QA-301 | Search | No live index | P1 | OPEN | Honest empty; do not invent results |
| QA-302 | Visibility | Header veil follows M&T listing | P2 | OPEN | Per-Room truth is `/account/visibility` |
| QA-303 | Legal | Stub copy | P2 | OPEN | Not in this kit |
| QA-304 | City | `/today` `/concierge` bookmark only | P2 | OPEN | Documented keep |
| QA-305 | Notices | Cards are not deep links | P2 | OPEN | Notice records have no href |
| QA-306 | A11y | Drawer has no focus trap | P2 | OPEN | Escape + overlay work |
| QA-307 | Gallery | `/design-system` in footer | P2 | OPEN | Kit, not staff |
| QA-308 | Handshake | `simulateAccept` on sample handles | P2 | OPEN | Required for one-device demo |
| QA-309 | Verify | Unverified only | P2 | OPEN | Honest |
| QA-310 | Plans | Not purchasable | P2 | OPEN | Intentional |

**P0 remaining:** none.

---

## 23. Backend Dependencies

Not connected: Supabase, RLS, cloud storage, production auth, SMS, email, push, Stripe, search index, identity verification, admin OS, CI/hosting.

---

## 24. Final Blockers

For a **multi-user production City** (not this kit): shared Foundation, real auth, file Utility, verification, billing Change Order, legal copy, search, hosting.

None of these were faked. They do **not** block shipping this frontend prototype for product-design review.

---

## 25. Ship Readiness

**READY WITH KNOWN LIMITATIONS**

Criteria for READY were not met because the product is explicitly a local prototype (no shared City, no payments, no verification). Criteria for NOT READY were not met: no P0, core flow works, major routes load, TypeScript/tests/build pass, no critical overflow on audited mobile widths.

Suitable for **final product-design review** of the existing City. Not suitable to claim a live multi-user network.

---

## Issue table (complete)

| ID | Area | Issue | Priority | Status | Notes |
|---|---|---|---|---|---|
| QA-201 | Messaging | Composer empty too large | P1 | FIXED | This pass |
| QA-202 | Mobile | Drawer background scroll | P1 | FIXED | This pass |
| QA-203 | Community | Share signed-out dead end | P2 | FIXED | This pass |
| QA-301 | Search | No index | P1 | OPEN | Honest |
| QA-302 | Visibility | Header M&T veil | P2 | OPEN | Documented |
| QA-303 | Legal | Stub | P2 | OPEN | — |
| QA-304 | City | Today/Concierge | P2 | OPEN | Keep routes |
| QA-305 | Notices | No deep link | P2 | OPEN | No href in data |
| QA-306 | A11y | No drawer focus trap | P2 | OPEN | — |
| QA-307 | Gallery | Footer gallery | P2 | OPEN | — |
| QA-308 | Handshake | Simulate accept | P2 | OPEN | One-device |
| QA-309 | Trust | Unverified only | P2 | OPEN | Honest |
| QA-310 | Plans | Demo only | P2 | OPEN | No Stripe |
| PL-001 | Infra | Shared DB | P0 product | OUT OF SCOPE | Backend |
| PL-005 | Files | Cloud | P1 product | PARTIAL | Local only |
| PL-014 | Trust | Verification workflow | P1 product | PARTIAL | UX honest |
| PL-015/022 | Plans | Billing | P1 product | PARTIAL / OPEN | Demo |
| PL-020 | Naming | contractor slug | P2 | PARTIAL | Owner |
| PL-021 | Privacy | Option lock | P2 | PARTIAL | (c) shipped |
