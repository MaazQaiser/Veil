import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./button";
import { IconClose } from "./icons";

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cn(
        "w-[min(30rem,calc(100%-2.5rem))] rounded-xl border border-border bg-surface p-0 text-foreground shadow-md",
        "backdrop:bg-foreground/20",
      )}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-8 py-6">
        <h2 id={titleId} className="vael-h3">
          {title}
        </h2>
        <IconButton label="Close" size="sm" onClick={onClose}>
          <IconClose className="h-4 w-4" />
        </IconButton>
      </div>
      <div className="px-8 py-6 text-body">{children}</div>
      {footer ? <div className="flex justify-end gap-2 border-t border-border-subtle px-8 py-6">{footer}</div> : null}
    </dialog>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "left" | "right";
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close drawer overlay"
        className="absolute inset-0 bg-foreground/20 motion-safe:transition-opacity motion-safe:duration-200"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute top-0 flex h-full w-[min(22rem,100%)] flex-col bg-surface text-foreground shadow-md motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out",
          side === "right" ? "right-0 border-l border-border" : "left-0 border-r border-border",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id={titleId} className="vael-h4">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <IconClose />
          </IconButton>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
