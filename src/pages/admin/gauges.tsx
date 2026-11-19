import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

/** The one card look used across the admin: a soft gradient, a hairline border and a light top edge. */
export const CARD =
  "rounded-2xl border border-border/80 bg-gradient-to-b from-surface to-surface/70 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_14px_34px_-22px_rgba(0,0,0,0.75)]";

/** A single filled bar, for "how far along": 2 of 16 profiles finished. */
export function ProgressBar({ value, max, color, caption }: { value: number; max: number; color: string; caption?: string }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={caption ?? `${pct}%`}>
        <div className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%`, background: color }} />
      </div>
      {caption ? <p className="mt-2 text-caption text-muted">{caption}</p> : null}
    </div>
  );
}

/** A tiny line of how a number moved over the period. It is a picture of the trend, not a chart to read values from. */
export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const id = `spark-${useId().replace(/:/g, "")}`;
  const w = 100;
  const h = 36;
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data.map((value, index) => [index * step, h - 4 - (value / max) * (h - 10)] as const);
  // Gentle S-curves between points: flat tangents never dip below the baseline.
  const line = points
    .map(([x, y], index) => {
      if (index === 0) return `M${x.toFixed(1)} ${y.toFixed(1)}`;
      const [px, py] = points[index - 1];
      const mid = (x - px) / 2;
      return `C${(px + mid).toFixed(1)} ${py.toFixed(1)} ${(x - mid).toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const flat = data.every((value) => value === 0);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-9 w-full" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {flat ? null : <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={flat ? 0.35 : 1} />
    </svg>
  );
}

/** One line under a card's picture that says what each colour is, with the number first. */
export function Legend({ items }: { items: { label: string; value: number; color: string }[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-3.5 gap-y-0.5">
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          <span>
            <span className="font-semibold tabular-nums text-foreground">{item.value}</span> {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * How this period compares with the one just before it, as a small badge. The full sentence is on
 * hover. With nothing before it there is nothing to compare, so no badge is shown.
 */
export function DeltaChip({ value, previous, word, lowerIsBetter }: { value: number; previous: number; word: string; lowerIsBetter?: boolean }) {
  if (previous === 0) return null;
  const pct = Math.round(((value - previous) / previous) * 100);
  const up = pct > 0;
  const flat = pct === 0;
  const good = flat ? null : lowerIsBetter ? !up : up;
  return (
    <span
      title={`${previous} in the ${word} before`}
      className={cn(
        "inline-flex h-6 cursor-default items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold tabular-nums",
        good === null ? "bg-surface-muted text-muted" : good ? "bg-success-muted text-success" : "bg-destructive-muted text-destructive",
      )}
    >
      <span aria-hidden className="text-[9px]">
        {flat ? "–" : up ? "▲" : "▼"}
      </span>
      {Math.abs(pct)}%
    </span>
  );
}

/**
 * A status card. Every card has the same layout so the numbers line up across the row: the name and a
 * comparison badge on top, the number, a picture of it across the full width, and one line of legend.
 */
export function StatCard({
  icon,
  label,
  value,
  unit,
  chip,
  visual,
  legend,
  note,
  tint = "rgb(238 138 74)",
  to,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  unit?: string;
  /** The comparison badge, top right. */
  chip?: ReactNode;
  /** The picture: a trend line or a progress bar. */
  visual: ReactNode;
  legend: ReactNode;
  /** What is being counted, shown as a hover tip on the ⓘ so the card stays small. */
  note?: string;
  /** The card's own colour, used for its icon and a soft glow. */
  tint?: string;
  to?: string;
}) {
  const body = (
    <div className={cn(CARD, "group relative flex h-full flex-col overflow-hidden p-4 motion-safe:transition-all motion-safe:duration-200", to && "hover:-translate-y-0.5 hover:border-foreground/25")}>
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.13] blur-3xl motion-safe:transition-opacity group-hover:opacity-25" style={{ background: tint }} />
      <div className="relative flex h-full flex-col">
        <div className="flex min-h-[1.75rem] items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2" title={note}>
            <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg [&_svg]:h-4 [&_svg]:w-4" style={{ background: `color-mix(in srgb, ${tint} 16%, transparent)`, color: tint }}>
              {icon}
            </span>
            <p className="truncate text-body-sm font-medium text-muted">
              {label}
              {note ? (
                <span aria-label={note} title={note} className="ml-1.5 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border text-[10px] font-semibold text-muted">
                  i
                </span>
              ) : null}
            </p>
          </div>
          {chip}
        </div>
        <p className="mt-2.5 text-[2rem] font-semibold leading-none tracking-tight tabular-nums text-foreground">
          {value}
          {unit ? <span className="ml-1.5 text-body-sm font-medium tracking-normal text-muted">{unit}</span> : null}
        </p>
        <div className="mt-auto pt-3">
          <div className="flex h-9 items-end">{visual}</div>
          {legend}
        </div>
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
      {body}
    </Link>
  ) : (
    body
  );
}
