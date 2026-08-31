# THE CITY OF VAEL — Handoff

**Date:** 27 August 2026  
**Tree:** React 18 + TypeScript + Vite 5 + Tailwind 3 + react-router-dom v6  
**Principle:** Continue, don’t rebuild. Local prototype. No fake backends.

---

## DESIGN

### Design system

Working spec: `docs/VAEL_DESIGN_SYSTEM.md`  
Tokens: `src/index.css`, `src/lib/tokens.ts`  
Gallery (not product chrome): `/design-system`

Civic charcoal / gold / paper. Palatino for place names, Avenir Next for work. Match % is a seal. Handshake is a lock. Honest states stay labeled (Unverified, Coming Soon, NOT YET CONNECTED, DEMO PRICING).

### Tokens

Use semantic Tailwind: `bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `bg-primary`, `border-border`, status `success` / `warning` / `destructive` / `info`. City chrome: `data-surface="city"`. Do not paint components with raw hex.

### Component patterns

| Layer | Path |
|---|---|
| Primitives | `src/components/ui/*` |
| Product | `src/components/vael/*` |
| City chrome | `src/components/city/*` |
| District cards | `src/components/{mt,construction,trucking,residential,commercial}/*` |
| Community list | `src/components/community/*` |

Reuse `CityPage`, `PageHeader`, `EmptyState`, `ErrorState`, `Alert`, `Button` variants (one primary + outline/ghost), `Field` (never placeholder-as-label).

### Responsive rules

- Page gutter `px-4 md:px-6 lg:px-8`  
- Board filters: wrap on desktop, **drawer** below `md`  
- Plan comparison: stack, `md:grid-cols-2` — no desktop table on 320px  
- Bottom nav `lg:hidden`; desktop City nav `hidden lg:flex`  
- `html { overflow-x: hidden }`  
- Room nav may scroll horizontally at 320px  

### UX documentation

| Doc | Use |
|---|---|
| `VAEL_UX_FOUNDATION.md` | Original audit framing (pre-kit; do not treat as current route truth) |
| `VAEL_CITY_SHELL.md` | Shell IA |
| `VAEL_CORE_FLOW.md` | M&T spine |
| `VAEL_CONSTRUCTION_EXCHANGE.md` etc. | Per-Room fields |
| `VAEL_COMMUNITY.md` | Feed |
| `VAEL_TRUST_VISIBILITY.md` | Trust vs visibility vs demo plans |
| `VAEL_FINAL_QA.md` | This QA pass |

---

## FRONTEND

### Routes

Mounted in `src/App.tsx`. Full inventory: `docs/VAEL_FINAL_QA.md` §2.

**Live Rooms:** `/media-technology/*`, `/districts/contractor/*`, `/districts/trucking/*`, `/districts/residential/*`, `/districts/commercial/*`.

**Keep:** `/construction` → contractor; `/board` and `/profile/:username` → M&T; `/today`, `/concierge`, extra `/districts/:slug` placeholders.

### State behavior

| Store | Domain |
|---|---|
| `citySession.tsx` | Local signed-in handle |
| `vaelStore` / `vaelCore` | M&T listings, profiles, handshake, messages, notices |
| `constructionStore` / Core | Construction |
| `truckingStore` / Core | Trucking |
| `residentialStore` / Core | Residential |
| `commercialStore` / Core | Commercial |
| `communityStore` / Core | Posts, comments, likes, saves |

Matching: `matching.ts`, `constructionMatching.ts`, `truckingMatching.ts`, `residentialMatching.ts`, `commercialMatching.ts`. **Do not retune M&T weights.**

Privacy: public handle/name; district payload after local sign-in; rates/portfolio/private docs after Handshake `connected`.

Visibility: 24-hour `plan: "daily"`. Expired = stored listing past `expiresAt`. Extended VAEL does **not** change the clock.

### Known limitations

- One browser = one City  
- Handshake with a real second person is impossible until a shared Foundation exists (`simulateAccept` is sample-only)  
- Documents are `dataUrl` on device  
- Verification is Unverified only  
- Search has no index  
- Header session veil follows M&T when that Room is active; per-Room truth is `/account/visibility`  
- Notifications in `vaelStore` are the in-app inbox (not SMS/email/push)  
- No admin console  

---

## TESTING

| Check | Command | Last result (27 Aug 2026) |
|---|---|---|
| TypeScript | `npm run typecheck` | Pass |
| Tests | `npm test` | 44 passed (9 files) |
| Production build | `npm run build` | Pass (~516 kB JS chunk warning) |
| Lint | — | **No lint script** |

Responsive: 320px home/search/Construction Board — no horizontal overflow; 1280px Residential home. Accessibility: keyboard, focus-visible, labeled forms, status not color-only, reduced-motion.

---

## BACKEND DEPENDENCIES

**Not completed. Do not claim they are.**

| Need | Status |
|---|---|
| Supabase / shared DB | Not connected |
| RLS | Not in this kit |
| Storage (docs / chat files) | Not connected — local `dataUrl` only |
| Auth provider | Local handle only |
| Public APIs | None |
| SMS / email / push | NOT YET CONNECTED |
| Stripe / billing / invoices | Not connected — demo copy only |
| Search index | None |
| Identity verification | None |
| Admin / report service | None |
| Deployment / CI / hosting | None — no `.git` in this workspace copy |

Connecting any of the above requires a **Change Order**. Do not flip a flag and pretend Board/Handshake/Messages are live.

---

## OWNER DECISIONS STILL OPEN

| ID | Topic |
|---|---|
| PL-020 | Confirm Construction URL slug `contractor` |
| PL-021 | Confirm anonymous vs signed-in profile (option c is shipped) |
| PL-022 | Monetization — Extended remains demo |
| PL-023 | Extra districts beyond the five live Rooms |
| PL-025 | Communications cadence |

---

## HOW TO RUN

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`. Continue locally from Account. Veil in a live Room. Matching Board is opposite-side, 24-hour listings on this device.
