import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CARD } from "./gauges";

export function AdminPageHeader({ title, lede, action }: { title: string; lede?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-h2 font-semibold text-foreground">{title}</h1>
        {lede ? <p className="mt-1.5 max-w-2xl text-body text-muted">{lede}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  aside,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn(CARD, className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <h2 className="text-body font-semibold text-foreground">{title}</h2>
          {aside}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  to,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "accent";
  to?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface px-5 py-4",
        tone === "accent" ? "border-accent/40 bg-accent/[0.06]" : "border-border",
      )}
    >
      <p className="text-caption font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("mt-1.5 text-h2 font-semibold leading-none", tone === "accent" ? "text-accent" : "text-foreground")}>{value}</p>
      {hint ? <p className="mt-2 text-caption text-muted">{hint}</p> : null}
      {to ? <div className="mt-2">{to}</div> : null}
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "waiting" | "done" | "warn" | "bad" | "muted"; children: ReactNode }) {
  const styles = {
    waiting: "bg-accent/15 text-accent",
    done: "bg-success-muted text-success",
    warn: "bg-warning-muted text-warning",
    bad: "bg-destructive-muted text-destructive",
    muted: "bg-surface-muted text-muted",
  } as const;
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-caption font-medium", styles[tone])}>{children}</span>
  );
}

export function EmptyPanel({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
      <p className="text-body-lg font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-body-sm text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-6 overflow-x-auto border-b border-border-subtle">
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "-mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 text-body-sm font-medium motion-safe:transition-colors",
            value === item.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground",
          )}
        >
          {item.label}
          {item.count !== undefined ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-caption",
                value === item.id ? "bg-accent/15 text-accent" : "bg-surface-muted text-muted",
              )}
            >
              {item.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function whenText(iso: string) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(ms);
}

/** A button-looking radio card used for choices where each option needs a sentence of explanation. */
export function ChoiceCard({
  checked,
  onSelect,
  title,
  hint,
  name,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  hint: string;
  name: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 motion-safe:transition-colors",
        checked ? "border-accent bg-accent/[0.07]" : "border-border hover:border-foreground/30",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          checked ? "border-accent" : "border-foreground/40",
        )}
      >
        {checked ? <span className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-body-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-caption text-muted">{hint}</span>
      </span>
    </label>
  );
}
