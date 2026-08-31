# THE CITY OF VAEL — City Shell + Navigation

**Date:** 27 August 2026  
**Milestone:** City Shell + Navigation  
**Principle:** Continue, don’t rebuild.  
**Stack:** React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · react-router-dom v6  

This document records the City parent shell. District Rooms (Matching Board, Veil listing form, Handshake) are **not** in this milestone.

---

## Evidence boundary

This workspace is a merge-ready kit plus the City shell. The original live product tree was inspected 25 August 2026 (audit pack `00–06`). Routes below match that map. Media & Technology Board / Handshake / marketplace screens are **not** rebuilt here.

When merging into the canonical clone:

- Keep this shell’s navigation IA and tokens.
- Do **not** replace Media & Technology Rooms with the placeholder page in this kit.
- Re-bind `CitySessionProvider` to the existing `AuthProvider` / `useAuth` instead of keeping the local shell session if that store already exists.

---

## 1. Inspection — KEEP / IMPROVE / REPLACE

This tree did not contain the original `CityLayout`. What existed before this milestone:

| Surface | Decision |
|---|---|
| Design tokens (`src/index.css`, `tailwind.config.ts`) | **KEEP** |
| `Container`, `PageHeader`, `Breadcrumb`, `Badge`, `DistrictStatus`, `DistrictCard`, `Drawer`, `Button`, `EmptyState`, `ErrorState`, `LoadingState` | **KEEP** (wired into the shell) |
| Gallery `CityNav` (`src/components/vael/navigation.tsx`) | **KEEP** as kit demo chrome only (hash links). Not used by product routes. |
| Gallery `DistrictSwitcher` (native `<select>`) | **KEEP** as a controlled primitive for the gallery. Product chrome uses a route-aware switcher. |
| Hash-link gallery as `App` root | **REPLACE** — `App` now mounts `BrowserRouter` + City routes. Gallery lives at `/design-system`. |
| Original product `CityLayout` / `AuthProvider` / Media & Technology Board | **Not in this tree.** Do not invent those Rooms. Merge, don’t overwrite, when the clone is restored. |

Do not run two live navigation systems on product routes. Product chrome is `src/components/city/CityShell.tsx`.

---

## 2. Information architecture

```
VAEL CITY
│
├── Home              /
├── Feed              /feed
├── Search            /search
├── Go Visible        /go-visible
├── Districts         /districts
├── Notifications     /notifications
├── Messages          /messages
└── Account           /account
       ├── Visibility           /account/visibility
       └── Notification prefs   /account/notifications

DISTRICTS (Rooms inside the City)
├── Media & Technology   /media-technology     LIVE
├── Construction         /districts/contractor COMING SOON (registry name: Contractor)
├── Trucking             /districts/trucking   COMING SOON
├── Residential          /districts/residential FUTURE
└── Commercial           /districts/commercial  FUTURE
```

**City vs district:** City destinations have no Room context. District routes show a context bar: district name, lot status, and **Return to the City**. The switcher always lists The City plus the five primary lots.

---

## 3. Route structure

Mounted in `src/App.tsx` inside `CityLayout`:

| Path | Page | Notes |
|---|---|---|
| `/` | `HomePage` | City identity, local status, district discovery |
| `/feed` | `FeedPage` | Honest empty — no seeded posts |
| `/search` | `SearchPage` | Form only; no index |
| `/go-visible` | `GoVisiblePage` | Local veil In / Out / none. No Board listing |
| `/districts` | `DistrictsPage` | Primary five lots |
| `/districts/:slug` | `DistrictPlaceholderPage` | Coming Soon / Future / extra registry lots |
| `/media-technology` | `MediaTechnologyPage` | Live Room **entry only** — no Board |
| `/today` | `TodayPage` | Documented route kept |
| `/concierge` | `ConciergePage` | Documented route; not a live AI service |
| `/account` | `AccountPage` | Local continue / sign out |
| `/account/visibility` | `VisibilityPage` | Demo pricing labeled |
| `/account/notifications` | `NotificationPrefsPage` | In-app only; SMS/email/push NOT YET CONNECTED |
| `/notifications` | `NotificationsPage` | Empty; badge count stays 0 unless mocks merge |
| `/messages` | `MessagesPage` | Empty; no invented threads |
| `/extended-vael` | `ExtendedVaelPage` | DEMO PRICING |
| `/legal/terms` `/legal/privacy` `/legal/sms-terms` | `LegalPage` | Documented legal map |
| `/board` | redirect → `/media-technology` | Legacy city-prefix |
| `/design-system` | `DesignSystemGallery` | Outside CityLayout |
| `*` | `CityNotFoundPage` | Unknown City paths |

