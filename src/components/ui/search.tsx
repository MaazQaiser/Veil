import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconSearch } from "./icons";
import { Badge } from "./badge";

export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string }>(
  function SearchInput({ className, label = "Search", id = "search", ...props }, ref) {
    return (
      <div className="relative">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={ref}
          id={id}
          type="search"
          className={cn(
            "h-12 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-body",
            "placeholder:text-quiet focus-visible:outline-none focus-visible:border-foreground focus-visible:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-7 rounded-full border px-2.5 text-caption font-medium focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]",
        active ? "border-foreground bg-primary text-primary-foreground" : "border-border bg-surface text-foreground",
      )}
    >
      {label}
    </button>
  );
}

export function FilterBar({
  children,
  count,
}: {
  children: ReactNode;
  count?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {typeof count === "number" ? <Badge tone="muted">{count} shown</Badge> : null}
    </div>
  );
}
