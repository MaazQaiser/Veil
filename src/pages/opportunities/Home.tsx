import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { buttonClassName } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconSearch } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useCitySession } from "@/lib/citySession";
import { liveCxProjects, projectsForHandle, type CxProject } from "@/lib/cxProjectStore";
import { opportunityHref, opportunityStart, projectHref } from "@/lib/cxRoutes";
import { formatDate } from "@/lib/time";
import { useCxProjects } from "@/lib/useCxProjects";
import { OpportunityCard, opportunityStatus } from "@/pages/projects/List";

type Tab = "mine" | "browse";

const cardClass =
  "block rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] motion-safe:transition-shadow hover:shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-8px_rgba(17,17,17,0.14)] dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:border-white/15";

function matchesQuery(item: CxProject, query: string) {
  const text = [item.category, item.description, item.city, item.postalCode, item.timing, item.budgetBand]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => text.includes(word));
}

function BrowseCard({ item }: { item: CxProject }) {
  const location = [item.city, item.postalCode].filter(Boolean).join(", ");
  return (
    <Link to={opportunityHref(item.id)} className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-foreground">{item.category || "Project"}</p>
          {location ? <p className="mt-0.5 truncate text-body-sm text-muted">{location}</p> : null}
        </div>
        <span className="shrink-0 text-caption text-quiet">{formatDate(item.publishedAt || item.createdAt)}</span>
      </div>
      {item.description ? <p className="mt-3 line-clamp-3 text-body-sm text-muted">{item.description}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {item.timing ? (
          <span className="rounded-full bg-surface-muted px-3 py-1 text-caption text-muted">Start: {item.timing}</span>
        ) : null}
        {item.budgetBand ? (
          <span className="rounded-full bg-surface-muted px-3 py-1 text-caption text-muted">Budget: {item.budgetBand}</span>
        ) : null}
      </div>
      <p className="mt-4 text-body-sm font-medium text-accent">View opportunity →</p>
    </Link>
  );
}

/**
 * The Opportunity module. Same space for both dashboards: the opportunities you
 * created, and everything other people have posted that you can search.
 */
export function OpportunityHomePage() {
  useCxProjects();
  const { session } = useCitySession();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "browse" ? "browse" : "mine";
  const publishedId = params.get("published") ?? "";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const mine = [...(session.handle ? projectsForHandle(session.handle) : [])].sort(
    (x, y) => Date.parse(y.publishedAt || y.createdAt) - Date.parse(x.publishedAt || x.createdAt),
  );
  const others = liveCxProjects()
    .filter((item) => item.handle !== session.handle)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const categories = [...new Set(others.map((item) => item.category).filter(Boolean))];
  const results = others.filter((item) => (!category || item.category === category) && matchesQuery(item, query));
  const justPublished = publishedId ? mine.find((item) => item.id === publishedId) : undefined;

  const counts = mine.reduce(
    (acc, item) => {
      const status = opportunityStatus(item);
      if (status === "draft") acc.drafts += 1;
      else if (status === "closed") acc.closed += 1;
      else {
        acc.active += 1;
        if (status === "closing") acc.closingSoon += 1;
      }
      return acc;
    },
    { active: 0, drafts: 0, closingSoon: 0, closed: 0 },
  );

  function selectTab(next: Tab) {
    setParams({ tab: next }, { replace: true });
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "mine", label: "Your opportunities", count: mine.length },
    { id: "browse", label: "Browse opportunities", count: others.length },
  ];

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
            Opportunities
          </h1>
          <p className="mt-1 max-w-xl text-body-sm text-muted">
            Post work you need done, and find work other people have posted.
          </p>
        </div>
        <Link
          to={opportunityStart("create").to}
          state={opportunityStart("create").state}
          className={buttonClassName({ size: "lg", className: "shrink-0 px-8" })}
        >
          Create an Opportunity
        </Link>
      </div>

      {justPublished ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-body font-semibold text-foreground">Your opportunity is live.</p>
            <p className="mt-0.5 text-body-sm text-muted">
              {justPublished.category || "Your project"} is now visible to people who can help.
            </p>
          </div>
          <Link to={projectHref(justPublished.id)} className={buttonClassName({ size: "sm", variant: "outline" })}>
            View opportunity
          </Link>
        </div>
      ) : null}

      <div role="tablist" aria-label="Opportunities" className="flex gap-6 border-b border-border-subtle">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => selectTab(item.id)}
            className={cn(
              "-mb-px inline-flex h-11 items-center gap-2 border-b-2 text-body-sm font-medium motion-safe:transition-colors",
              tab === item.id
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {item.label}
            <span className="text-caption opacity-70">{item.count}</span>
          </button>
        ))}
      </div>

      {tab === "mine" ? (
        <section>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Active", counts.active],
              ["Drafts", counts.drafts],
              ["Closing soon", counts.closingSoon],
              ["Closed", counts.closed],
            ].map(([label, value]) => (
              <div key={label} className={cn(cardClass, "p-4")}>
                <p className="text-h3 font-medium tabular-nums text-foreground">{value}</p>
                <p className="mt-1 text-body-sm text-muted">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            {mine.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-body font-medium text-foreground">No opportunities yet</p>
                <p className="mt-1 text-body-sm text-muted">Post what you need done and people will respond here.</p>
                <Link
                  to={opportunityStart("create").to}
                  state={opportunityStart("create").state}
                  className={buttonClassName({ className: "mt-4" })}
                >
                  Create an Opportunity
                </Link>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {mine.map((item) => (
                  <li key={item.id}>
                    <OpportunityCard item={item} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <section>
          <div className="flex flex-col gap-3">
            <form role="search" onSubmit={(event) => event.preventDefault()} className="flex items-center gap-2 rounded-full border border-border bg-surface px-4">
              <IconSearch className="h-4 w-4 shrink-0 text-quiet" />
              <label htmlFor="opportunity-search" className="sr-only">
                Search opportunities
              </label>
              <input
                id="opportunity-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by category, place, budget or keyword"
                className="h-11 min-w-0 flex-1 bg-transparent text-body-sm text-foreground placeholder:text-quiet focus:outline-none"
              />
            </form>
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {["", ...categories].map((name) => (
                  <button
                    key={name || "all"}
                    type="button"
                    onClick={() => setCategory(name)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-caption font-medium motion-safe:transition-colors",
                      category === name
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border text-muted hover:text-foreground",
                    )}
                  >
                    {name || "All"}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="mt-6">
            {results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-body font-medium text-foreground">
                  {others.length === 0 ? "No open opportunities right now" : "Nothing matches your search"}
                </p>
                <p className="mt-1 text-body-sm text-muted">
                  {others.length === 0
                    ? "Opportunities other people post will show up here."
                    : "Try a different word or clear the filter."}
                </p>
              </div>
            ) : (
              <>
                <p className="mb-3 flex items-center gap-2 text-body-sm text-muted">
                  <Badge tone="live">{results.length}</Badge>
                  {results.length === 1 ? "opportunity" : "opportunities"}
                </p>
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((item) => (
                    <li key={item.id}>
                      <BrowseCard item={item} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
