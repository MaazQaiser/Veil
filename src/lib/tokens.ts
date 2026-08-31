/** Token catalog used by tests and docs. Keep in sync with src/index.css. */

export const brand = {
  background: "#FDFCF9",
  surface: "#FFFFFF",
  surfaceMuted: "#F7F6F2",
  surfaceTertiary: "#F2F1ED",
  ink: "#111111",
  textSecondary: "#687385",
  textMuted: "#8A8F98",
  textDisabled: "#A7ABB1",
  border: "#E7E5DF",
  borderSubtle: "#EFEEE9",
  primaryHover: "#242424",
  accent: "#66758A",
  accentLight: "#E9EDF2",
  accentHover: "#586779",
  success: "#2F6B4F",
  successBg: "#EAF3ED",
  warning: "#8A6A2B",
  warningBg: "#F7F0DE",
  error: "#A44747",
  errorBg: "#F8EAEA",
} as const;

export const semanticTokenNames = [
  "background",
  "foreground",
  "surface",
  "surface-elevated",
  "surface-muted",
  "surface-tertiary",
  "border",
  "border-strong",
  "border-subtle",
  "primary",
  "primary-hover",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-muted",
  "success",
  "warning",
  "destructive",
  "info",
  "muted",
] as const;

export const typeRoles = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "body-lg",
  "body",
  "body-sm",
  "caption",
  "label",
  "button",
] as const;

export const matchBands = {
  strong: 80,
  good: 60,
  possible: 40,
} as const;

export function matchBand(percent: number): "strong" | "good" | "possible" | "low" {
  if (percent >= matchBands.strong) return "strong";
  if (percent >= matchBands.good) return "good";
  if (percent >= matchBands.possible) return "possible";
  return "low";
}

export const matchBandLabel: Record<ReturnType<typeof matchBand>, string> = {
  strong: "Strong",
  good: "Good",
  possible: "Possible",
  low: "Below band",
};

/** WCAG relative luminance for sRGB hex. */
export function relativeLuminance(hex: string): number {
  const raw = hex.replace("#", "");
  const n = parseInt(raw, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}
