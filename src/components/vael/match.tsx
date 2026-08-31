import { matchBand, matchBandLabel } from "@/lib/tokens";
import { cn } from "@/lib/cn";

export function MatchPercent({
  value,
  size = "md",
  className,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const band = matchBand(value);
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const label = matchBandLabel[band];
  const sizeClass =
    size === "lg" ? "text-[2.5rem] leading-none" : size === "sm" ? "text-h3 leading-none" : "text-h2 leading-none";

  return (
    <div
      className={cn("inline-flex flex-col gap-1", className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={`Match ${clamped} percent, ${label}`}
    >
      <p className={cn("font-semibold tracking-[-0.03em] text-foreground", sizeClass)}>{clamped}%</p>
      <span className="text-label text-accent">{label}</span>
    </div>
  );
}

export function MatchBreakdown({
  items,
}: {
  items: { label: string; score: number }[];
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const score = Math.max(0, Math.min(100, Math.round(item.score)));
        const hit = score >= 40;
        return (
          <li key={item.label} className="rounded-xl border border-border bg-surface px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-body-sm font-medium">{item.label}</span>
              <span className={cn("text-caption tabular-nums", hit ? "text-foreground" : "text-muted")}>
                {score}%
              </span>
            </div>
            <div
              className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-muted"
              role="meter"
              aria-label={`${item.label} ${score} percent`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={score}
            >
              <div
                className={cn("h-full rounded-full", hit ? "bg-accent" : "bg-border")}
                style={{ width: `${score}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