Extra registry lots (Healthcare, Equipment, Government, Real Estate, Legal & Finance) resolve via `/districts/:slug` as labeled placeholders. They are **not** in the primary switcher. Real Estate ≠ Residential.

---

## 4. Desktop navigation (`lg` and up)

Sticky city header (`data-surface="city"`):

- VAEL medallion + wordmark → `/`
- Text nav: Home, Feed, Search, Go Visible, Districts (`NavLink`, gold current page)
- District switcher
- Veil status (signed in and veiled; `xl+`)
- Icon links: Notifications, Messages, Account (badges only when counts > 0)

Messages, Notifications, and Account are icon destinations so the bar stays a product/network chrome, not an admin sidebar. The more-menu button is `lg:hidden`.

Height uses `--space-nav` / `h-nav` (3.75rem).

---

## 5. Mobile navigation

**Not a shrunk desktop bar.**

| Layer | Contents |
|---|---|
| Top | Brand, notifications, more (sheet) |
| Second row | District switcher (or district context + switcher on Room routes) |
| Bottom bar | Home, Search, Visible, Messages, Account — 44px+ targets, 5 columns |
| More sheet (`Drawer`, left) | Feed, Districts, Notifications, Today, Concierge |

Bottom bar uses `pb-[env(safe-area-inset-bottom)]`. Footer sits above it via `pb-[4.75rem] lg:pb-0`.

---

## 6. District context

`DistrictSwitcher` in `CityShell.tsx` (product):

- Lists **The City** + five primary lots
- Status labels: Live / Coming Soon / Future (and Early Access on extra lots)
- Navigates to existing routes, including Coming Soon placeholders
- Does **not** open a fake Board
- Construction display name = Construction; route remains `/districts/contractor` (PL-020)
- Escape, click-outside, and route change close the list
- Dropdown width `min(18rem, 100vw - 2rem)` so 320px does not overflow

`districtFromPath()` sets Room context for `/media-technology` and `/districts/:slug` only.

---

## 7. Responsive rules

| Width | Behavior |
|---|---|
| 320–767 | Bottom bar, compact header, switcher on second row, containers `px-4` |
| 768–1023 | Switcher in header; bottom bar remains until `lg` |
| 1024+ | Desktop text nav; bottom bar hidden; container `px-8` on default/wide |
| 1280+ | Veil chip in header when veiled |

`html { overflow-x: hidden }`. Shell and pages use `min-w-0`. No page should require horizontal scroll.

Page padding: `py-8 md:py-10` inside `CityPage` (except `width="full"`).

---

## 8. Reusable shell components

| Component | File | Role |
|---|---|---|
| `CityLayout` | `src/components/city/CityLayout.tsx` | Header + `<main id="main-content">` + footer + mobile bar offset |
| `CityShell` | `src/components/city/CityShell.tsx` | Skip link, header, mobile bar, more drawer |
| `DistrictSwitcher` | same | Route-aware City / lot control |
| `CityPage` | same | Wraps `Container` (`default` 72rem / `narrow` 40rem / `wide` 90rem / `full`) |
| `CityFooter` | same | Legal + design-system link |
| `PageHeader` | `src/components/ui/headers.tsx` | Kicker, title, description, crumbs, `actions`, `primaryAction`, `secondaryAction` |
| `Container` | `src/components/ui/layout.tsx` | Tokenized max-width + padding |
| District registry | `src/lib/districts.ts` | Primary lots + extra registry lots |
| `CitySessionProvider` | `src/lib/citySession.tsx` | localStorage handle + veil; unread counts default **0** |

