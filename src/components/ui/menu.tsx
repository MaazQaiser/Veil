import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconChevronDown } from "./icons";

export function Dropdown({
  label,
  children,
  align = "start",
}: {
  label: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-12 items-center gap-2 rounded-md border border-border bg-surface px-5 text-button"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <IconChevronDown />
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-30 mt-2 min-w-[12rem] rounded-xl border border-border bg-surface-elevated p-2 shadow-md",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({
  children,
  onSelect,
}: {
  children: ReactNode;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="flex w-full rounded-sm px-3 py-2 text-left text-body-sm hover:bg-surface-muted"
      onClick={onSelect}
    >
      {children}
    </button>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <span className="group relative inline-flex">
      <span aria-describedby={id}>{children}</span>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-secondary px-2 py-1 text-caption text-secondary-foreground group-hover:block group-focus-within:block"
      >
        {label}
      </span>
    </span>
  );
}
