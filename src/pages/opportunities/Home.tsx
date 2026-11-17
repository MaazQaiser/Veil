import { useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { OpportunityBoard, useLiveOpportunityCount } from "@/components/opportunities/OpportunityBoard";
import { IconBriefcase, IconClose } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useCitySession } from "@/lib/citySession";
import { projectsForHandle, respondentCount } from "@/lib/cxProjectStore";
import { opportunityStart } from "@/lib/cxRoutes";
import { useCxProjects } from "@/lib/useCxProjects";
import { OpportunityCard, opportunityStatus } from "@/pages/projects/List";

/**
 * The Opportunity module. Opens on the live opportunities; "My opportunities" switches to the
 * ones you created.
 */
export function OpportunityHomePage() {
  useCxProjects();
  const { session } = useCitySession();
  const [params, setParams] = useSearchParams();
  const state = useLocation().state as { joinedContractor?: boolean } | null;
  const [noticeClosed, setNoticeClosed] = useState(false);
  const joinedNow = Boolean(state?.joinedContractor) && !noticeClosed;
  const [filter, setFilter] = useState<"all" | "live" | "ended">("all");
  const tab: "browse" | "mine" = params.get("tab") === "mine" ? "mine" : "browse";
  const browseCount = useLiveOpportunityCount("all");

  const mine = [...(session.handle ? projectsForHandle(session.handle) : [])].sort(
    (x, y) => Date.parse(y.publishedAt || y.createdAt) - Date.parse(x.publishedAt || x.createdAt),
  );
  const interested = mine.filter((item) => item.status === "live").reduce((total, item) => total + respondentCount(item.id), 0);
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

  const tabs = (
    <div role="tablist" aria-label="Opportunities" className="flex gap-6 border-b border-border-subtle">
      {[
        { id: "browse" as const, label: "Browse opportunities", count: browseCount },
        { id: "mine" as const, label: "Your opportunities", count: mine.length },
      ].map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={tab === item.id}
          onClick={() => setParams(item.id === "browse" ? {} : { tab: item.id }, { replace: true })}
          className={cn(
            "-mb-px inline-flex h-11 items-center gap-2 border-b-2 text-body-sm font-medium motion-safe:transition-colors",
            tab === item.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground",
          )}
        >
          {item.label}
          <span className="text-caption opacity-70">{item.count}</span>
        </button>
      ))}
    </div>
  );

  const liveItems = mine.filter((item) => item.status === "live");
  const endedItems = mine.filter((item) => item.status === "closed" || item.status === "expired");
  const shownItems = filter === "live" ? liveItems : filter === "ended" ? endedItems : mine;
  const filters = [
    { id: "all" as const, label: "All", full: "All opportunities", count: mine.length },
    { id: "live" as const, label: "Live", full: "Live", count: liveItems.length },
    { id: "ended" as const, label: "Ended", full: "Ended", count: endedItems.length },
  ];

  const start = opportunityStart("create");

  const yours =
    tab === "mine" ? (
      <>
        {mine.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-14 text-center sm:py-20">
            <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative mx-auto max-w-md">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
                <IconBriefcase className="h-7 w-7" />
              </span>
              <h2 className="mt-6 text-h3 font-semibold text-foreground">You haven't posted anything yet</h2>
              <p className="mt-2 text-body-sm text-muted">
                Post what you need done. Contractors in your area can see it, and the ones who are interested will show up here.
              </p>
              <Link
                to={start.to}
                state={start.state}
                className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-button font-semibold text-primary-foreground motion-safe:transition-opacity hover:opacity-90"
              >
                <span aria-hidden className="text-lg leading-none">+</span>
                Post an Opportunity
              </Link>
            </div>
          </div>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Active", counts.active],
                ["Interested", interested],
                ["Closing soon", counts.closingSoon],
                ["Closed", counts.closed],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border bg-surface px-5 py-4">
                  <dt className="text-body-sm text-muted">{label}</dt>
                  <dd className="mt-1.5 text-[1.75rem] font-medium leading-none tabular-nums text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            <div role="tablist" aria-label="Filter your opportunities" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
              {filters.map((item) => {
                const on = filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-body-sm font-medium sm:px-4 motion-safe:transition-colors",
                      on ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground",
                    )}
                  >
                    <span className="sm:hidden">{item.label}</span>
                    <span className="hidden sm:inline">{item.full}</span>
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-caption font-semibold tabular-nums",
                        on ? "bg-accent/20 text-accent" : "bg-surface-muted text-muted",
                      )}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {shownItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-body-sm text-muted">
                {filter === "live" ? "No live opportunities right now." : "No ended opportunities yet."}
              </p>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-[repeat(auto-fill,minmax(17rem,20rem))]">
                {shownItems.map((item) => (
                  <li key={item.id}>
                    <OpportunityCard item={item} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </>
    ) : undefined;

  if (!session.signedIn) return <Navigate to="/projects" replace />;

  return (
    <DashboardShell sidebar={false}>
      <OpportunityBoard
        title={tab === "mine" ? "Your opportunities" : "Opportunities in Contractor Exchange"}
        subtitle={tab === "mine" ? "What you've posted, and who has responded." : "Live opportunities from homeowners, for members of this district."}
        samples="all"
        tabs={tabs}
        notice={
          joinedNow ? (
            <div
              role="status"
              className="flex items-center justify-between gap-4 rounded-2xl border border-success/30 bg-success/10 py-4 pl-5 pr-3 text-body text-success"
            >
              <p>Your profile is done. You can now browse the full opportunities, show interest and post your own.</p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setNoticeClosed(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-success/80 motion-safe:transition-colors hover:bg-success/15 hover:text-success"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
          ) : null
        }
        showPost={tab === "mine" && mine.length > 0}
      >
        {yours}
      </OpportunityBoard>
    </DashboardShell>
  );
}
