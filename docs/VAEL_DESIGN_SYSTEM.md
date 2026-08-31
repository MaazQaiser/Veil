# THE CITY OF VAEL — Design System

**Date:** 27 August 2026  
**Milestone:** Phase 1 — Visual system  
**Principle:** Continue, don’t rebuild. Evolve the existing charcoal / gold / paper identity.  
**Stack:** React 18 · TypeScript · Vite 5 · Tailwind CSS 3  

This document is the working design system for THE CITY OF VAEL. It is meant to be used consistently across City, Media & Technology, Construction, Trucking, Residential, Commercial, Community, Account, Profile, Handshake, and Messaging — **one product**, different district data.

---

## Evidence boundary

The canonical product tree (`src/App.tsx`, live City routes, `design/VAEL_DESIGN_SYSTEM.md` from the original prototype) was **not present** in this workspace. Milestone 1 (25 August 2026) inspected that tree. Brand primitives were transcribed from:

- `milestone-1/assets/audit.css` (explicitly “per the design system”)
- `milestone-1/assets/vael-medallion.png`
- `docs/VAEL_UX_FOUNDATION.md`

This kit implements tokens + components + a **gallery only**. It does not redesign Home, Board, or any product Room. When the product clone is restored, merge `src/index.css`, `tailwind.config.ts`, and `src/components/{ui,vael}` into that tree. Do **not** replace `CityLayout` or Media & Technology pages with the gallery.

---

## 1. Design principles

1. **One City.** Districts change fields and matching weights, not visual identity.
2. **Civic, not SaaS.** Charcoal gate, paper Rooms, gold as metal — not a purple dashboard.
3. **Editorial hierarchy.** Serif for place names; sans for work. Kickers are uppercase and spare.
4. **Honest state.** Coming Soon, NOT YET CONNECTED, Unverified, and demo pricing stay labeled.
5. **Percentage is an instrument.** Match % is a seal, not a KPI sparkline.
6. **Handshake is a lock.** Full profiles stay closed until both parties accept.
7. **Function over trend.** No glassmorphism stacks, no rainbow district brands, no fake AI chrome.
8. **Semantic color.** Components use `bg-surface` / `text-foreground`, not raw hex.
9. **Don’t communicate by color alone.** Status always includes a text label.
10. **Continue.** Do not retune Media & Technology matching weights. Do not invent Construction UI here.

### KEEP / IMPROVE / REPLACE / MISSING

| | |
|---|---|
| **KEEP** | Gold `#c4890a` / bright `#e9a20b` / deep `#8a5a00`; navy `#0a1015`; paper `#f7f4ec`; Palatino display; Avenir Next UI; medallion; lot badges Live / Coming Soon / Early Access; match bands Strong ≥80, Good ≥60, Possible ≥40; 24-hour Veil default; Tailwind |
| **IMPROVE** | Map primitives onto semantic tokens; tighten radius (2/4/6px); form labels (never placeholder-as-label); focus rings; card hierarchy; city vs room surfaces |
| **REPLACE** | Nothing of the brand. Do not replace product screens in this milestone |
| **MISSING in the inspected product** | Shared primitive library; documented type scale; empty/loading/error kit; MatchPercent component; verification **state**; responsive nav spec |

---

## 2. Color tokens

Primitives live in `src/index.css` as `--vael-*`. Components must use **semantic** Tailwind classes.

### Semantic (Room / paper — default)

| Token | Tailwind | RGB channels | Role |
|---|---|---|---|
| background | `bg-background` | 247 244 236 | Room canvas |
| foreground | `text-foreground` | 18 22 26 | Body text |
| surface | `bg-surface` | 255 252 246 | Cards |
| surface elevated | `bg-surface-elevated` | 255 255 255 | Menus, dialogs |
| surface muted | `bg-surface-muted` | 239 232 214 | Recessed |
| border | `border-border` | 217 201 160 | Hairline |
| border strong | `border-border-strong` | 196 177 131 | Emphasis |
| primary | `bg-primary` | 196 137 10 | Gold action |
| primary hover | `bg-primary-hover` | 233 162 11 | Hover gold |
| primary foreground | `text-primary-foreground` | 10 16 21 | Text on gold |
| secondary | `bg-secondary` | 10 16 21 | Navy action |
| accent | `text-accent` | 138 90 0 | Kickers, deep gold |
| success | `bg-success` | 31 107 67 | Live / connected |
| warning | `bg-warning` | 154 91 0 | Soon / expiring |
| destructive | `bg-destructive` | 139 30 30 | Error / decline |
| info | `bg-info` | 29 74 110 | Early Access |
| muted | `text-muted` | 92 100 108 | Meta |

