import type { ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";
import { cn } from "@/lib/cn";

export function NeedLayout() {
  return (
    <div
      data-surface="site-dark"
      className="join-flow wizard-flow relative isolate flex w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-12%] h-[42rem] w-[42rem] rounded-full bg-[#DE7C40]/20 blur-[130px]"
      />
      <div className="site-container relative pb-28 pt-8 md:pt-10">
        <div className="mx-auto w-full max-w-4xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function NeedHead({ title, lede }: { title: string; lede?: string }) {
  return (
    <header className="max-w-lg">
      <h1 className="font-sans text-[clamp(1.875rem,3.4vw,2.75rem)] font-medium leading-[1.15] tracking-[-0.025em] text-foreground">
        {title}
      </h1>
      {lede ? <p className="mt-3 font-sans text-[1.0625rem] leading-[1.55] text-muted">{lede}</p> : null}
    </header>
  );
}

export function NeedFooter({
  backTo,
  onBack,
  backLabel = "← Back",
  children,
}: {
  backTo?: string;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
}) {
  const backClassName = "text-body font-medium text-muted hover:text-foreground";
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0B0C0C]/95 backdrop-blur">
      <div className="site-container flex items-center justify-between gap-4 py-4">
        {onBack ? (
          <button type="button" onClick={onBack} className={backClassName}>
            {backLabel}
          </button>
        ) : backTo ? (
          <Link to={backTo} className={backClassName}>
            {backLabel}
          </Link>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 items-center gap-3">{children}</div>
      </div>
    </div>
  );
}

export function ChoiceCard({
  title,
  body,
  selected,
  onClick,
}: {
  title: string;
  body?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex h-full w-full flex-col items-start rounded-lg border bg-surface px-6 py-6 text-left motion-safe:transition-all",
        "hover:border-white/50",
        selected ? "border-white" : "border-white/15",
      )}
    >
      <h2 className="text-h4 font-medium text-foreground">{title}</h2>
      {body ? <p className="mt-2 text-body-sm text-muted">{body}</p> : null}
    </button>
  );
}
