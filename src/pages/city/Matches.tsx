import { useEffect, useId, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { MarketplaceMatchCard } from "@/components/marketplace/MarketplaceMatchCard";
import { RequireMember } from "@/components/mt/RequireMember";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/headers";
import { FilterBar, FilterChip } from "@/components/ui/search";
import { useCitySession } from "@/lib/citySession";
import { useCommercial } from "@/lib/commercialCore";
import { useConstruction } from "@/lib/constructionCore";
import { primaryDistricts } from "@/lib/districts";
import {
  applyMarketplaceChips,
  collectMarketplace,
  districtLabel,
  marketplaceHref,
  parseMarketplaceFilter,
  setAvailabilityHref,
  showRemoteChip,
  veilRouteForDistrict,
  veiledDistrictIds,
  type MarketplaceChipId,
  type MarketplaceDistrictId,
  type MarketplaceFilter,
} from "@/lib/marketplace";
import { getOnboardingDraft } from "@/lib/onboarding";
import { useResidential } from "@/lib/residentialCore";
import { useTrucking } from "@/lib/truckingCore";
import { useVael } from "@/lib/vaelCore";

const CHIP_DEFS: Array<{ id: MarketplaceChipId; label: string }> = [
  { id: "90+", label: "90%+" },
  { id: "available-now", label: "Available Now" },
  { id: "remote", label: "Remote" },
  { id: "new", label: "New" },
];

const SELECT_OPTIONS: Array<{ id: MarketplaceFilter; label: string }> = [
  { id: "all", label: "All Districts" },
  { id: "recommended", label: "Recommended" },
  ...primaryDistricts.map((district) => ({
    id: district.id as MarketplaceDistrictId,
    label: district.name,
  })),
];

function filterLabel(filter: MarketplaceFilter): string {
  if (filter === "all") return "All Districts";
  if (filter === "recommended") return "Recommended";
  return districtLabel(filter);
}

function summaryLine(filter: MarketplaceFilter, total: number, isNew: number, availableNow: number): string {
  const counts = `${total} ${total === 1 ? "Match" : "Matches"} · ${isNew} New · ${availableNow} Available Now`;
  if (filter === "all") return `ALL DISTRICTS · ${counts}`;
  return counts;
}

function DistrictSelect({
  value,
  onChange,
}: {
  value: MarketplaceFilter;
  onChange: (next: MarketplaceFilter) => void;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const label = filterLabel(value);

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
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`District filter, ${label}`}
        className="inline-flex max-w-[16rem] items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left text-body-sm text-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-surface-muted"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0 truncate">
          <span className="block text-label text-muted">District</span>
          <span className="block truncate">{label}</span>
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Districts"
          className="absolute right-0 z-40 mt-2 w-[min(18rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-surface-elevated p-2 shadow-md"
        >
          {SELECT_OPTIONS.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === option.id}
                className="flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-body-sm hover:bg-surface-muted"
                onClick={() => {
                  setOpen(false);
                  onChange(option.id);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function MatchesPage() {
  return (
    <RequireMember title="Your Matches">
      <MatchesInner />
    </RequireMember>
  );
}

function MatchesInner() {
  const { session } = useCitySession();
  const handle = session.handle;
  useVael();
  useConstruction();
  useTrucking();
  useResidential();
  useCommercial();

  const [params, setParams] = useSearchParams();
  const filter = parseMarketplaceFilter(params.get("district"));
  const [chips, setChips] = useState<MarketplaceChipId[]>([]);

  const veiled = veiledDistrictIds(handle);
  const homeDistrictId = getOnboardingDraft(handle)?.districtId;
  const collected = collectMarketplace(handle, filter, homeDistrictId);
  const visibleChips = CHIP_DEFS.filter((chip) => chip.id !== "remote" || showRemoteChip(filter));
  const activeChips = chips.filter((chip) => chip !== "remote" || showRemoteChip(filter));
  const matches = applyMarketplaceChips(collected, activeChips);

  const newCount = matches.filter((item) => item.isNew).length;
  const availableNowCount = matches.filter((item) => item.isAvailableNow).length;
  const noneVeiled = veiled.length === 0;
  const singleDistrict = filter !== "recommended" && filter !== "all";
  const notVeiledHere = singleDistrict && !veiled.includes(filter);

  function setFilter(next: MarketplaceFilter) {
    const nextParams = new URLSearchParams(params);
    if (next === "recommended") nextParams.delete("district");
    else nextParams.set("district", next);
    setParams(nextParams, { replace: true });
    setChips((current) => (next !== "recommended" && next !== "all" && next !== "media-technology"
      ? current.filter((chip) => chip !== "remote")
      : current));
  }

  function toggleChip(id: MarketplaceChipId) {
    setChips((current) => (current.includes(id) ? current.filter((chip) => chip !== id) : [...current, id]));
  }

  return (
    <CityPage>
      <PageHeader
        title="Your Matches"
        description="Opportunities that fit your skills, experience, and availability."
        actions={<DistrictSelect value={filter} onChange={setFilter} />}
      />

      {noneVeiled ? (
        <EmptyState
          title="Veil In to see matches"
          description="Set availability in a district. Recommended only ranks districts where you are Veiled In or Out."
          action={
            <Link to={setAvailabilityHref(handle)} className={buttonClassName({ size: "lg" })}>
              Set availability
            </Link>
          }
        />
      ) : notVeiledHere ? (
        <EmptyState
          title={`Veil In in ${districtLabel(filter)} to see matches`}
          description="This list uses that district’s own engine. It does not score you with another district’s weights."
          action={
            <Link to={veilRouteForDistrict(filter)} className={buttonClassName({ size: "lg" })}>
              Veil In
            </Link>
          }
        />
      ) : (
        <>
          <p className="mt-8 text-body-sm text-muted">
            {summaryLine(filter, matches.length, newCount, availableNowCount)}
          </p>
          <div className="mt-4">
            <FilterBar>
              {visibleChips.map((chip) => (
                <FilterChip
                  key={chip.id}
                  label={chip.label}
                  active={activeChips.includes(chip.id)}
                  onClick={() => toggleChip(chip.id)}
                />
              ))}
            </FilterBar>
          </div>

          {matches.length === 0 ? (
            <EmptyState
              title="No matches with these filters"
              description="Clear a chip or switch district. Rankings stay inside each district’s own engine."
            />
          ) : (
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {matches.map((match) => (
                <li key={`${match.districtId}-${match.listingId}`}>
                  <MarketplaceMatchCard match={match} showDistrict={filter === "recommended" || filter === "all"} />
                </li>
              ))}
            </ul>
          )}

          {filter === "recommended" ? (
            <section className="mt-12">
              <p className="vael-kicker">Explore by District</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {primaryDistricts.map((district) => (
                  <Link
                    key={district.id}
                    to={marketplaceHref(district.id as MarketplaceDistrictId)}
                    className={buttonClassName({ variant: "outline", size: "sm" })}
                  >
                    {district.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </CityPage>
  );
}
