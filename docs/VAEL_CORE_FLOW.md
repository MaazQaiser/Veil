# THE CITY OF VAEL — Core flow (Media & Technology)

**Date:** 27 August 2026  
**Milestone:** Core VAEL experience  
**Principle:** Continue, don’t rebuild.  
**Runtime:** Local `mock*` keys in this browser. No Supabase, Stripe, SMS, or cloud files.

---

## 1. Current flow (this tree, before this milestone)

| Screen | State |
|---|---|
| Profile / edit / documents | **MISSING** |
| Veil In / Out listing | City shell only set a local veil flag — **no Board listing** |
| Matching Board / match detail | **MISSING** (`matching.ts` not in this kit) |
| Handshake / connection / messages | City `/messages` empty placeholder |
| Media & Technology | District **entry** only |

The 25 Aug 2026 live tree had the loop on `mockListings`, `mockConnections`, `matching.ts`. That clone is still not in this workspace. This milestone **reconstructs** the documented Rooms on the same keys and **Framing §8 weights**. It does not invent a second product.

### KEEP / IMPROVE / REBUILD UI / MISSING / BROKEN

| | |
|---|---|
| **KEEP** | City shell, tokens, `MatchPercent` / bands Strong ≥80 Good ≥60 Possible ≥40, Handshake-as-lock rule, 24h default, M&T-only fields |
| **IMPROVE** | Go Visible now continues into Veil; `/messages` is the same Handshake threads; profile sections |
| **REBUILD UI** | Board, match detail, Veil form, Handshake Room (the original pages were not in this tree) |
| **MISSING (still)** | Original `Board.tsx` sort file, `AuthProvider`, cloud attachments, verification workflow |
| **BROKEN (honest)** | Two devices cannot Handshake. Sample counterparts live on this device only |

---

## 2. Updated flow

```
Profile  →  Veil In/Out (24h VAEL)  →  Matching Board
    →  Match detail  →  Request Handshake
    →  both accept  →  Connection (reveal)  →  Message
```

City `/go-visible` → `/media-technology/veil`.  
`/media-technology/post-opportunity` → Veil Out.  
Legacy `/board`, `/profile/:username`, `/connections/:id` redirect into the Room.

---

## 3. Profile

Route: `/media-technology/profile/:username`  
Edit: `/media-technology/profile/:username/edit`

Sections: Identity, About, Capabilities, Experience, Credentials, Documents, Portfolio, Verification (**Unverified** only), Reputation (not modeled).

**PL-021 (Owner still open):** this kit implements option **(c)** — public handle / display name / headline; district payload after local sign-in. Rates and portfolio stay closed to the counterpart until Handshake `connected`. Not a silent change to fully open prototype details, and not Foundation-only (a). Labeled on the profile.

---

## 4. Veil

Route: `/media-technology/veil`

- Veil In = I am available  
- Veil Out = I need someone  
- Default `DEFAULT_DURATION_HOURS = 24`  
- Re-veil expires the current listing and publishes a new one  
- Status: none / active / expiring (≤4h, kit UI threshold) / expired  

---

## 5. VAEL creation

M&T fields only: category, discipline, capabilities, tools, certifications, location, remote/onsite, timing, experience years, engagement, budget proxy.

**PL-004:** description, requirements, contact, timeline are **local-only**. They are not columns on the Foundation `vaels` drawing. Labeled in the form.

---

## 6. Matching Board

Route: `/media-technology/board`

Hierarchy: **percent → why → availability/need → capabilities → location → See Match**.

Filters: band (All / Strong / Good / Possible), discipline. Desktop chips; mobile filter drawer.

Expired listings hidden. Own listing excluded. Ranked descending by percent.

Weights (protected, Framing §8): Discipline 22, Skills 10, Tools 9, Certifications 6, Location 10, Remote/Onsite 6, Timing 11, Experience 9, Engagement 6, Budget 5, Completeness 6. Empty-on-both-sides criteria are excluded and remaining weights renormalize (“when applicable, sum 100”).

---

## 7. Match detail

Route: `/media-technology/board/:listingId`

Answers who/what, why the %, what is available/needed, what is public now, what stays private, Request Handshake.

---

## 8. Handshake

Routes: `/media-technology/connections`, `/media-technology/connections/:id`

States: none (request), pending, incoming, declined, connected, closed, blocked.

Full profile + composer only when `connected`. Sample handles (`amercer`, `northlight`) can **Simulate counterpart accept (this device only)** so the loop is demonstrable without a second phone.

---

## 9. Connection

After mutual accept: status, revealed profile, conversation, close, block (local).

---

## 10. Messaging

Same `mtx_mock_messages_v1` from Handshake Room and City `/messages`. Local file name only — NOT YET CONNECTED to storage. No SMS/email/push.

---

## 11. States

| Area | Represented | Not represented |
|---|---|---|
| Profile | empty, incomplete, complete-enough, editing, saving, saved, error | Verified identity |
| Veil | none, active, expiring, expired, creating/saving, error | Paid extended duration |
| Matching | empty (no veil), matches, filtered empty, expired match detail | Async spinner (local store is sync); live multi-user board |
| Handshake | request, pending, incoming, declined, connected, closed, blocked | Cross-device accept |
| Messaging | empty, active, sending, failed, local attachment name | Cloud `stored` |

---

## 12. Responsive

Board cards stack; filters in a sheet below `md`. Handshake actions wrap. Message list scrolls. Room nav is a horizontal scroller. Shell breakpoints unchanged (320–1440+). The City layout uses `pb-[4.75rem]` below `lg` so primary actions, match cards, and the composer sit above the mobile dock.

---

## 13. Accessibility

Labeled fields, `MatchPercent` as `meter`, Handshake status as text + badge, dialogs/drawers, skip link from City shell, no color-only bands.

---

## 14. Components created/updated

**Created:** `matching.ts`, `vaelStore.ts`, `vaelCore.tsx`, `DistrictRoomNav`, `BoardMatchCard`, `RequireMember`, MT pages (home, how-it-works, board, match, veil, profile, handshake).

**Updated:** `App.tsx` routes, `CityShell` (Room nav + real unread badges), `CityLayout` (page content clears the mobile dock), City Go Visible / Messages / Notifications / Account, `HandshakeStatus` incoming/closed/blocked. Publishing a VAEL hydrates empty profile location/skills/tools/headline from the listing.

---

## 15. Known limitations

- Original `matching.ts` source is not in this repo; weights are transcribed, overlap math is a reconstruction.
- Sample listings are seeded once (`mtx_mock_core_seeded_v1`).
- Simulate counterpart is prototype-only.
- Connections do not auto-expire when a VAEL expires.
- PL-021 not closed by Owner.
- No Trucking Board.

---

## 16. Future districts

Copy the spine. Do **not** reuse these weights. Construction and Trucking need Owner field lists and a sibling engine.

**Recommended next milestone:** Construction Exchange (design + fields + sibling matching) **or** Owner close on PL-021 / PL-020 — not started here.
