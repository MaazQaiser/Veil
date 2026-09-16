import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { RequireMember } from "@/components/mt/RequireMember";
import { MatchDashboardCard } from "@/components/mt/MatchDashboardCard";
import { EmptyState } from "@/components/ui/feedback";
import { IconChevronDown, IconSearch } from "@/components/ui/icons";
import { crossDistrictMatchesForAlex, type CrossDistrictMatch } from "@/lib/crossDistrictMatches";
import { primaryDistricts } from "@/lib/districts";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { useVael } from "@/lib/vaelCore";
import { getProfile, hoursLeft, type RankedMatch } from "@/lib/vaelStore";

const MATCH_DISTRICT_ID = "media-technology";
const ALL_DISTRICTS = "all";

/** One shape both a real MT RankedMatch and a cross-district match can be filtered/sorted/rendered as. */
type CardEntry = {
  key: string;
  districtId: string;
  percent: number;
  createdAt: string;
  expiresAt: string;
  searchText: string;
  render: () => React.ReactNode;
};

function mtEntry(match: RankedMatch, onDistrictClick: (districtId: string) => void): CardEntry {
  const profile = getProfile(match.listing.handle);
  const searchText = [profile?.displayName, profile?.headline, match.listing.discipline, match.listing.category, ...match.listing.skills]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return {
    key: match.listing.id,
    districtId: MATCH_DISTRICT_ID,
    percent: match.percent,
    createdAt: match.listing.createdAt,
    expiresAt: match.listing.expiresAt,
    searchText,
    render: () => <MatchDashboardCard match={match} onDistrictClick={() => onDistrictClick(MATCH_DISTRICT_ID)} />,
  };
}

function crossEntry(match: CrossDistrictMatch, onDistrictClick: (districtId: string) => void): CardEntry {
  const searchText = [match.displayName, match.headline, match.description].filter(Boolean).join(" ").toLowerCase();
  return {
    key: match.id,
    districtId: match.districtId,
    percent: match.percent,
    createdAt: match.createdAt,
    expiresAt: match.expiresAt,
    searchText,
    render: () => (
      <MatchDashboardCard
        match={{ listing: { id: match.id, handle: match.handle, description: match.description }, percent: match.percent }}
        href={match.href}
        districtName={match.districtName}
        nameOverride={match.displayName}
        roleOverride={match.headline}
        onDistrictClick={() => onDistrictClick(match.districtId)}
      />
    ),
  };
}

type AvailabilityFilter = "all" | "now" | "soon";
type SortMode = "best" | "newest";

const AVAILABILITY_OPTIONS: { id: AvailabilityFilter; label: string }[] = [
  { id: "now", label: "Available now" },
  { id: "soon", label: "Available soon" },
  { id: "all", label: "All availability" },
];