### City chrome

Set `data-surface="city"` on the shell. Background becomes navy; foreground becomes cover `#f4f4f2`; borders become gold-tinted. **Body text on city chrome is cover-on-navy, not gold.** Gold is for kickers, rules, and primary buttons.

### Contrast

| Pair | Use | AA body (4.5:1) |
|---|---|---|
| Ink on paper | Room body | Pass (~16.5) |
| Cover on navy | City body | Pass (~17.4) |
| Muted on paper | Captions | Pass (~5.5) |
| Gold / gold-bright on navy | Kickers, buttons, rules | Pass for text (~6.3 / ~8.8) — still not for long body copy |
| Gold-deep on navy | Borders / metal only | Fail (~3.2) — never small text |

---

## 3. Typography

| Role | Class / size | Family | Weight | Line height | Tracking |
|---|---|---|---|---|---|
| Display | `.vael-display` / `text-display` 2.5rem | Palatino (`font-display`) | 600 | 1.15 | 0.02em |
| H1 | `.vael-h1` 2rem | display | 600 | 1.2 | 0.01em |
| H2 | `.vael-h2` 1.5rem | display | 600 | 1.25 | 0 |
| H3 | `.vael-h3` 1.25rem | display | 600 | 1.3 | 0 |
| H4 | `.vael-h4` 1.125rem | display | 600 | 1.35 | 0.02em |
| Body large | `text-body-lg` 1.125rem | sans | 400 | 1.5 | 0 |
| Body | `text-body` 1rem | sans | 400 | 1.5 | 0 |
| Body small | `text-body-sm` 0.875rem | sans | 400 | 1.45 | 0 |
| Caption | `text-caption` 0.75rem | sans | 400 | 1.4 | 0 |
| Label / kicker | `.vael-kicker` 0.75rem | sans | 700 | 1.3 | 0.16em uppercase |
| Button | `text-button` 0.875rem | sans | 600 | 1.2 | 0.04em |

Sans stack: `"Avenir Next", "Segoe UI", Helvetica, Arial, sans-serif`.  
Display stack: `Palatino, "Palatino Linotype", "Iowan Old Style", Georgia, serif`.

Do not switch the product to Inter. Do not use serif for form labels.

---

## 4. Spacing

Use Tailwind’s 4px scale. Recommended usage:

| Context | Tokens |
|---|---|
| Page padding | `px-4 md:px-6 lg:px-8` (also `.vael-container`) |
| Section spacing | `py-10 md:py-12` |
| Card padding | `p-4` compact / `p-5` default |
| Form fields | `gap-1.5` label→control; `gap-4` between fields |
| Component clusters | `gap-2` tight, `gap-4` default, `gap-8` sections |
| Navigation height | `h-nav` (3.75rem) |
| Mobile page | keep `px-4`; never drop below 16px page gutter |

Avoid one-off values like `13px` or `p-[18px]`.

---

## 5. Layout

| Primitive | Class / component | Behavior |
|---|---|---|
| Page container | `.vael-container` / `<Container>` | max 72rem |
| Narrow (forms, legal) | `.vael-container-narrow` | max 40rem |
| Wide (shell, board) | `.vael-container-wide` | max 90rem |
| Sidebar + content | `<Split>` | `lg:grid-cols-[16rem_1fr]`; sidebar stacks first on small screens |
| Two columns | `<TwoCol>` | 1 col → 2 from `md` |
| Three columns | `<ThreeCol>` | 1 → 2 (`sm`) → 3 (`xl`) |
| Stack | `<Stack>` | vertical rhythm |

The City should feel spacious without empty dashboard margins. Prefer a dense Board over a hero that wastes the fold.

There is **no persistent app sidebar** on City Home. Sidebars are Room tools (filters) and become **drawers** below `lg`.

---

## 6. Border / radius

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 2px | badges |
| `rounded-md` | 4px | buttons, inputs, chips |
| `rounded-lg` | 6px | cards, dialogs |
| `rounded-full` | pill | avatar, switch only |

