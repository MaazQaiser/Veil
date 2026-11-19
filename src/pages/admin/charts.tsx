import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { CountRow } from "@/lib/adminStore";
import { CARD } from "./gauges";

/**
 * Charts for the admin Overview. Each kind is used for one job only:
 *  - LineTrend      a running total over time (is it growing?)
 *  - GroupedBars    counts per day or week, two things side by side (what happened, how often?)
 *  - CategoryBars   one row per category with its name written flat on the left, e.g. report reasons
 *  - StackedBars    one bar per category with its parts stacked inside, e.g. available and looking in each district
 *  - Donut          shares of a whole (what is it made of?)
 */

/**
 * Chart colours: three soft, earthy tones (and a spare) that share the same lightness, so none of them shouts on the
 * charcoal background. Each tone belongs to one kind of thing, everywhere on the page:
 *   orange (the product's accent)  what members do: listings, available
 *   slate blue                     the other side of it, and reports: connections, looking, reports
 *   sage green                     people: members, profiles, founding places
 * Sand is only a spare for a chart that needs a fourth part. Anything that is not data is a neutral grey.
 */
export const CHART = {
  orange: "rgb(238 138 74)",
  slate: "#7E92B2",
  sage: "#82AA92",
  sand: "#D9B99B",
} as const;

/** One colour per idea, used the same way in every card and chart on this page. */
export const COLOR = {
  members: CHART.sage,
  reports: CHART.slate,
  founding: CHART.sage,
  listings: CHART.orange,
  connections: CHART.slate,
  available: CHART.orange,
  looking: CHART.slate,
} as const;

/** For a chart with more than two parts. */
export const PALETTE = [
  CHART.orange,
  CHART.slate,
  CHART.sage,
  CHART.sand,
];

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () =>
      setSize({ width: node.clientWidth, height: node.clientHeight });
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/** A top for a zero-based axis with four steps on whole numbers: 4, 8, 20, 40, 100... */
function niceMax(value: number) {
  const target = Math.max(value, 4) / 4;
  const pow = 10 ** Math.floor(Math.log10(target));
  const step =
    [1, 2, 5, 10].map((m) => m * pow).find((m) => m >= target) ?? pow * 10;
  return step * 4;
}

const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    Date.parse(iso),
  );

/* ------------------------------------------------------------------ line: a running total */

export type TrendPoint = { date: string; value: number };

/**
 * The axis starts just below the lowest value, so a total that grows from 11 to 16 visibly grows, and
 * its ticks are always round numbers (5, 10, 15, 20) rather than odd ones (7, 12, 17).
 */
function axisFor(min: number, max: number) {
  const span = max - min;
  const floor = Math.max(0, min - Math.max(1, span * 0.15));
  const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  const step =
    steps.find(
      (candidate) =>
        Math.floor(floor / candidate) * candidate + candidate * 4 >= max,
    ) ?? steps[steps.length - 1];
  const lo = Math.floor(floor / step) * step;
  return { lo, hi: lo + step * 4, step };
}

