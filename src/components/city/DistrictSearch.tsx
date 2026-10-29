import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DistrictStatus } from "@/components/vael/status";
import { IconSearch } from "@/components/ui/icons";
import { districts, type CityDistrict } from "@/lib/districts";
import { cn } from "@/lib/cn";

function matchesQuery(district: CityDistrict, query: string) {
  const words = `${district.name} ${district.registryName ?? ""} ${district.slug} ${district.blurb}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return query.split(/\s+/).every((term) => words.some((word) => word.startsWith(term)));
}

/** Type-ahead for the website top bar: find a district by name and jump straight to it. */
export function DistrictSearch({
  className,
  inline = false,
  tone = "dark",
  onNavigate,
}: {
  className?: string;
  /** "dark" for the website bar; "default" follows the page tokens (mobile menu). */
  tone?: "dark" | "default";
  /** Render results in the page flow (mobile menu) instead of a floating panel. */
  inline?: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const normalized = query.trim().toLowerCase();
  const results = useMemo(
    () => (normalized ? districts.filter((district) => matchesQuery(district, normalized)) : districts.filter((d) => d.primary)),
    [normalized],
  );

  useEffect(() => {
    setActive(0);
  }, [normalized]);

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [location.pathname]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function go(district: CityDistrict) {
    setOpen(false);
    setQuery("");
    onNavigate?.();
    navigate(district.route);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[active];
      if (target) go(target);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showPanel = open;
  const dark = tone === "dark";

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <div className={cn(
          "flex h-10 items-center gap-2 rounded-full border px-4 motion-safe:transition-colors",
          dark ? "border-white/15 bg-white/[0.06] focus-within:border-white/35" : "border-border bg-surface focus-within:border-foreground",
        )}>
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search districts
        </label>
        <IconSearch className={cn("h-4 w-4 shrink-0", dark ? "text-white/55" : "text-quiet")} />
        <input
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && results[active] ? `${listId}-${results[active].id}` : undefined}
          autoComplete="off"
          placeholder="Search districts"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn("h-full min-w-0 flex-1 bg-transparent font-sans text-body-sm focus:outline-none [&::-webkit-search-cancel-button]:hidden", dark ? "text-white placeholder:text-white/50" : "text-foreground placeholder:text-quiet")}
        />
      </div>
      {showPanel ? (
        <div
          className={cn(
            "z-50 rounded-xl border p-1.5",
            dark ? "border-white/10 bg-[#141414]" : "border-border bg-surface-elevated",
            inline ? "mt-2" : "absolute left-0 top-full mt-2 w-[22rem] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]",
          )}
        >
          {results.length ? (
            <ul id={listId} role="listbox" aria-label="Districts">
              {results.map((district, index) => (
                <li key={district.id} role="presentation">
                  <button
                    type="button"
                    id={`${listId}-${district.id}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(district)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left",
                      index === active ? (dark ? "bg-white/10" : "bg-surface-muted") : dark ? "hover:bg-white/5" : "hover:bg-surface-muted",
                    )}
                  >
                    <span className="min-w-0">
                      <span className={cn("block truncate font-sans text-body-sm font-medium", dark ? "text-white" : "text-foreground")}>{district.name}</span>
                      <span className={cn("block truncate text-caption", dark ? "text-white/60" : "text-muted")}>{district.blurb}</span>
                    </span>
                    <DistrictStatus status={district.status} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div id={listId} className={cn("px-3 py-3 text-body-sm", dark ? "text-white/70" : "text-muted")}>
              No district matches "{query.trim()}".{" "}
              <Link to="/districts" onClick={onNavigate} className="font-medium text-[#EE8A4A]">
                Browse all districts
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
