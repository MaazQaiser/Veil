import { Outlet } from "react-router-dom";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { CATEGORY_ICON } from "@/components/opportunities/OpportunityBoard";
import { OpportunityCardView } from "@/pages/city/Projects";
import { projectHref } from "@/lib/cxRoutes";
import { respondentCount, type CxProject } from "@/lib/cxProjectStore";
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
  const responses = respondentCount(item.id);
  const posted = formatDate(item.publishedAt || item.createdAt);

  return (
    <OpportunityCardView
      category={item.category || "Project"}
      icon={CATEGORY_ICON[item.category] ?? "construction"}
      meta={[`Posted ${posted}`, responses > 0 ? `${responses} interested` : ""].filter(Boolean).join(" · ")}
      description={item.description}
      city={item.city}
      timing={item.timing}
      budget={item.budgetBand}
      daysLeft={daysLeft(item)}
      image={item.photos[0]}
      locked={false}
      action={{ label: "View opportunity", to: projectHref(item.id) }}
      badge={{ label: STATUS_LABEL[status], tone: status === "published" ? "live" : status === "closing" ? "soon" : "default" }}
    />
  );
}