---

## 9. City Home (this milestone only)

Home establishes identity; it is **not** the finished product homepage.

- City kicker + display title + availability in one sentence
- Primary action: Go Visible
- Local user status or visitor copy
- Five district cards (Live vs Coming Soon / Future)
- Activity: honest empty state

No marketing hero stack. No dashboard widgets. No invented feed.

---

## 10. States (honest)

| State | How |
|---|---|
| Unauthenticated visitor | Default session. Home / Account / Go Visible explain local continue. |
| Authenticated (this device) | `Continue locally` writes `vael_city_shell_session_v1`. Not a new auth architecture. |
| Loading | `LoadingState` from the design system. No async City fetch in this shell, so it is not faked on screens. |
| Empty | Feed, Messages, Notifications, Today, Search-after-submit |
| Error | Unknown slug (`ErrorState`); unknown path (`CityNotFoundPage`) |
| Notification / message badges | Render only if counts > 0. Defaults are 0. |
| Coming Soon / Future district | Placeholder + status badge + warning. CTA is “View status”, not “Enter district”. |

---

## 11. Accessibility

- Skip link to `#main-content`
- `nav` landmarks: City (desktop), Primary mobile, Breadcrumb, More drawer as `dialog`
- `NavLink` current page (`aria-current="page"`)
- Icon destinations have `aria-label`
- District switcher: `aria-expanded`, `aria-controls`, `aria-label` including current context, option `aria-selected`
- Status is a text badge, not color alone
- Global `:focus-visible` ring from tokens
- Drawer and switcher close on Escape
- `prefers-reduced-motion` zeroes transitions in `src/index.css`
- District card links include name + lot status in the accessible name

---

## 12. Motion

Used only to clarify:

- Hover color on nav and icon links (`motion-safe:transition-colors`)
- Drawer slide (`motion-safe:transition-transform`)
- Overlay fade

No page-transition library. No decorative animation.

---

## 13. Implementation decisions

1. **Gallery stays at `/design-system`** so `/` can be City Home.
2. **Local session** is device-only, matching the prototype’s honest localStorage story. Unread counts are not invented.
3. **Go Visible does not create a listing.** It only sets veil In / Out / none on this device.
4. **Coming Soon lots are navigable** to an honest placeholder so switching works without appearing as a working Room.
5. **`/board` redirects to Media & Technology** (documented legacy prefix), not to a rebuilt Board.
6. **No Supabase, Stripe, SMS, or new matching.**
7. **No Construction / Trucking / Residential / Commercial Rooms.**

---

## 14. Responsive QA (27 August 2026)

Measured `documentElement.scrollWidth` vs `clientWidth` in the browser. No horizontal overflow at:

| Width | Nav | Overflow |
|---|---|---|
| 320 | Mobile bar + more + switcher row | none |
| 375 | Mobile | none |
| 390 | Mobile | none |
| 768 | Mobile bar; desktop text nav hidden | none |
| 1024 | Desktop text nav; mobile bar hidden | none |
| 1280 | Desktop + veil chip when veiled | none |
| 1440+ | Desktop | none |

Keyboard: skip link is first in the tab order; switcher and drawer close on Escape; `NavLink` exposes `aria-current="page"`.

---

## 15. Merge notes

When the canonical clone is restored:

1. Confirm `src/App.tsx` routes against this table.
2. Replace `MediaTechnologyPage` with the real nested Room routes (`/media-technology/board`, veil, handshake, …).
3. Point shell auth at existing `useAuth`.
4. Keep `CityShell` IA; do not reintroduce a generic admin sidebar.
5. Keep gallery `CityNav` out of product routes.
