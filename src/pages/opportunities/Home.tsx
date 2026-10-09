import { Link } from "react-router-dom";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { CONTRACTOR_OPPS_PATH, NEED_PATH } from "@/lib/cxRoutes";

const entryClassName =
  "rounded-2xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] hover:shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-8px_rgba(17,17,17,0.14)] dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:border-white/15";

/**
 * The top-level Opportunity entry — Create or Avail — reachable directly
 * from the persistent nav, not nested inside Contractor Exchange or any
 * other module. Opportunity is its own concept: it connects the person who
 * needs work done with the person who can do it, without naming Vael In or
 * Vael Out in the copy itself.
 */
export function OpportunityHomePage() {
  return (
    <DashboardShell>
      <div>
        <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
          Opportunity
        </h1>
        <p className="mt-1 max-w-xl text-body-sm text-muted">
          One place for residential projects that need to be done and professionals ready to do them.
        </p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link to={NEED_PATH} className={entryClassName}>
          <p className="text-body font-semibold text-foreground">I need a project done</p>
          <p className="mt-0.5 text-body-sm text-muted">Create and post a project.</p>
          <p className="mt-3 text-body-sm font-medium text-[#DE7C40]">Create an Opportunity →</p>
        </Link>
        <Link to={CONTRACTOR_OPPS_PATH} className={entryClassName}>
          <p className="text-body font-semibold text-foreground">I&apos;m looking for a project</p>
          <p className="mt-0.5 text-body-sm text-muted">Browse projects posted by people who need work done.</p>
          <p className="mt-3 text-body-sm font-medium text-[#DE7C40]">Avail an Opportunity →</p>
        </Link>
      </div>
    </DashboardShell>
  );
}
