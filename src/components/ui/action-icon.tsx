import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A round icon button that names itself in a tooltip on hover and keyboard focus. */
export function ActionIcon({
  label,
  onClick,
  children,
  danger = false,
  active = false,
  disabled = false,
  size = "md",
  tooltip = "below",
  align = "center",
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  /** Where the tooltip sits: under the button or above it. */
  tooltip?: "above" | "below";
  /** "end" keeps the tooltip inside the page when the button is the last in a row. */
  align?: "center" | "end";
  /** "overlay" is for buttons that sit on top of a photo or cover. */
  tone?: "default" | "overlay";
}) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active || undefined}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "inline-flex items-center justify-center rounded-full border motion-safe:transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          size === "sm" ? "h-9 w-9" : "h-10 w-10",
          tone === "overlay"
            ? "border-white/15 bg-black/55 text-white backdrop-blur-sm hover:border-accent/60 hover:bg-black/75 hover:text-accent"
            : danger
            ? "border-destructive/30 bg-destructive-muted text-destructive hover:border-destructive/60"
            : active
              ? "border-accent/60 bg-accent/10 text-accent"
              : "border-border bg-surface text-foreground hover:border-accent/50 hover:bg-accent/10 hover:text-accent",
        )}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-30 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-caption font-medium text-background opacity-0 shadow-md motion-safe:transition-opacity group-focus-within:opacity-100 group-hover:opacity-100",
          tooltip === "above" ? "bottom-full mb-2" : "top-full mt-2",
          align === "end" ? "right-0" : "left-1/2 -translate-x-1/2",
        )}
      >
        {label}
      </span>
    </span>
  );
}
