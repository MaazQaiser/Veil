import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({
  width = "default",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { width?: "default" | "narrow" | "wide" | "full" }) {
  if (width === "full") return <div className={cn("w-full", className)} {...props} />;
  const cls = width === "narrow" ? "vael-container-narrow" : width === "wide" ? "vael-container-wide" : "vael-container";
  return <div className={cn(cls, className)} {...props} />;
}

export function Stack({ gap = "md", className, ...props }: HTMLAttributes<HTMLDivElement> & { gap?: "sm" | "md" | "lg" }) {
  const g = gap === "sm" ? "gap-2" : gap === "lg" ? "gap-8" : "gap-4";
  return <div className={cn("flex flex-col", g, className)} {...props} />;
}

export function Split({
  className,
  sidebar,
  children,
}: {
  className?: string;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-5 md:gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]", className)}>
      <aside className="lg:sticky lg:top-4 lg:self-start">{sidebar}</aside>
      <div>{children}</div>
    </div>
  );
}

export function TwoCol({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-4 md:grid-cols-2 md:gap-5 lg:gap-6", className)} {...props} />;
}

export function ThreeCol({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 xl:gap-6", className)} {...props} />;
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-6 py-5 shadow-sm">
      <p className="vael-kicker">{label}</p>
      <p className="mt-1 font-sans text-h2 text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-caption text-muted">{hint}</p> : null}
    </div>
  );
}
