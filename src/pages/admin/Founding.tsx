import { Avatar } from "@/components/ui/avatar";
import { FOUNDING_CAP, foundingRows } from "@/lib/adminStore";
import { formatDate } from "@/lib/time";
import { useAdmin } from "@/lib/useAdmin";
import { AdminPageHeader, EmptyPanel, Panel, StatTile, StatusPill } from "./parts";

export function AdminFoundingPage() {
  useAdmin();
  const rows = foundingRows();
  const completed = rows.filter((row) => row.completed).length;
  const pct = Math.min(100, Math.round((rows.length / FOUNDING_CAP) * 100));

  return (
    <>
      <AdminPageHeader
        title="Founding"
        lede="The first 100 members to join Vael, in any district, hold a founding place. A place is completed once the member has finished setting up their profile."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Places held" value={`${rows.length} of ${FOUNDING_CAP}`} />
        <StatTile label="Completed" value={completed} hint="Profile filled in." />
        <StatTile label="Still to finish" value={rows.length - completed} hint="Joined, profile not finished." />
      </div>

      <div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Founding places held">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-caption text-muted">{FOUNDING_CAP - rows.length} places left</p>
      </div>

      {rows.length === 0 ? (
        <EmptyPanel title="No founding places held yet" body="The first people to join Vael show up here, newest first." />
      ) : (
        <Panel bodyClassName="p-0">
          <div className="hidden grid-cols-[4rem_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_8rem] gap-4 border-b border-border-subtle px-5 py-3 text-caption font-medium uppercase tracking-wide text-muted md:grid">
            <span>Place</span>
            <span>Member</span>
            <span>District</span>
            <span>Joined</span>
            <span>Status</span>
          </div>
          <ul className="divide-y divide-border-subtle">
            {rows.map((row) => (
              <li
                key={row.handle}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-4 md:grid-cols-[4rem_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_8rem]"
              >
                <span className="text-body font-semibold text-accent md:order-none">#{row.place}</span>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar name={row.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-body-sm font-medium text-foreground">{row.name}</span>
                    <span className="block truncate text-caption text-muted">{row.email}</span>
                  </span>
                </span>
                <span className="hidden truncate text-body-sm text-foreground/90 md:block">{row.district}</span>
                <span className="hidden text-body-sm text-muted md:block">{formatDate(row.joinedAt)}</span>
                <span>
                  <StatusPill tone={row.completed ? "done" : "warn"}>{row.completed ? "Completed" : "Held"}</StatusPill>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