Do not use `rounded-2xl` / `rounded-3xl` on product cards.

Borders are warm gold-paper (`border-border`), not cool grey.

---

## 7. Shadows / elevation

| Token | Use |
|---|---|
| none + border | Default cards on paper |
| `shadow-sm` | Inputs, resting cards that need a hair more lift |
| `shadow-md` | Dialogs, dropdowns, drawers |
| `shadow-gold` | Medallion / primary on city chrome only |

Do not stack heavy drop shadows. Elevation is a closed door or an open menu, not decoration.

---

## 8. Components

All primitives: `src/components/ui`. VAEL patterns: `src/components/vael`. Import from the barrels.

### Primitives

| Component | Notes |
|---|---|
| `Button` | primary / secondary / outline / ghost / destructive; sm/md/lg; `loading` |
| `IconButton` | requires `label` (accessible name) |
| `Input` `Textarea` `Select` | native controls, styled; `aria-invalid` |
| `Checkbox` `Radio` `Switch` | label is required |
| `Field` `Label` | hint + error; required asterisk + sr-only “required” |
| `Badge` | default, gold, live, soon, early, outline, muted |
| `Avatar` | initials fallback |
| `Card` + header/body/footer | base surface; district/listing/match extend it |
| `Stat` | civic figure, not a dashboard widget |
| `Tabs` | roving selection, tabpanel ids |
| `Breadcrumb` `PageHeader` `SectionHeader` | Room chrome |
| `Dialog` | native `<dialog>` |
| `Drawer` | filters / mobile nav overflow |
| `Dropdown` `Tooltip` | menus; tooltip on hover and focus |
| `Toast` `Alert` | status + text |
| `EmptyState` `LoadingState` `ErrorState` `Skeleton` | non-color feedback |
| `Pagination` | previous/next + “Page x of y” |
| `SearchInput` `FilterChip` `FilterBar` | Board/search tools |
| `CityNav` `DistrictSwitcher` | presentational; gallery uses hash links, not product routes |

### VAEL-specific

| Component | Purpose |
|---|---|
| `MatchPercent` | `role="meter"`; band label Strong/Good/Possible |
| `MatchBreakdown` | criteria bars (district fields passed in) |
| `VeilStatus` | In / Out / Expiring / Expired + hours left |
| `HandshakeStatus` | Request / Pending / Accepted / Declined / Connected |
| `VerificationState` | Unverified / Pending / Verified — Unverified is the honest default |
| `DistrictStatus` | Live / Coming Soon / Early Access |
| `ListingCard` `MatchCard` `ProfileCard` | different hierarchy, same language |
| `DistrictCard` `CommunityPostCard` `DocumentCard` `NotificationCard` | same |

Composition: a `MatchCard` is a `Card` + `MatchPercent` + actions. Do not fork a second card CSS file per district.

---

## 9. States

Every important control supports:

| State | How it is shown |
|---|---|
| Default | Resting border / gold primary |
| Hover | `primary-hover` or muted surface |
| Focus | `focus-visible` 2px ring (`--color-ring`) |
| Active | native `:active` + pressed buttons |
| Disabled | `opacity-50` + `cursor-not-allowed` + no pointer |
| Loading | spinner + `aria-busy` |
| Error | `aria-invalid`, destructive border, `role="alert"` text |
| Success | success alert / connected badge + copy |

Additional product states: **Empty**, **Expired** (reduced opacity + Expired badge), **Locked** (icon + “opens after Handshake”), **Pending** (badge + “waiting for both parties”).

Never use color as the only signal.

---

## 10. Responsive rules

