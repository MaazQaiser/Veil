import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconAlert, IconCheck, IconInfo, IconLoader } from "./icons";

const alertTone = {
  info: "border-border bg-info-muted text-foreground",
  success: "border-border bg-success-muted text-foreground",
  warning: "border-border bg-warning-muted text-foreground",
  destructive: "border-border bg-destructive-muted text-foreground",
} as const;

const alertIcon = {
  info: IconInfo,
  success: IconCheck,
  warning: IconAlert,
  destructive: IconAlert,
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof alertTone;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = alertIcon[tone];
  return (
    <div role="status" className={cn("flex gap-3 rounded-xl border px-6 py-4", alertTone[tone], className)}>
      <Icon className="mt-0.5" />
      <div>
        <p className="text-body-sm font-medium">{title}</p>
        {children ? <p className="mt-1 text-body-sm text-muted">{children}</p> : null}
      </div>
    </div>
  );
}

export function Toast({
  tone = "info",
  title,
  onDismiss,
}: {
  tone?: keyof typeof alertTone;
  title: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="status"
      className={cn("flex items-center justify-between gap-3 rounded-md border bg-surface px-4 py-3 shadow-md", alertTone[tone])}
    >
      <p className="text-body-sm">{title}</p>
      {onDismiss ? (
        <button type="button" className="text-caption font-medium text-muted" onClick={onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      {icon ? <div className="mb-4 text-muted">{icon}</div> : null}
      <h3 className="vael-h4">{title}</h3>
      {description ? <p className="mt-3 max-w-md text-body-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 px-4 py-8 text-body-sm text-muted">
      <IconLoader />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  title = "Something did not load",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-destructive-muted px-6 py-8">
      <p className="text-body-sm font-medium text-destructive">{title}</p>
      {description ? <p className="text-body-sm text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-muted", className)} aria-hidden />;
}

export function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  return (
    <nav aria-label="Pagination" className="flex items-center gap-2">
      <button
        type="button"
        className="h-12 rounded-md border border-border px-5 text-button disabled:opacity-50"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </button>
      <p className="text-caption text-muted">
        Page {page} of {pageCount}
      </p>
      <button
        type="button"
        className="h-12 rounded-md border border-border px-5 text-button disabled:opacity-50"
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
