import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useCxProjects } from "@/lib/useCxProjects";
import {
  opportunitiesForVaelIn,
  projectsForHandle,
  type CxProject,
} from "@/lib/cxProjectStore";
import { opportunitiesHomeFor, opportunityHref, projectHref } from "@/lib/cxRoutes";
import { formatDate } from "@/lib/time";
import type { VaelSide } from "@/lib/vaelStore";

const cardClass =
  "block rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-8px_rgba(17,17,17,0.14)] dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:border-white/15";

function OpportunityTile({ item, to, badge }: { item: CxProject; to: string; badge?: string }) {
  const location = [item.city, item.postalCode].filter(Boolean).join(", ");
  return (
    <Link to={to} className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-foreground">{item.category || "Project"}</p>
          {location ? <p className="mt-0.5 truncate text-body-sm text-muted">{location}</p> : null}
        </div>
        {badge ? (
          <Badge tone="live" className="shrink-0">
            {badge}
          </Badge>
        ) : null}
      </div>
      {item.description ? <p className="mt-3 line-clamp-2 text-body-sm text-muted">{item.description}</p> : null}
      <p className="mt-3 text-caption text-quiet">
        {[item.budgetBand, item.timing && `Start: ${item.timing}`, formatDate(item.publishedAt || item.createdAt)]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </Link>
  );
}

/**
 * Home-dashboard opportunities for both sides. Vael Out sees what they posted
 * and can create more; Vael In sees what is open to them. Same store, same
 * start flow (Go Visible → district), opposite end of it.
 */
export function OpportunitiesRail({ side, handle }: { side: VaelSide; handle: string }) {
  useCxProjects();
  const out = side === "out";
  const mine = out && handle ? projectsForHandle(handle) : [];
  const open = !out && handle ? opportunitiesForVaelIn(handle) : [];
  const items = out
    ? [...mine].sort((a, b) => Date.parse(b.publishedAt || b.createdAt) - Date.parse(a.publishedAt || a.createdAt))
    : open;

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-h4 font-medium text-foreground">
            {out ? "Your Opportunities" : "Available Opportunities"}
            {items.length > 0 ? (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#FFC555]/15 px-2 text-caption font-medium text-[#C99A28] dark:bg-accent/15 dark:text-accent">
                {items.length}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-body-sm text-muted">
            {out
              ? "Projects you have posted, and who has responded."
              : "Projects posted from Vael Out, ready for you to review."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={opportunitiesHomeFor(side)}
            className="text-body-sm font-medium text-[#C99A28] underline underline-offset-4 hover:text-foreground dark:text-accent"
          >
            View all →
          </Link>
        </div>
      </div>

      <div className="mt-5">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#C99A28]/25 bg-[#FFC555]/[0.05] px-5 py-8 text-center text-body-sm text-muted dark:border-accent/25 dark:bg-accent/[0.05]">
            {out
              ? "No opportunities yet. Opportunities you post, and the responses to them, will show up here."
              : "No open opportunities right now. New ones posted from Vael Out will show up here."}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.slice(0, 3).map((item) => (
              <li key={item.id}>
                <OpportunityTile
                  item={item}
                  to={out ? projectHref(item.id) : opportunityHref(item.id)}
                  badge={out && item.status === "live" ? "Published" : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
