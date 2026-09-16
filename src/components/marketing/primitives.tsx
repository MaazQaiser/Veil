import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { FilterChip } from "@/components/ui/search";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import {
  AVAILABILITY_LABEL,
  type DirectoryPerson,
} from "@/lib/marketingDirectory";

export function PillCta({
  to,
  children,
  tone = "light",
  className,
}: {
  to: string;
  children: ReactNode;
  tone?: "light" | "dark" | "accent";
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex h-14 items-center gap-3 rounded-full py-1 pl-7 pr-1.5 text-[0.9375rem] font-medium motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] active:translate-y-0 active:shadow-none",
        tone === "light" && "bg-white text-[#0B0C0C]",
        tone === "dark" && "bg-[#0B0C0C] text-white",
        tone === "accent" && "bg-[#FACC15] text-[#0B0C0C]",
        className,
      )}
    >
      {children}
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
          tone === "accent" ? "bg-[#0B0C0C] text-white" : tone === "light" ? "bg-[#0B0C0C] text-white" : "bg-white text-[#0B0C0C]",
        )}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 17L17 7M17 7H9M17 7V15"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}

export function MatchBadge({ percent, className }: { percent: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-caption font-medium text-[#0B0C0C]",
        className,
      )}
    >
      {percent}% Match
    </span>
  );
}

export function PillEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-4 py-1.5 text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#CA8A04]" aria-hidden />
      {children}
    </span>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lede,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
}) {
  return (
    <header className={cn(align === "center" && "mx-auto max-w-3xl text-center")}>
      {eyebrow ? <p className="site-eyebrow">{eyebrow}</p> : null}
      <h2 className={cn("site-h2", eyebrow && "mt-4")}>{title}</h2>
      {lede ? <p className="site-lede mt-5 text-muted">{lede}</p> : null}
    </header>
  );
}

export function FlowStrip({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {steps.map((step, index) => (
        <li key={step} className="flex items-center gap-3">
          <span className="site-meta text-foreground">{step}</span>
          {index < steps.length - 1 ? (
            <span className="text-quiet" aria-hidden>
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function FilterChipRow({
  labels,
  active,
  onSelect,
}: {
  labels: string[];
  active?: string;
  onSelect?: (label: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {labels.map((label) => (
        <FilterChip
          key={label}
          label={label}
          active={active === label}
          onClick={onSelect ? () => onSelect(label) : undefined}
        />
      ))}
    </div>
  );
}

export function PersonCard({
  person,
  href = JOIN_ROUTE,
  cta = "View Profile →",
}: {
  person: DirectoryPerson;
  href?: string;
  cta?: string;
}) {
  return (
    <article className="site-card flex flex-col border border-border bg-surface">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
        <img
          src={person.photo}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <MatchBadge percent={person.match} className="absolute left-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col px-5 py-5">
        <h3 className="text-h4 font-medium tracking-tight">{person.name}</h3>
        <p className="mt-1 text-body-sm text-muted">{person.role}</p>
        <p className="mt-3 text-body-sm">{AVAILABILITY_LABEL[person.availability]}</p>
        <p className="text-body-sm text-muted">{person.location}</p>
        <Link to={href} className="mt-5 text-body-sm font-medium underline-offset-4 hover:underline">
          {cta}
        </Link>
      </div>
    </article>
  );
}

export function HonestyNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-caption text-quiet", className)}>
      Illustration — not a real person or opportunity
    </p>
  );
}
