import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { IconChevronRight } from "./icons";

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-caption text-muted", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 ? <IconChevronRight className="text-muted" /> : null}
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined} className={last ? "text-foreground" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="hover:text-foreground hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  lead,
  actions,
  primaryAction,
  secondaryAction,
  crumbs,
  className,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  crumbs?: Crumb[];
  className?: string;
}) {
  const hasActions = Boolean(actions || primaryAction || secondaryAction);

  return (
    <header className={cn("flex flex-col gap-4 border-b border-border-subtle pb-10 md:pb-12", className)}>
      {crumbs ? <Breadcrumb items={crumbs} /> : null}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {lead}
          <div className="min-w-0">
            {kicker ? <p className="vael-kicker mb-3">{kicker}</p> : null}
            <h1 className="vael-h1">{title}</h1>
            {description ? <p className="mt-4 max-w-header text-body text-muted">{description}</p> : null}
          </div>
        </div>
        {hasActions ? (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {secondaryAction}
            {primaryAction}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h2 className="vael-h3">{title}</h2>
        {description ? <p className="mt-1 text-body-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
