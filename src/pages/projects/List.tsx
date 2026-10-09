import { Link, Outlet } from "react-router-dom";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardMeta, CardTitle } from "@/components/ui/card";
import { IconChevronLeft } from "@/components/ui/icons";
import { useCitySession } from "@/lib/citySession";
import { NEED_PATH, projectHref } from "@/lib/cxRoutes";
import { extendCxProject, projectsForHandle, type CxProject } from "@/lib/cxProjectStore";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { useCxProjects } from "@/lib/useCxProjects";
import { formatDate } from "@/lib/time";

/** Residential workspace inside Contractor Exchange. Not a second dashboard. */
export function ContractorProjectsLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}

type OpportunityStatus = "draft" | "published" | "closing" | "closed";

const STATUS_LABEL: Record<OpportunityStatus, string> = {
  draft: "Draft",
  published: "Published",
  closing: "Closing Soon",
  closed: "Closed",
};

const STATUS_TONE: Record<OpportunityStatus, "muted" | "live" | "soon" | "default"> = {
  draft: "muted",
  published: "live",
  closing: "soon",
  closed: "default",
};

function daysLeft(item: CxProject) {
  if (item.status !== "live" || !item.liveUntil) return 0;
  return Math.max(0, Math.ceil((Date.parse(item.liveUntil) - Date.now()) / 86400000));
}

function opportunityStatus(item: CxProject): OpportunityStatus {
  if (item.status === "draft") return "draft";
  if (item.status === "live") return item.day5Reminded ? "closing" : "published";
  return "closed";
}

export function ProjectsListPage() {
  useCxProjects();
  const { session } = useCitySession();
  const items = session.handle ? projectsForHandle(session.handle) : [];

  const counts = items.reduce(
    (acc, item) => {
      const status = opportunityStatus(item);
      if (status === "draft") acc.drafts += 1;
      else if (status === "published") acc.active += 1;
      else if (status === "closing") {
        acc.active += 1;
        acc.closingSoon += 1;
      } else acc.closed += 1;
      return acc;
    },
    { active: 0, drafts: 0, closingSoon: 0, closed: 0 },
  );

  const summary = [
    { label: "Active", value: counts.active },
    { label: "Drafts", value: counts.drafts },
    { label: "Closing Soon", value: counts.closingSoon },
    { label: "Closed", value: counts.closed },
  ];

  const sorted = [...items].sort(
    (a, b) => Date.parse(b.publishedAt || b.createdAt) - Date.parse(a.publishedAt || a.createdAt),
  );

  return (
    <div className="flex flex-1 flex-col">
      <Link
        to={PRODUCT_HOME}
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
      >
        <IconChevronLeft className="h-3.5 w-3.5" />
        Back to Home
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
            Create Opportunity
          </h1>
          <p className="mt-1 max-w-xl text-body-sm text-muted">
            Manage your projects and see what&apos;s happening with your opportunities.
          </p>
        </div>
        <Link to={NEED_PATH} className={buttonClassName({ size: "lg", className: "shrink-0 rounded-lg px-8" })}>
          Create an Opportunity
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]"
          >
            <p className="text-h3 font-medium tabular-nums text-foreground">{stat.value}</p>
            <p className="mt-1 text-body-sm text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-body font-medium text-foreground">No opportunities yet</p>
            <p className="mt-1 text-body-sm text-muted">
              Post what you need done and contractors will respond here.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {sorted.map((item) => (
              <li key={item.id}>
                <OpportunityCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OpportunityCard({ item }: { item: CxProject }) {
  const status = opportunityStatus(item);
  const left = daysLeft(item);
  const location = [item.city, item.postalCode].filter(Boolean).join(", ");
  const canExtend = status === "closing" || status === "closed";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{item.category || "Project"}</CardTitle>
            {location ? <CardMeta>{location}</CardMeta> : null}
          </div>
          <Badge tone={STATUS_TONE[status]} className="shrink-0">
            {STATUS_LABEL[status]}
          </Badge>
        </div>
      </CardHeader>

      {item.description ? <p className="line-clamp-2 text-body-sm text-muted">{item.description}</p> : null}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm">
        {item.budgetBand ? (
          <div>
            <dt className="text-caption text-quiet">Budget</dt>
            <dd className="mt-0.5 text-foreground">{item.budgetBand}</dd>
          </div>
        ) : null}
        {item.timing ? (
          <div>
            <dt className="text-caption text-quiet">Start timing</dt>
            <dd className="mt-0.5 text-foreground">{item.timing}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-caption text-quiet">Date posted</dt>
          <dd className="mt-0.5 text-foreground">{formatDate(item.publishedAt || item.createdAt)}</dd>
        </div>
        {status === "published" || status === "closing" ? (
          <div>
            <dt className="text-caption text-quiet">Remaining</dt>
            <dd className="mt-0.5 text-foreground">
              {left} {left === 1 ? "day" : "days"} remaining
            </dd>
          </div>
        ) : null}
      </dl>

      <CardFooter>
        <Link to={projectHref(item.id)} className={buttonClassName({ size: "sm" })}>
          View Opportunity
        </Link>
        {canExtend ? (
          <Button type="button" size="sm" variant="outline" onClick={() => extendCxProject(item.id)}>
            {status === "closed" ? "Reopen Project" : "Extend Project"}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
