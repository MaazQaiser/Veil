import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { IconChevronDown, IconMoon, IconSearch, IconSun } from "@/components/ui/icons";
import { Tooltip } from "@/components/ui/menu";
import { cn } from "@/lib/cn";
import { ADMIN_EMAIL, ADMIN_NAME } from "@/lib/adminStore";

type Props = { theme: "light" | "dark"; onToggleTheme: () => void; onSignOut: () => void };

/** The bar along the top of the admin area: search on the left, the light and dark switch and the admin menu on the right. */
export function AdminTopBar({ theme, onToggleTheme, onSignOut }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function search(event: FormEvent) {
    event.preventDefault();
    const wanted = query.trim();
    // People are what an admin looks for most, so the search opens the Members page with the name filled in.
    navigate(wanted ? `/admin/accounts?q=${encodeURIComponent(wanted)}` : "/admin/accounts");
  }

  return (
    <div className="flex items-center gap-3">
      <form role="search" onSubmit={search} className="relative min-w-0 flex-1 sm:max-w-md">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search"
          className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-body-sm text-foreground placeholder:text-quiet focus-visible:border-foreground focus-visible:outline-none"
        />
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Tooltip label={theme === "dark" ? "Switch to light" : "Switch to dark"}>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted motion-safe:transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {theme === "dark" ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
          </button>
        </Tooltip>
        <AdminMenu onSignOut={onSignOut} />
      </div>
    </div>
  );
}

/** "Vael Admin" with a small menu under it: who is signed in, and a way to sign out. */
function AdminMenu({ onSignOut }: { onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2.5 rounded-xl border border-border bg-surface pl-1.5 pr-3 text-body-sm font-medium text-foreground motion-safe:transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <Avatar name={ADMIN_NAME} size="sm" />
        <span className="hidden sm:inline">{ADMIN_NAME}</span>
        <IconChevronDown className={cn("h-4 w-4 text-muted motion-safe:transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-border bg-surface-elevated p-2 shadow-md">
          <div className="px-3 py-2">
            <p className="truncate text-body-sm font-medium text-foreground">{ADMIN_NAME}</p>
            <p className="truncate text-caption text-muted">{ADMIN_EMAIL}</p>
          </div>
          <div className="my-1 border-t border-border-subtle" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-body-sm font-medium text-foreground hover:bg-surface-muted"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
