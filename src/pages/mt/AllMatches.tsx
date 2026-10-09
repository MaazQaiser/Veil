import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { DashboardSidebar } from "@/components/mt/DashboardSidebar";
import { MatchDashboardCard } from "@/components/mt/MatchDashboardCard";
import { RequireMember } from "@/components/mt/RequireMember";
import { EmptyState } from "@/components/ui/feedback";
import { IconChevronDown } from "@/components/ui/icons";
import { SearchInput } from "@/components/ui/search";
import { getOnboardingDraft } from "@/lib/onboarding";
import { visibilityKindFromListing } from "@/lib/visibilityPlans";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { useVael } from "@/lib/vaelCore";
import { hoursLeft, getProfile, type VaelSide } from "@/lib/vaelStore";
import { matchesDiscoverLede, matchesGoVisibleCta } from "@/lib/vaelCopy";

type AvailabilityFilter = "all" | "now" | "soon";
type SortMode = "best" | "newest";

const AVAILABILITY_OPTIONS: { id: AvailabilityFilter; label: string }[] = [
  { id: "now", label: "Available now" },
  { id: "soon", label: "Available soon" },
  { id: "all", label: "All availability" },
];

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: "best", label: "Best Match" },
  { id: "newest", label: "Newest" },
];

/** Shared shell for the header dropdowns — 8px radius, same language as the homepage search. */
function FilterDropdown({
  label,
  value,
  children,
}: {
  label?: string;
  value: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-12 items-center gap-2 rounded-md border border-border bg-surface px-4 text-body-sm font-medium text-foreground motion-safe:transition-colors motion-safe:duration-150 hover:border-[#C99A28]/30 dark:bg-white/[0.05] dark:hover:border-white/15"
      >
        {label ? <span className="text-muted">{label}:</span> : null}
        <span className="max-w-[10rem] truncate">{value}</span>
        <IconChevronDown className="h-3.5 w-3.5 text-quiet" />
      </button>
      {open ? (
        <div
          id={panelId}
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-[min(16rem,calc(100vw-2.5rem))] rounded-md border border-border bg-surface-elevated p-1.5 shadow-md dark:backdrop-blur-xl"
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

export function AllMatchesPage() {
  return (
    <RequireMember title="All Matches">
      <AllMatchesInner />
    </RequireMember>
  );
}

function AllMatchesInner() {
  const vael = useVael();
  const { listing, latestListing, matches, myConnections, handle, signedIn, profile, documents } = vael;
  const mine = signedIn ? profile(handle) : undefined;
  const docs = signedIn ? documents(handle) : [];
  const incoming = myConnections.filter(
    (connection) =>
      connection.status === "pending" && connection.counterpartHandle === handle && !connection.counterpartAccepted,
  );
  const kind = visibilityKindFromListing(latestListing);
  const vaeledOut = kind === "out" || ((kind === "in" || kind === "expiring") && latestListing?.side === "out");
  const intent = getOnboardingDraft(handle)?.intent ?? "";
  const side: VaelSide = intent === "out" || vaeledOut ? "out" : "in";

  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<SortMode>("best");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    let list = matches.filter((match) => {
      if (availability !== "all") {
        const hours = hoursLeft(match.listing.expiresAt);
        if (availability === "now" && hours > 24) return false;
        if (availability === "soon" && hours <= 24) return false;
      }

      if (needle) {
        const person = getProfile(match.listing.handle);
        const haystack = [
          person?.displayName,
          person?.headline,
          match.listing.handle,
          match.listing.discipline,
          match.listing.category,
          match.listing.description,
          ...match.listing.skills,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });

    list = [...list].sort((a, b) =>
      sort === "newest" ? Date.parse(b.listing.createdAt) - Date.parse(a.listing.createdAt) : b.percent - a.percent,
    );

    return list;
  }, [matches, availability, query, sort]);

  return (
    <CityPage width="full">
      <div className="flex w-full items-start">
        <DashboardSidebar handle={handle} profile={mine} documents={docs} incomingCount={incoming.length} side={side} />

        <div className="min-w-0 flex-1 space-y-6 bg-white px-4 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-6 lg:px-10 dark:bg-white/[0.02] dark:backdrop-blur-3xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0">
              <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
                Matches
              </h1>
              <p className="mt-1 text-body-sm text-muted">{matchesDiscoverLede(side)}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-nowrap">
              <div className="w-44 shrink-0">
                <SearchInput
                  label="Search matches"
                  id="matches-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search..."
                />
              </div>
              <FilterDropdown
                value={AVAILABILITY_OPTIONS.find((option) => option.id === availability)?.label ?? "All availability"}
              >
                {(close) => (
                  <ul>
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <li key={option.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={availability === option.id}
                          onClick={() => {
                            setAvailability(option.id);
                            close();
                          }}
                          className="flex w-full items-center rounded-sm px-3 py-2 text-left text-body-sm hover:bg-surface-muted"
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </FilterDropdown>
              <FilterDropdown value={SORT_OPTIONS.find((option) => option.id === sort)?.label ?? "Best Match"}>
                {(close) => (
                  <ul>
                    {SORT_OPTIONS.map((option) => (
                      <li key={option.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={sort === option.id}
                          onClick={() => {
                            setSort(option.id);
                            close();
                          }}
                          className="flex w-full items-center rounded-sm px-3 py-2 text-left text-body-sm hover:bg-surface-muted"
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </FilterDropdown>
            </div>
          </div>

          {!listing ? (
            <EmptyState
              title="Go visible to see matches"
              description="Matches appear once you are visible this cycle."
              action={
                <Link to={`${PRODUCT_HOME}/vael?create=1&side=${side}`} className="text-body-sm font-medium text-[#C99A28] dark:text-accent">
                  {matchesGoVisibleCta(side)}
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No matches for these filters"
              description="Try a different search or widen the availability filter."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((match) => (
                <MatchDashboardCard key={match.listing.id} match={match} className="w-full max-w-none" />
              ))}
            </div>
          )}
        </div>
      </div>
    </CityPage>
  );
}
