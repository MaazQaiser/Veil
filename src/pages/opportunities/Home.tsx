import { Link, useLocation, useSearchParams } from "react-router-dom";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { OpportunityBoard, useLiveOpportunityCount } from "@/components/opportunities/OpportunityBoard";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useCitySession } from "@/lib/citySession";
import { projectsForHandle } from "@/lib/cxProjectStore";
import { opportunityStart, projectHref } from "@/lib/cxRoutes";
import { useCxProjects } from "@/lib/useCxProjects";
import { OpportunityCard, opportunityStatus } from "@/pages/projects/List";

const cardClass =
  "block rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] motion-safe:transition-shadow hover:shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-8px_rgba(17,17,17,0.14)] dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:border-white/15";

/**
 * The Opportunity module. Opens on the live opportunities; "My opportunities" switches to the
 * ones you created.
 */
export function OpportunityHomePage() {
  useCxProjects();
  const { session } = useCitySession();
  const [params, setParams] = useSearchParams();
  const joinedNow = Boolean((useLocation().state as { joinedContractor?: boolean } | null)?.joinedContractor);
  const tab: "browse" | "mine" = params.get("tab") === "mine" ? "mine" : "browse";
  const publishedId = params.get("published") ?? "";
  const browseCount = useLiveOpportunityCount("all");

  const mine = [...(session.handle ? projectsForHandle(session.handle) : [])].sort(
    (x, y) => Date.parse(y.publishedAt || y.createdAt) - Date.parse(x.publishedAt || x.createdAt),
  );
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
  const start = opportunityStart("create");

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

  const yours =
    tab === "mine" ? (
      <>
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
        {mine.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-body font-medium text-foreground">No opportunities posted yet</p>
            <p className="mt-1 text-body-sm text-muted">Post what you need done and people will respond here.</p>
            <Link to={start.to} state={start.state} className={buttonClassName({ className: "mt-4" })}>
              Create an Opportunity
            </Link>
          </div>
        ) : (
          <>
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
            <ul className="grid gap-4 sm:grid-cols-2">
              {mine.map((item) => (
                <li key={item.id}>
                  <OpportunityCard item={item} />
                </li>
              ))}
            </ul>
          </>
        )}
      </>
    ) : undefined;

  return (
    <DashboardShell>
      <OpportunityBoard
        title="Opportunities in Contractor Exchange"
        subtitle="Live opportunities from homeowners, for members of this district."
        samples="all"
        tabs={tabs}
        notice={
          joinedNow ? (
            <p className="rounded-2xl border border-success/30 bg-success/10 px-5 py-4 text-body text-success">
              You're in Contractor Exchange. You can now see full opportunities and show interest.
            </p>
          ) : null
        }
        showPost={tab === "mine"}
      >
        {yours}
      </OpportunityBoard>
    </DashboardShell>
  );
}