/** Shared shell for the two dropdown filters below — button + panel, closes on outside click / Escape. */
function FilterDropdown({
  label,
  value,
  children,
}: {
  label: string;
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
        className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-body-sm font-medium text-foreground motion-safe:transition-colors motion-safe:duration-150 hover:border-[#C99A28]/30 dark:bg-white/5 dark:backdrop-blur-lg dark:hover:border-accent/30"
      >
        <span className="text-muted">{label}:</span>
        <span className="max-w-[10rem] truncate">{value}</span>
        <IconChevronDown className="h-3.5 w-3.5 text-quiet" />
      </button>
      {open ? (
        <div
          id={panelId}
          role="listbox"
          className="absolute left-0 z-30 mt-2 w-[min(18rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-surface-elevated p-2 shadow-md dark:backdrop-blur-xl"
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
  const { listing, matches } = useVael();
  const [query, setQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>(ALL_DISTRICTS);
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<SortMode>("best");

  const crossDistrictMatches = useMemo(() => (listing ? crossDistrictMatchesForAlex(listing) : []), [listing]);

  const entries = useMemo(
    () => [...matches.map((match) => mtEntry(match, setDistrictFilter)), ...crossDistrictMatches.map((match) => crossEntry(match, setDistrictFilter))],
    [matches, crossDistrictMatches],
  );

  const districtCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) counts.set(entry.districtId, (counts.get(entry.districtId) ?? 0) + 1);
    return counts;
  }, [entries]);

  const districtLabel =
    districtFilter === ALL_DISTRICTS
      ? `All Districts (${entries.length})`
      : (() => {
          const name = primaryDistricts.find((district) => district.id === districtFilter)?.name ?? "All Districts";
          return `${name} (${districtCounts.get(districtFilter) ?? 0})`;
        })();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    let list = entries.filter((entry) => {
      if (districtFilter !== ALL_DISTRICTS && entry.districtId !== districtFilter) return false;

      if (availability !== "all") {
        const hours = hoursLeft(entry.expiresAt);
        if (availability === "now" && hours > 24) return false;
        if (availability === "soon" && hours <= 24) return false;
      }

      if (needle && !entry.searchText.includes(needle)) return false;

      return true;
    });

    list = [...list].sort((a, b) =>
      sort === "newest" ? Date.parse(b.createdAt) - Date.parse(a.createdAt) : b.percent - a.percent,
    );

    return list;
  }, [entries, districtFilter, availability, query, sort]);

  return (
    <CityPage width="full" className="-mt-4 sm:-mt-6">
      <div className="mx-auto w-full max-w-[92rem] px-5 py-12 md:px-6 lg:px-8">
      <Link to={PRODUCT_HOME} className="text-body-sm font-medium text-muted hover:text-foreground">
        ← Back to Dashboard
      </Link>

      <h1 className="mt-4 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-foreground">
        Matches
      </h1>
      <p className="mt-2 text-body text-muted">Discover people who match your profile, districts, and availability.</p>

      {!listing ? (
        <div className="mt-8">
          <EmptyState
            title="Vael In to see matches"
            description="Matches appear once you are visible this cycle."
            action={
              <Link to={`${PRODUCT_HOME}/vael?create=1`} className="text-body-sm font-medium text-[#C99A28] dark:text-accent">
                Set availability →
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Search & Filters */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="relative flex-1 sm:min-w-[16rem] sm:max-w-2xl">
              <span className="sr-only">Search matches</span>
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search matches..."
                className="h-11 w-full rounded-full border border-border bg-white pl-10 pr-4 text-body-sm text-foreground placeholder:text-quiet focus:outline-none dark:bg-white/5 dark:backdrop-blur-lg"
              />
            </label>

            <FilterDropdown label="District" value={districtLabel}>
              {(close) => (
                <ul>
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={districtFilter === ALL_DISTRICTS}
                      onClick={() => {
                        setDistrictFilter(ALL_DISTRICTS);
                        close();
                      }}
                      className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-body-sm hover:bg-surface-muted"
                    >
                      <span>All Districts</span>
                      <span className="text-quiet">{entries.length}</span>
                    </button>
                  </li>
                  {primaryDistricts.map((district) => (
                    <li key={district.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={districtFilter === district.id}
                        onClick={() => {
                          setDistrictFilter(district.id);
                          close();
                        }}
                        className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-body-sm hover:bg-surface-muted"
                      >
                        <span>{district.name}</span>
                        <span className="text-quiet">{districtCounts.get(district.id) ?? 0}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FilterDropdown>

            <FilterDropdown
              label="Availability"
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
                        className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-body-sm hover:bg-surface-muted"
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FilterDropdown>

            <FilterDropdown label="Sort" value={sort === "best" ? "Best Match" : "Newest"}>
              {(close) => (
                <ul>
                  {(["best", "newest"] as const).map((option) => (
                    <li key={option}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={sort === option}
                        onClick={() => {
                          setSort(option);
                          close();
                        }}
                        className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-body-sm hover:bg-surface-muted"
                      >
                        {option === "best" ? "Best Match" : "Newest"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FilterDropdown>
          </div>

          {/* Results header */}
          <div className="mt-8 flex items-baseline gap-2">
            <p className="text-h4 font-medium text-foreground">
              {filtered.length} {filtered.length === 1 ? "match" : "matches"} available
            </p>
          </div>

          {/* Cards — the exact Dashboard match card, unchanged */}
          {filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No matches for these filters"
                description="Try a different search, switch to All Districts, or widen the availability filter."
              />
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-4">
              {filtered.map((entry) => (
                <Fragment key={entry.key}>{entry.render()}</Fragment>
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </CityPage>
  );
}