export function LineTrend({
  points,
  color,
  yTitle,
  unit,
  weekly,
  legend,
  height = 240,
}: {
  points: TrendPoint[];
  color: string;
  /** A line above the chart naming what is drawn and its latest number, so it lines up with the bar chart beside it. */
  legend?: { label: string; total?: number };
  /** What the numbers on the vertical axis count. Leave out when the card title already says it. */
  yTitle?: string;
  /** Singular noun for the pop-up, e.g. "member". */
  unit: string;
  weekly?: boolean;
  height?: number;
}) {
  const [ref, size] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gradient = `area-${useId().replace(/:/g, "")}`;
  const values = points.map((point) => point.value);
  const { lo, hi, step } = axisFor(Math.min(...values), Math.max(...values));
  const pad = { l: 34, r: 8, t: 22, b: 28 };
  const w = Math.max(size.width, 260);
  const innerW = w - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  // Each point sits in the middle of its own slot, so the days line up with the bars in the chart beside it.
  const slot = innerW / Math.max(1, points.length);
  const x = (index: number) => pad.l + index * slot + slot / 2;
  const y = (value: number) =>
    pad.t + innerH - ((value - lo) / (hi - lo)) * innerH;
  const ticks = [0, 1, 2, 3, 4].map((n) => lo + step * n);
  const labelEvery = Math.max(1, Math.ceil(points.length / (w < 420 ? 4 : 8)));
  const line = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(point.value).toFixed(1)}`,
    )
    .join(" ");
  const showDots = points.length <= 14;

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.floor((event.clientX - box.left - pad.l) / slot);
    setHover(Math.min(points.length - 1, Math.max(0, index)));
  }

  const hovered = hover === null ? null : points[hover];

  return (
    <div>
      {legend ? (
        <ul aria-label="Line" className="mb-2 flex flex-wrap gap-x-5 gap-y-1">
          <li className="inline-flex items-center gap-1.5 text-caption text-muted">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: color }}
            />
            {legend.label}
            {legend.total !== undefined ? (
              <span className="font-semibold tabular-nums text-foreground">
                {legend.total}
              </span>
            ) : null}
          </li>
        </ul>
      ) : null}
      <div ref={ref} className="relative w-full" style={{ height }}>
        {size.width > 0 ? (
          <svg
            width={w}
            height={height}
            role="img"
            aria-label={yTitle ?? unit}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            className="touch-pan-y"
          >
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={pad.l}
                  x2={w - pad.r}
                  y1={y(tick)}
                  y2={y(tick)}
                  className="stroke-border-subtle"
                  strokeDasharray={tick === lo ? undefined : "3 4"}
                />
                <text
                  x={pad.l - 8}
                  y={y(tick) + 4}
                  textAnchor="end"
                  className="fill-muted"
                  fontSize="11"
                >
                  {tick}
                </text>
              </g>
            ))}
            {yTitle ? (
              <text
                x={0}
                y={12}
                textAnchor="start"
                className="fill-muted"
                fontSize="11"
              >
                {yTitle}
              </text>
            ) : null}
            {points.map((point, index) =>
              index % labelEvery === 0 ? (
                <text
                  key={point.date}
                  x={x(index)}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-muted"
                  fontSize="11"
                >
                  {dateLabel(point.date)}
                </text>
              ) : null,
            )}
            <path
              d={`${line} L${x(points.length - 1)} ${y(lo)} L${x(0)} ${y(lo)} Z`}
              fill={`url(#${gradient})`}
            />
            <path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {showDots
              ? points.map((point, index) => (
                  <circle
                    key={point.date}
                    cx={x(index)}
                    cy={y(point.value)}
                    r="3.5"
                    fill={color}
                    className="stroke-surface"
                    strokeWidth="1.5"
                  />
                ))
              : null}
            {points.length > 0 ? (
              <g>
                <circle
                  cx={x(points.length - 1)}
                  cy={y(values[values.length - 1])}
                  r="5.5"
                  fill={color}
                  className="stroke-surface"
                  strokeWidth="2.5"
                />
                <text
                  x={x(points.length - 1) - 10}
                  y={y(values[values.length - 1]) - 10}
                  textAnchor="end"
                  className="fill-foreground"
                  fontSize="12"
                  fontWeight="700"
                >
                  {values[values.length - 1]}
                </text>
              </g>
            ) : null}
            {hover !== null ? (
              <g>
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1={pad.t}
                  y2={pad.t + innerH}
                  className="stroke-foreground/25"
                />
                <circle
                  cx={x(hover)}
                  cy={y(points[hover].value)}
                  r="5"
                  fill={color}
                  className="stroke-surface"
                  strokeWidth="2"
                />
              </g>
            ) : null}
          </svg>
        ) : null}
        {hovered ? (
          <div
            className="pointer-events-none absolute top-1 z-10 w-40 rounded-xl border border-border bg-surface-elevated px-3 py-2 shadow-lg"
            style={{
              left: Math.min(Math.max(x(hover!) - 80, 0), Math.max(0, w - 160)),
            }}
          >
            <p className="text-caption font-medium text-muted">
              {weekly
                ? `Week of ${dateLabel(hovered.date)}`
                : dateLabel(hovered.date)}
            </p>
            <p className="mt-0.5 text-body-sm font-semibold text-foreground">
              {hovered.value} {hovered.value === 1 ? unit : `${unit}s`}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ grouped bars: counts per step */

export type BarPoint = { date: string; a: number; b: number };

/** A bar with a rounded top and a flat bottom, so it sits cleanly on the baseline. */
function topRounded(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, width / 2, height));
  return `M${x} ${y + height} V${y + r} Q${x} ${y} ${x + r} ${y} H${x + width - r} Q${x + width} ${y} ${x + width} ${y + r} V${y + height} Z`;
}

