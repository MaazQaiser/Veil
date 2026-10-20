# Product light / dark theme

Scope: the signed-in product only (Vael In, Vael Out, Opportunities, Matches, Messages, Community, Account). The public website stays as it is.

## How it works
- One preference, `vael_theme_v1` (`"dark"` | `"light"`), held by `ThemeProvider` in `src/lib/theme.tsx`. Default is dark, which is today's look.
- `CityLayout` sets `data-theme` to that preference on every product route (`isDarkModeFlowPath`). Website routes never get a `data-theme`.
- `index.css` has two token blocks: `[data-theme="dark"]` (existing) and `[data-theme="light"]` (new). Components read semantic tokens (`bg-surface`, `text-foreground`, `bg-accent` ...), so most of the UI follows with no changes.
- The shape language (14px controls, 20px cards, pill CTAs) is shared by both themes via `:is([data-theme="dark"], [data-theme="light"])`.
- Tailwind `dark:` variants keep working for dark only (`darkMode` selector is `[data-theme="dark"]`).

## Light palette
Warm white page, white cards with a soft border and shadow, near-black text, same orange accent as dark. Accent text uses a slightly deeper orange so it passes 4.5:1 on white.

## Switcher
A sun/moon button in the product top bar (next to notifications), so it is on every dashboard page: Vael In, Vael Out and Opportunities.

## Clean-up
Product files that hardcoded the old gold (`#FFC555`, `#C99A28`) or dark-only colours are moved to tokens so light mode is not a mix of gold and orange.

## Checklist
- [ ] Toggle persists across reload
- [ ] Vael In home, Vael Out home, Matches, Opportunities, Messages, Community, Account in both themes
- [ ] Website pages unaffected