Breakpoints: Tailwind `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280.

| Region | Mobile | Tablet | Desktop / large |
|---|---|---|---|
| City nav | Mark + utilities + menu; district line inside the menu | Mark + district + utilities; fewer text links | Full text links + district + utilities |
| Cards | Single column | Two where density allows | Three for district lots; match cards stay 1–2 cols |
| Filters | Drawer (`<Drawer>`) | Drawer or compact chip row | Chip row beside the Board |
| Split sidebar | Stacks above content | Stacks | Sticky 16rem rail |
| Tables (when used) | Convert to stacked definition lists — do not shrink columns | Horizontal scroll only if a table is unavoidable | Table ok for admin-like density, not for the Board |
| Forms | Full width, labels above | Two-col for short fields | Two-col; keep Veil long fields stacked |

Do not scale the whole desktop layout down. The Board is a list of match instruments, not a 12-column grid of widgets.

---

## 11. Accessibility rules

- Visible **labels** on every field. Placeholders are examples, not names.
- `IconButton` must have `label`.
- Focus is always a gold ring (`:focus-visible`). Mouse clicks do not leave a ring (`:focus:not(:focus-visible)`).
- Dialog uses `<dialog>` / `showModal()`. Drawer has `role="dialog"` and an overlay close control.
- Match percentage uses `role="meter"` and an accessible name that includes the band.
- Status badges include words (Live, Pending), not only a color chip.
- Hit targets for icon buttons are 40px (`h-10`).
- Do not put long body copy in gold. Deep gold (`#8a5a00`) on navy fails AA — borders only.
- Respect `prefers-reduced-motion` for future animation; current motion is limited to `animate-spin` on loaders and `animate-pulse` on skeletons.

---

## 12. VAEL-specific patterns

**City vs Room.** Chrome (`CityNav`) is `data-surface="city"`. Rooms are paper. Users always know they can return to the City.

**Veil.** Default 24 hours. Status: In, Out, Expiring, Expired. Re-veil is a product flow — this system only supplies the status chip.

**Match.** Bands are protected. Pass district-specific breakdown **labels** into `MatchBreakdown`; do not hardcode Media & Technology fields into the primitive.

**Handshake.** Pending hides full profile (`ProfileCard locked`). Connected is the private room. Do not show a chat composer on pending.

**District lots.** Live is enterable. Coming Soon and Early Access are disabled primary actions with honest labels. Do not draw a fake Board.

**Verification.** Ship `Unverified` as a real state. Do not imply a completed identity program.

**Utilities.** Copy for SMS/email/push and Extended VAEL stays NOT YET CONNECTED / DEMO PRICING.

---

## 13. Usage examples

```tsx
import { Button, Field, Input } from "@/components/ui";
import { MatchCard, VeilStatus } from "@/components/vael";

<Field htmlFor="handle" label="Handle" required hint="Unique in the City">
  <Input id="handle" name="handle" autoComplete="username" />
</Field>

<VeilStatus kind="in" hoursLeft={18} />

<MatchCard
  name="Northlight Studio"
  role="Seeking editor"
  percent={84}
  why="Strong on discipline and timing."
/>

<Button variant="outline">Request Handshake</Button>
```

Gallery (this workspace): run `npm run dev` and open `/`.  
After merge into the product: mount `<DesignSystemGallery />` on a **new unused route** only if the Owner wants an internal kit. Do not replace `/`.

---

## 14. Do / Don’t

**Do**

- Use semantic tokens (`bg-surface`, `text-muted`).
- Keep the medallion, gold rules, and serif titles.
- Label empty lots Coming Soon.
- Pass district fields into shared cards.
- Put filters in a drawer on small screens.

**Don’t**

- Introduce a second palette per district.
- Redesign Home, Board, or Construction in this milestone.
- Use gold for small body text on navy.
- Use placeholders as labels.
- Change `matching.ts` weights to “make the ring look better.”
- Connect Supabase, Stripe, SMS, or storage.
- Pretend Real Estate is Residential.
- Build a generic admin sidebar as the City shell.

---

## File map

| Path | Role |
|---|---|
| `src/index.css` | Tokens + type + containers |
| `tailwind.config.ts` | Semantic colors, type, radius, shadows |
| `src/lib/tokens.ts` | Catalog + contrast + match bands |
| `src/components/ui/*` | Primitives |
| `src/components/vael/*` | VAEL patterns |
| `src/gallery/DesignSystemGallery.tsx` | Kit gallery (not a product screen) |
| `public/vael-medallion.png` | Brand mark |

---

## Merge into the product clone

1. Copy tokens (`src/index.css` semantic block) into the existing `src/index.css` **without deleting** working product classes.
2. Extend the existing `tailwind.config` with the semantic colors; keep any product-specific keys.
3. Add `src/components/ui` and `src/components/vael` beside `src/components/city`.
4. Adopt primitives on **new** work first; do not restyle Media & Technology in the same change.
5. Do not change routing.

---

*THE CITY OF VAEL · Design System · 27 August 2026. Continue, don’t rebuild.*
