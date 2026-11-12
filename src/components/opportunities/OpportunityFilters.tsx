import { useState } from "react";
import { IconCheck, IconChevronDown, IconSearch } from "@/components/ui/icons";
import { CX_BUDGET_BANDS } from "@/lib/cxProjectStore";
import { districts } from "@/lib/districts";
import { cn } from "@/lib/cn";

/** Every opportunity is posted into Contractor Exchange today. */
export const OPPORTUNITY_DISTRICT = "Contractor Exchange";

/** All ten districts, so the filter always lists every one of them. */
export const DISTRICT_OPTIONS = districts.map((district) => district.name);

/** Every budget band people can choose when posting, plus any the sample cards use. */
export function budgetOptions(extra: string[]) {
  return sortBudgets([...CX_BUDGET_BANDS, ...extra]);
}

/** When the work can start. Posted opportunities and the sample cards word this differently, so both map onto these four. */
export const AVAILABILITY_OPTIONS = ["ASAP", "Within 30 days", "In 1 to 3 months", "Just planning"];

export function availabilityOf(timing: string) {
  const text = timing.toLowerCase();
  if (/asap|now|immediate/.test(text)) return "ASAP";
  if (/30/.test(text)) return "Within 30 days";
  if (/1\s*(to|–|-)\s*3/.test(text)) return "In 1 to 3 months";
  if (/plan/.test(text)) return "Just planning";
  return timing;
}

export type OpportunityFilters = ReturnType<typeof useOpportunityFilters>;

function toggle(list: string[], name: string) {
  return list.includes(name) ? list.filter((item) => item !== name) : [...list, name];
}

/** The search box and the three checkbox filters. An empty group means "any". Shared by the website page and the signed-in board. */
export function useOpportunityFilters() {
  const [query, setQuery] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [budgets, setBudgets] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const active = (query.trim() ? 1 : 0) + districts.length + locations.length + budgets.length + availability.length;
  return {
    query,
    setQuery,
    districts,
    locations,
    budgets,
    availability,
    toggleAvailability: (name: string) => setAvailability((now) => toggle(now, name)),
    toggleDistrict: (name: string) => setDistricts((now) => toggle(now, name)),
    toggleLocation: (name: string) => setLocations((now) => toggle(now, name)),
    toggleBudget: (name: string) => setBudgets((now) => toggle(now, name)),
    active,
    clear() {
      setQuery("");
      setDistricts([]);
      setLocations([]);
      setBudgets([]);
      setAvailability([]);
    },
  };
}

/** Lowest figure in a budget band, to list the bands from smallest to largest. */
function bandFloor(band: string) {
  if (/^not sure/i.test(band)) return Number.MAX_SAFE_INTEGER;
  if (/^under/i.test(band)) return 0;
  return Number(band.match(/\$([\d,]+)/)?.[1].replace(/,/g, "") ?? 0);
}

export function sortBudgets(bands: string[]) {
  return Array.from(new Set(bands.filter(Boolean))).sort((a, b) => bandFloor(a) - bandFloor(b));
}

export function sortLocations(cities: string[]) {
  return Array.from(new Set(cities.filter(Boolean))).sort();
}

