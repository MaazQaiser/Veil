import { Link, Outlet } from "react-router-dom";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardMeta, CardTitle } from "@/components/ui/card";
import { projectHref } from "@/lib/cxRoutes";
import { extendCxProject, respondentCount, type CxProject } from "@/lib/cxProjectStore";
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

export function opportunityStatus(item: CxProject): OpportunityStatus {
  if (item.status === "draft") return "draft";
  if (item.status === "live") return item.day5Reminded ? "closing" : "published";
  return "closed";
}

export function OpportunityCard({ item }: { item: CxProject }) {
  const status = opportunityStatus(item);
  const left = daysLeft(item);
  const location = [item.city, item.postalCode].filter(Boolean).join(", ");
  const canExtend = status === "closing" || status === "closed";
  const responses = respondentCount(item.id);

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
      {item.status === "live" ? (
        <p className="mt-3 text-body-sm font-medium text-accent">
          {responses === 0
            ? "No contractors have responded yet."
            : `${responses} ${responses === 1 ? "contractor is" : "contractors are"} interested`}
        </p>
      ) : null}

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
        <Link
          to={projectHref(item.id)}
          className="text-body-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          View Opportunity →
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