const dayAfter = (iso: string, days: number) =>
  new Date(Date.parse(iso) + days * 86400000).toISOString();

export function GroupedBars({
  points,
  series,
  stepDays = 1,
  height = 240,
}: {
  points: BarPoint[];
  /** Each series can carry its total, which is written in the legend. */
  series: [
    { label: string; color: string; total?: number },
    { label: string; color: string; total?: number },
  ];
  /** How many days each pair of bars covers: 1, 3 or 7. */
  stepDays?: number;
  height?: number;
}) {
  const [ref, size] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(
    Math.max(0, ...points.map((point) => Math.max(point.a, point.b))),
  );
  const pad = { l: 34, r: 8, t: 22, b: 28 };
  const w = Math.max(size.width, 260);
  const innerW = w - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const group = innerW / points.length;
  const barW = Math.max(4, Math.min(22, group * 0.34));
  const y = (value: number) => pad.t + innerH - (value / max) * innerH;
  const ticks = [0, 1, 2, 3, 4].map((n) => (max / 4) * n);
  const labelEvery = Math.max(1, Math.ceil(points.length / (w < 420 ? 4 : 8)));
  const showValues = points.length <= 14 && barW >= 9;

  const rangeText = (date: string) => {
    if (stepDays === 1) return dateLabel(date);
    if (stepDays === 7) return `Week of ${dateLabel(date)}`;
    return `${dateLabel(date)} – ${dateLabel(dayAfter(date, stepDays - 1))}`;
  };

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.floor((event.clientX - box.left - pad.l) / group);
    setHover(index >= 0 && index < points.length ? index : null);
  }

  const hovered = hover === null ? null : points[hover];

  return (
    <div>
      <ul aria-label="Bars" className="mb-2 flex flex-wrap gap-x-5 gap-y-1">
        {series.map((item) => (
          <li
            key={item.label}
            className="inline-flex items-center gap-1.5 text-caption text-muted"
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: item.color }}
            />
            {item.label}
            {item.total !== undefined ? (
              <span className="font-semibold tabular-nums text-foreground">
                {item.total}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <div ref={ref} className="relative w-full" style={{ height }}>
        {size.width > 0 ? (
          <svg
            width={w}
            height={height}
            role="img"
            aria-label="Bars"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            className="touch-pan-y"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={pad.l}
                  x2={w - pad.r}
                  y1={y(tick)}
                  y2={y(tick)}
                  className="stroke-border-subtle"
                  strokeDasharray={tick === 0 ? undefined : "3 4"}
                />
                <text
                  x={pad.l - 8}
                  y={y(tick) + 4}
                  textAnchor="end"
                  className="fill-muted"
                  fontSize="11"
                >
                  {tick}
                </text>
              </g>
            ))}
            {hover !== null ? (
              <rect
                x={pad.l + hover * group}
                y={pad.t}
                width={group}
                height={innerH}
                rx="6"
                className="fill-foreground/[0.05]"
              />
            ) : null}
            {points.map((point, index) => {
              const cx = pad.l + index * group + group / 2;
              const barsLeft = cx - barW - 1.5;
              return (
                <g key={point.date}>
                  {point.a > 0 ? (
                    <path
                      d={topRounded(
                        barsLeft,
                        y(point.a),
                        barW,
                        y(0) - y(point.a),
                        4,
                      )}
                      fill={series[0].color}
                    />
                  ) : null}
                  {point.b > 0 ? (
                    <path
                      d={topRounded(
                        cx + 1.5,
                        y(point.b),
                        barW,
                        y(0) - y(point.b),
                        4,
                      )}
                      fill={series[1].color}
                    />
                  ) : null}
                  {showValues && point.a > 0 ? (
                    <text
                      x={barsLeft + barW / 2}
                      y={y(point.a) - 5}
                      textAnchor="middle"
                      className="fill-foreground"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {point.a}
                    </text>
                  ) : null}
                  {showValues && point.b > 0 ? (
                    <text
                      x={cx + 1.5 + barW / 2}
                      y={y(point.b) - 5}
                      textAnchor="middle"
                      className="fill-foreground"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {point.b}
                    </text>
                  ) : null}
                  {index % labelEvery === 0 ? (
                    <text
                      x={cx}
                      y={height - 8}
                      textAnchor="middle"
                      className="fill-muted"
                      fontSize="11"
                    >
                      {dateLabel(point.date)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        ) : null}
        {hovered ? (
          <div
            className="pointer-events-none absolute top-0 z-10 w-48 rounded-xl border border-border bg-surface-elevated px-3 py-2 shadow-lg"
            style={{
              left: Math.min(
                Math.max(pad.l + hover! * group + group / 2 - 96, 0),
                Math.max(0, w - 192),
              ),
            }}
          >
            <p className="text-caption font-medium text-muted">
              {rangeText(hovered.date)}
            </p>
            {series.map((item, index) => (
              <p
                key={item.label}
                className="mt-1 flex items-center justify-between gap-3 text-caption text-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-[3px]"
                    style={{ background: item.color }}
                  />
                  {item.label}
                </span>
                <span className="font-semibold">
                  {index === 0 ? hovered.a : hovered.b}
                </span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ bars per category */

export type BarCategory = { id: string; name: string; values: number[] };

/**
 * One row per category (a district, a report reason). The name is written flat on the left, in full,
 * and the bars grow to the right. With several series the bars sit one above another in each row.
 */
export function CategoryBars({
  categories,
  series,
  axisTitle,
  empty,
  emptyTitle,
  labelWidth = "min(11rem, 42%)",
}: {
  categories: BarCategory[];
  series: { label: string; color: string }[];
  /** What the numbers along the bottom count. */
  axisTitle: string;
  /** Said when there is nothing to show. The chart still draws, with empty slots, so it reads as waiting rather than broken. */
  empty: string;
  emptyTitle?: string;
  labelWidth?: string;
}) {
  const all = categories.flatMap((category) => category.values);
  const nothing = all.every((value) => value === 0);
  const max = niceMax(Math.max(0, ...all));
  const ticks = [0, 1, 2, 3, 4].map((n) => (max / 4) * n);
  // Faint vertical lines at each quarter, so a bar's length can be read against the scale below.
  const grid =
    "linear-gradient(to right, rgb(var(--color-border-subtle)) 1px, transparent 1px)";
  const columns = `minmax(0, ${labelWidth}) minmax(0, 1fr)`;

  return (
    <div>
      {series.length > 1 ? (
        <ul aria-label="Bars" className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((item) => (
            <li
              key={item.label}
              className="inline-flex items-center gap-1.5 text-caption text-muted"
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: item.color }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative">
        <ul>
          {categories.map((category) => (
            <li
              key={category.id}
              className="grid items-center gap-x-4 border-b border-border-subtle/70 last:border-b-0"
              style={{ gridTemplateColumns: columns }}
              title={`${category.name}: ${series.map((item, index) => `${item.label} ${category.values[index]}`).join(" · ")}`}
            >
              <p
                className={cn(
                  "py-1.5 text-body-sm leading-tight",
                  category.values.every((value) => value === 0)
                    ? "text-muted"
                    : "text-foreground",
                )}
              >
                {category.name}
              </p>
              <div className="pr-8">
                <div
                  className="space-y-[3px] py-1.5"
                  style={{
                    backgroundImage: grid,
                    backgroundSize: "25% 100%",
                    backgroundRepeat: "repeat-x",
                  }}
                >
                  {category.values.every((value) => value === 0) ? (
                    nothing ? (
                      <span
                        aria-hidden
                        className="block h-2.5 w-full rounded-full border border-dashed border-muted/50"
                      />
                    ) : (
                      <span className="block text-caption tabular-nums text-muted/70">
                        0
                      </span>
                    )
                  ) : (
                    category.values.map((value, index) =>
                      value > 0 ? (
                        <div
                          key={series[index].label}
                          className="flex items-center gap-2"
                        >
                          <span
                            className="block h-2 shrink-0 rounded-full motion-safe:transition-[width] motion-safe:duration-500"
                            style={{
                              width: `${(value / max) * 100}%`,
                              minWidth: 4,
                              background: series[index].color,
                            }}
                          />
                          <span className="whitespace-nowrap text-caption font-semibold tabular-nums text-foreground">
                            {value}
                          </span>
                        </div>
                      ) : null,
                    )
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div
          className="mt-2 grid gap-x-4"
          style={{ gridTemplateColumns: columns }}
          aria-hidden
        >
          <span />
          <div className="pr-8">
            <div className="flex justify-between text-[11px] tabular-nums text-muted">
              {ticks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
            <p className="mt-1 text-center text-[11px] text-muted">
              {axisTitle}
            </p>
          </div>
        </div>
        {nothing ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-muted/30 px-4 py-3 text-center">
            {emptyTitle ? (
              <p className="text-body-sm font-semibold text-foreground">
                {emptyTitle}
              </p>
            ) : null}
            <p
              className={cn("text-caption text-muted", emptyTitle && "mt-0.5")}
            >
              {empty}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ stacked bars: parts of a total */

export type StackedCategory = {
  id: string;
  name: string;
  parts: number[];
  /** Full wording for the hover tip when the name is shortened. */ title?: string;
};

/**
 * One bar per category, with the parts stacked inside it. The length of the whole bar is the total, and
 * the colours show what it is made of, so a bar with a single colour is easy to spot.
 */
export function StackedBars({
  categories,
  series,
  axisTitle,
  empty,
  labelWidth = "min(11rem, 40%)",
}: {
  categories: StackedCategory[];
  series: { label: string; color: string }[];
  axisTitle: string;
  empty: string;
  labelWidth?: string;
}) {
  const totals = categories.map((category) =>
    category.parts.reduce((sum, part) => sum + part, 0),
  );
  const nothing = totals.every((total) => total === 0);
  const max = niceMax(Math.max(0, ...totals));
  const ticks = [0, 1, 2, 3, 4].map((n) => (max / 4) * n);
  const grid =
    "linear-gradient(to right, rgb(var(--color-border-subtle)) 1px, transparent 1px)";
  const columns = `minmax(0, ${labelWidth}) minmax(0, 1fr)`;

  return (
    <div>
      <ul aria-label="Bars" className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
        {series.map((item) => (
          <li
            key={item.label}
            className="inline-flex items-center gap-1.5 text-caption text-muted"
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: item.color }}
            />
            {item.label}
          </li>
        ))}
      </ul>

      <ul>
        {categories.map((category, rowIndex) => {
          const total = totals[rowIndex];
          const used = category.parts
            .map((part, index) => ({ part, index }))
            .filter((item) => item.part > 0);
          return (
            <li
              key={category.id}
              className="grid items-center gap-x-4 border-b border-border-subtle/70 last:border-b-0"
              style={{ gridTemplateColumns: columns }}
              title={`${category.name}: ${series.map((item, index) => `${item.label} ${category.parts[index]}`).join(" · ")} · Total ${total}`}
            >
              <p
                className={cn(
                  "py-2.5 text-body-sm leading-tight",
                  total === 0 ? "text-muted" : "text-foreground",
                )}
              >
                {category.name}
              </p>
              <div className="pr-8">
                <div
                  className="py-2.5"
                  style={{
                    backgroundImage: grid,
                    backgroundSize: "25% 100%",
                    backgroundRepeat: "repeat-x",
                  }}
                >
                  {total === 0 ? (
                    <span className="block text-caption tabular-nums text-muted/70">
                      0
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-3.5 shrink-0 gap-[2px]"
                        style={{
                          width: `${(total / max) * 100}%`,
                          minWidth: 8,
                        }}
                      >
                        {used.map((item, position) => (
                          <span
                            key={series[item.index].label}
                            className={cn(
                              "h-full motion-safe:transition-[flex-grow] motion-safe:duration-500",
                              used.length === 1
                                ? "rounded-full"
                                : position === 0
                                  ? "rounded-l-full rounded-r-[3px]"
                                  : position === used.length - 1
                                    ? "rounded-l-[3px] rounded-r-full"
                                    : "rounded-[3px]",
                            )}
                            style={{
                              flexGrow: item.part,
                              flexBasis: 0,
                              background: series[item.index].color,
                            }}
                          />
                        ))}
                      </div>
                      <span className="whitespace-nowrap text-caption font-semibold tabular-nums text-foreground">
                        {total}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div
        className="mt-2 grid gap-x-4"
        style={{ gridTemplateColumns: columns }}
        aria-hidden
      >
        <span />
        <div className="pr-8">
          <div className="flex justify-between text-[11px] tabular-nums text-muted">
            {ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
          <p className="mt-1 text-center text-[11px] text-muted">{axisTitle}</p>
        </div>
      </div>
      {nothing ? (
        <p className="mt-3 text-center text-caption text-muted">{empty}</p>
      ) : null}
    </div>
  );
}

/**
 * Districts side by side, each a stacked column. The names sit under the columns in plain horizontal
 * text, wrapped onto two lines when needed. On a narrow screen there is no room for ten columns, so it
 * falls back to the row version.
 */
export function StackedColumns({
  categories,
  series,
  axisTitle,
  empty,
  height = 150,
  minWidth = 640,
}: {
  categories: StackedCategory[];
  series: { label: string; color: string }[];
  axisTitle: string;
  empty: string;
  height?: number;
  /** Below this width the chart falls back to rows. */
  minWidth?: number;
}) {
  const [ref, size] = useSize<HTMLDivElement>();
  const totals = categories.map((category) =>
    category.parts.reduce((sum, part) => sum + part, 0),
  );
  const nothing = totals.every((total) => total === 0);
  const max = niceMax(Math.max(0, ...totals));
  const ticks = [0, 1, 2, 3, 4].map((n) => (max / 4) * n);
  const narrow = size.width > 0 && size.width < minWidth;
  const columns = `repeat(${categories.length}, minmax(0, 1fr))`;

  if (narrow)
    return (
      <div ref={ref}>
        <StackedBars
          categories={categories}
          series={series}
          axisTitle={axisTitle}
          empty={empty}
        />
      </div>
    );

  return (
    <div ref={ref}>
      <ul aria-label="Bars" className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
        {(series.length > 1 ? series : []).map((item) => (
          <li
            key={item.label}
            className="inline-flex items-center gap-1.5 text-caption text-muted"
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: item.color }}
            />
            {item.label}
          </li>
        ))}
        <li className="ml-auto text-caption text-muted">{axisTitle}</li>
      </ul>

      <div className="flex gap-2">
        <div className="relative w-6 shrink-0" style={{ height }} aria-hidden>
          {ticks.map((tick, index) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2 text-[11px] tabular-nums leading-none text-muted"
              style={{ top: `${100 - index * 25}%` }}
            >
              {tick}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height }}>
            {ticks.map((tick, index) => (
              <span
                key={tick}
                aria-hidden
                className={cn(
                  "absolute inset-x-0 border-t",
                  index === 0
                    ? "border-border-subtle"
                    : "border-dashed border-border-subtle/70",
                )}
                style={{ top: `${100 - index * 25}%` }}
              />
            ))}
            <div
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: columns }}
            >
              {categories.map((category, rowIndex) => {
                const total = totals[rowIndex];
                const used = category.parts
                  .map((part, index) => ({ part, index }))
                  .filter((item) => item.part > 0);
                return (
                  <div
                    key={category.id}
                    className="flex h-full flex-col items-center justify-end px-1.5"
                    title={`${category.title ?? category.name}: ${series.map((item, index) => `${item.label} ${category.parts[index]}`).join(" · ")} · Total ${total}`}
                  >
                    {total > 0 ? (
                      <>
                        <span className="mb-1 text-caption font-semibold tabular-nums leading-none text-foreground">
                          {total}
                        </span>
                        <div
                          className="flex w-full max-w-[34px] flex-col-reverse gap-[2px] motion-safe:transition-[height] motion-safe:duration-500"
                          style={{
                            height: `${(total / max) * 100}%`,
                            minHeight: 6,
                          }}
                        >
                          {used.map((item, position) => (
                            <span
                              key={series[item.index].label}
                              className={cn(
                                "w-full",
                                position === used.length - 1
                                  ? "rounded-t-[5px] rounded-b-[2px]"
                                  : "rounded-[2px]",
                              )}
                              style={{
                                flexGrow: item.part,
                                flexBasis: 0,
                                background: series[item.index].color,
                              }}
                            />
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {nothing ? (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <p className="max-w-[26rem] rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-center text-caption text-muted">
                  {empty}
                </p>
              </div>
            ) : null}
          </div>
          <div className="mt-2 grid" style={{ gridTemplateColumns: columns }}>
            {categories.map((category, index) => (
              <p
                key={category.id}
                className={cn(
                  "px-1 text-center text-[11px] leading-tight",
                  totals[index] === 0 ? "text-muted" : "text-foreground",
                )}
              >
                {category.name}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ donut: shares of a whole */

/**
 * A donut: how a whole splits into parts. It is only used for two to five parts. Each part keeps the
 * colour it has everywhere else on the page, so pass the colours in rather than relying on an order.
 */
export function Donut({
  rows,
  colors,
  centerLabel,
  empty,
  size = 148,
}: {
  rows: CountRow[];
  colors?: string[];
  centerLabel: string;
  empty: string;
  size?: number;
}) {
  const [active, setActive] = useState<string | null>(null);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const stroke = Math.round(size * 0.12);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const colorOf = (index: number) =>
    colors?.[index] ?? PALETTE[index % PALETTE.length];
  const gap = rows.filter((row) => row.count > 0).length > 1 ? 4 : 0;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={centerLabel}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="stroke-surface-muted"
          />
          {rows.map((row, index) => {
            const length = total === 0 ? 0 : (row.count / total) * c;
            const drawn = Math.max(0, length - gap);
            const node =
              length > 0 ? (
                <circle
                  key={row.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={colorOf(index)}
                  strokeWidth={active === row.id ? stroke + 4 : stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${drawn} ${c - drawn}`}
                  strokeDashoffset={-(offset + gap / 2)}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  opacity={active && active !== row.id ? 0.35 : 1}
                  className="motion-safe:transition-all motion-safe:duration-200"
                  onPointerEnter={() => setActive(row.id)}
                  onPointerLeave={() => setActive(null)}
                />
              ) : null;
            offset += length;
            return node;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[1.9rem] font-semibold leading-none tabular-nums text-foreground">
            {total}
          </span>
          <span className="mt-1 text-caption text-muted">
            {total === 0 ? "none yet" : centerLabel}
          </span>
        </div>
      </div>
      <div className="w-full min-w-0">
        <ul>
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 border-t border-border-subtle/70 py-2.5 text-body-sm"
              onPointerEnter={() => setActive(row.id)}
              onPointerLeave={() => setActive(null)}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: colorOf(index) }}
                />
                <span className="truncate text-foreground">{row.name}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold text-foreground">
                  {row.count}
                </span>
                <span className="ml-2 text-caption text-muted">
                  {total === 0 ? 0 : Math.round((row.count / total) * 100)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
        {total === 0 ? (
          <p className="border-t border-border-subtle/70 pt-3 text-center text-caption text-muted">
            {empty}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ range switch + card */

export function RangeSwitch<T extends number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Time range"
      className="inline-flex rounded-full border border-border bg-surface p-1"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "h-7 rounded-full px-3 text-caption font-medium motion-safe:transition-colors",
            value === option.id
              ? "bg-accent text-[#1A1410]"
              : "text-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** A card that asks one question as its title, says in one line what the chart shows, and holds the chart. */
export function ChartCard({
  title,
  hint,
  aside,
  children,
  className,
}: {
  title: string;
  hint?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(CARD, "flex flex-col p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-body font-semibold text-foreground">{title}</h2>
          {hint ? (
            <p className="mt-0.5 text-caption leading-snug text-muted">
              {hint}
            </p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        {children}
      </div>
    </section>
  );
}