/** How many opportunities carry each value, so every option can show its count. */
export function countBy(values: string[]) {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

/** True when an opportunity passes the district, location, budget and search filters. */
export function matchesFilters(
  filters: Pick<OpportunityFilters, "query" | "districts" | "locations" | "budgets" | "availability">,
  item: { district: string; city: string; budget: string; timing: string; text: string[] },
) {
  const needle = filters.query.trim().toLowerCase();
  return (
    (filters.districts.length === 0 || filters.districts.includes(item.district)) &&
    (filters.locations.length === 0 || filters.locations.includes(item.city)) &&
    (filters.budgets.length === 0 || filters.budgets.includes(item.budget)) &&
    (filters.availability.length === 0 || filters.availability.includes(availabilityOf(item.timing))) &&
    (!needle || item.text.some((text) => text.toLowerCase().includes(needle)))
  );
}

function Group({
  heading,
  options,
  selected,
  counts,
  onToggle,
}: {
  heading: string;
  options: string[];
  selected: string[];
  counts: Record<string, number>;
  onToggle: (name: string) => void;
}) {
  return (
    <fieldset className="min-w-0 border-t border-border-subtle pt-4">
      <legend className="sr-only">{heading}</legend>
      <p className="mb-2 text-caption font-semibold uppercase tracking-[0.1em] text-muted">{heading}</p>
      <div className="space-y-0.5">
        {options.map((name) => (
          <label key={name} className="flex min-h-9 cursor-pointer items-center gap-3 rounded-lg py-1.5 text-body-sm text-foreground hover:text-accent">
            <input type="checkbox" checked={selected.includes(name)} onChange={() => onToggle(name)} className="peer sr-only" />
            <span
              aria-hidden
              className="flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-[5px] border border-border bg-surface-muted text-transparent motion-safe:transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50"
            >
              <IconCheck className="h-3 w-3" />
            </span>
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <span className="text-caption tabular-nums text-quiet">{counts[name] ?? 0}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The filters in a column beside the cards, the way listing sites lay them out. On a phone the
 * column folds behind a Filters button.
 */
export function OpportunityFilterPanel({
  filters,
  districts,
  locations,
  budgets,
  counts,
  className,
}: {
  filters: OpportunityFilters;
  districts: string[];
  locations: string[];
  budgets: string[];
  /** Opportunity counts per option, keyed by the option's name. */
  counts: {
    districts: Record<string, number>;
    locations: Record<string, number>;
    budgets: Record<string, number>;
    availability: Record<string, number>;
  };
  className?: string;
}) {
  const [openOnPhone, setOpenOnPhone] = useState(false);
  return (
    <aside aria-label="Filter opportunities" className={cn("min-w-0 lg:sticky lg:top-24 lg:self-start", className)}>
      <button
        type="button"
        aria-expanded={openOnPhone}
        onClick={() => setOpenOnPhone((now) => !now)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-surface px-4 text-body-sm font-medium text-foreground lg:hidden"
      >
        <span>
          Filters
          {filters.active > 0 ? <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-caption font-semibold text-accent">{filters.active}</span> : null}
        </span>
        <IconChevronDown className={cn("h-4 w-4 text-muted motion-safe:transition-transform", openOnPhone && "rotate-180")} />
      </button>

      <div
        className={cn(
          "mt-3 space-y-4 rounded-2xl border border-border bg-surface p-5 lg:mt-0 lg:block lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-y-auto",
          openOnPhone ? "block" : "hidden",
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-body font-semibold text-foreground">Filters</h2>
          {filters.active > 0 ? (
            <button type="button" onClick={filters.clear} className="text-body-sm font-medium text-accent underline-offset-4 hover:underline">
              Clear all
            </button>
          ) : null}
        </div>

        <div className="relative">
          <label htmlFor="opp-search" className="sr-only">
            Search opportunities
          </label>
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="opp-search"
            type="search"
            value={filters.query}
            onChange={(event) => filters.setQuery(event.target.value)}
            placeholder="Search opportunities"
            className="h-11 w-full rounded-xl border border-border bg-surface-muted pl-10 pr-3 text-body-sm text-foreground placeholder:text-quiet focus-visible:border-accent/60 focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>

        <Group heading="District" options={districts} selected={filters.districts} counts={counts.districts} onToggle={filters.toggleDistrict} />
        <Group heading="Location" options={locations} selected={filters.locations} counts={counts.locations} onToggle={filters.toggleLocation} />
        <Group heading="Availability" options={AVAILABILITY_OPTIONS} selected={filters.availability} counts={counts.availability} onToggle={filters.toggleAvailability} />
        <Group heading="Budget" options={budgets} selected={filters.budgets} counts={counts.budgets} onToggle={filters.toggleBudget} />
      </div>
    </aside>
  );
}
