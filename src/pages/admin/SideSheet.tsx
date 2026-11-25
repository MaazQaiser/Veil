import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IconClose } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";

/**
 * A panel that slides in from the right over the page, for looking at one thing in full without
 * leaving the list behind it. Click the dim area, press Escape or use the close button to put it away.
 * The header stays put, the body scrolls, and an optional footer (the main button) stays at the bottom.
 */
export function SideSheet({
  open,
  onClose,
  eyebrow,
  title,
  badge,
  headerAction,
  dirty,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  badge?: ReactNode;
  /** A button beside the close button, such as Edit. */
  headerAction?: ReactNode;
  /** True when the panel holds something typed and not yet saved. Closing it by the cross, the dim area or Escape then asks first. */
  dirty?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  // Kept on screen for a moment after closing, so it can slide out instead of vanishing.
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [asking, setAsking] = useState(false);

  function requestClose() {
    if (asking) return;
    if (dirty) setAsking(true);
    else onClose();
  }

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    const timer = window.setTimeout(() => setMounted(false), 220);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, dirty, asking]);

  useEffect(() => {
    if (shown && open) closeRef.current?.focus();
  }, [shown, open]);

  // While the panel is open the page behind it does not scroll, and focus goes back to whatever opened it.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [open]);

  /** Keeps Tab and Shift+Tab inside the panel, so keyboard users cannot wander into the page behind it. */
  function keepFocusInside(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!mounted) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={requestClose}
        className={cn("absolute inset-0 bg-black/50 motion-safe:transition-opacity motion-safe:duration-200", shown ? "opacity-100" : "opacity-0")}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={keepFocusInside}
        className={cn(
          "absolute right-0 top-0 flex h-full w-[min(34rem,100%)] flex-col border-l border-border bg-surface text-foreground shadow-2xl motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out",
          shown ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
          <div className="min-w-0">
            {eyebrow ? <p className="text-caption font-medium uppercase tracking-wide text-muted">{eyebrow}</p> : null}
            <h2 id={titleId} className="mt-0.5 truncate text-h4 font-semibold text-foreground">
              {title}
            </h2>
            {badge ? <div className="mt-2">{badge}</div> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerAction}
            <button
              ref={closeRef}
              type="button"
              aria-label="Close"
              onClick={requestClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-border-subtle px-6 py-4">{footer}</div> : null}
      </aside>
      <Dialog
        open={asking}
        onClose={() => setAsking(false)}
        title="Discard your changes?"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setAsking(false)}>
              Keep editing
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => {
                setAsking(false);
                onClose();
              }}
            >
              Discard
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">What you typed here has not been saved.</p>
      </Dialog>
    </div>
  );
}
