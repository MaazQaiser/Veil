import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/menu";
import { IconBookmark, IconEye, IconFlag, IconHandshake, IconUser, IconUserMinus, IconUsers } from "@/components/ui/icons";
import {
  FOUNDING_CAP,
  adminAttention,
  adminDashboard,
  adminOverview,
  adminReports,
  personName,
  reportSubject,
  type RangeDays,
  shortReason,
} from "@/lib/adminStore";
import { cn } from "@/lib/cn";
import { formatDate, relativeTime } from "@/lib/time";
import { useAdmin } from "@/lib/useAdmin";
import { DeactivateDialog } from "./DeactivateDialog";
import { AdminPageHeader, StatusPill } from "./parts";
import { COLOR, ChartCard, StackedColumns, Donut, GroupedBars, LineTrend, RangeSwitch } from "./charts";
import { CARD, DeltaChip, Legend, ProgressBar, Sparkline, StatCard } from "./gauges";

const RANGES: { id: RangeDays; label: string }[] = [
  { id: 7, label: "Week" },
  { id: 30, label: "30 days" },
  { id: 90, label: "90 days" },
];

const MUTED = "rgb(128 128 128 / 0.45)";

function hoursText(hours: number | null) {
  if (hours === null) return "no resolved reports yet";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)} hr`;
  return `${Math.round(hours / 24)} days`;
}


/* ------------------------------------------------------------------ sortable reports table */

type SortKey = "about" | "reason" | "by" | "waiting";

function ReportsTable({ avgResolve }: { avgResolve: string }) {
  const repeat = adminAttention().find((item) => item.id === "repeat");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "waiting", dir: 1 });
  const waiting = adminReports().filter((item) => item.status === "open");
  const value = (report: (typeof waiting)[number], key: SortKey) =>
    key === "about" ? reportSubject(report) : key === "reason" ? report.reason : key === "by" ? personName(report.byHandle) : Date.parse(report.createdAt);
  // "Waiting" sorts oldest first by default, since the longest wait matters most.
  const rows = [...waiting].sort((a, b) => {
    const x = value(a, sort.key);
    const y = value(b, sort.key);
    return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
  });

  function head(key: SortKey, label: string, className = "") {
    const active = sort.key === key;
    return (
      <th className={cn("py-3 font-medium", className)} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
        <button
          type="button"
          onClick={() => setSort((prev) => ({ key, dir: prev.key === key ? (prev.dir === 1 ? -1 : 1) : 1 }))}
          className={cn("inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground", active && "text-foreground")}
        >
          {label}
          <span aria-hidden className="text-[10px]">
            {active ? (sort.dir === 1 ? "▲" : "▼") : ""}
          </span>
        </button>
      </th>
    );
  }

  return (
    <section className={cn(CARD, "flex flex-col overflow-hidden")}>
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-body font-semibold text-foreground">
            Reports to review <span className="ml-1 text-body-sm font-normal text-muted">{waiting.length}</span>
          </h2>
          <p className="mt-0.5 text-caption text-muted">{avgResolve}</p>
        </div>
        <Link to="/admin/reports" className="shrink-0 whitespace-nowrap text-body-sm font-medium text-accent hover:underline">
          All reports →
        </Link>
      </div>
      {repeat ? (
        <p className="border-b border-border-subtle bg-destructive-muted px-5 py-2.5 text-caption text-destructive">
          <span className="font-semibold">{repeat.title}.</span> {repeat.detail}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
          <p className="text-body-sm font-medium text-foreground">Nothing is waiting</p>
          <p className="mt-1 max-w-xs text-caption text-muted">A report appears here, with a Review button, as soon as a member files one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-body-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted/30 text-caption text-muted">
                {head("about", "About", "px-5")}
                {head("reason", "Reason", "px-3")}
                {head("by", "Reported by", "px-3")}
                {head("waiting", "Waiting", "px-3")}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {rows.slice(0, 6).map((report) => (
                <tr key={report.id} className="hover:bg-surface-muted/50">
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-3">
                      <Avatar name={reportSubject(report)} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{reportSubject(report)}</span>
                        <span className="block text-caption text-muted">{report.kind === "person" ? "Person" : "Opportunity"}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-foreground/90">{report.reason}</td>
                  <td className="px-3 py-3.5 text-muted">{personName(report.byHandle)}</td>
                  <td className="px-3 py-3.5 text-muted">{relativeTime(report.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={`/admin/reports?open=${report.id}`}
                      className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-body-sm font-semibold text-[#1A1410] hover:bg-accent-hover"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ building blocks */

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

/* ------------------------------------------------------------------ page */

export function AdminOverviewPage() {
  useAdmin();
  const [days, setDays] = useState<RangeDays>(30);
  const [toDeactivate, setToDeactivate] = useState<{ handle: string; name: string } | null>(null);
  const [, setClock] = useState(0);
  // "4m ago" stays honest while the page is open.
  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const data = adminDashboard(days);
  const stats = adminOverview();
  const sum = data.summary;
  const weekly = days === 90;
  const per = weekly ? "week" : "day";
  const period = days === 7 ? "this week" : `in the last ${days} days`;
  const membersLine = data.series.map((point, index) => ({ date: point.date, value: data.memberTotals[index] }));
  const activity = data.barSeries.map((point) => ({ date: point.date, a: point.posted, b: point.handshakes }));
  const stepWord = data.barStep === 1 ? "day" : data.barStep === 3 ? "3-day step" : "week";
  const unassigned = data.byDistrict.find((row) => row.id === "none")?.count ?? 0;
  const compareWord = days === 7 ? "week" : `${days} days`;
  // Busiest district first, so the longest bars are at the top.
  const districtBars = [...data.byDistrictTable]
    .sort((a, b) => b.visibleIn + b.visibleOut - (a.visibleIn + a.visibleOut) || b.handshakes - a.handshakes || a.name.localeCompare(b.name))
    .map((row) => ({ id: row.id, name: row.name, parts: [row.visibleIn, row.visibleOut] }));
  // Reports filed before the chosen period, so an empty period can point at them instead of looking like nothing ever happened.
  const earlierReports = Math.max(0, stats.reportsWaiting + stats.reportsResolved - sum.reports.filed);

  return (
    <>
      <AdminPageHeader
        title="Overview"
        action={<RangeSwitch value={days} options={RANGES} onChange={setDays} />}
        lede={
          <>
            Here are the details of what's happening across Vael. Showing <span className="font-semibold text-foreground">{days === 7 ? "this week" : `the last ${days} days`}</span>.
          </>
        }
      />

      <section className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<IconFlag />}
            tint={COLOR.reports}
            label="Reports received"
            note={stats.reportsWaiting === 0 ? "No reports are waiting for you." : `${stats.reportsWaiting} ${plural(stats.reportsWaiting, "report is", "reports are")} still waiting for you, whatever the period.`}
            value={sum.reports.filed}
            to="/admin/reports"
            chip={<DeltaChip value={data.reports.value} previous={data.reports.previous} word={compareWord} lowerIsBetter />}
            visual={<Sparkline data={data.reports.spark} color={COLOR.reports} />}
            legend={
              <Legend
                items={[
                  { label: "waiting", value: sum.reports.toReview, color: COLOR.reports },
                  { label: "decided", value: sum.reports.decided, color: MUTED },
                ]}
              />
            }
          />
          <StatCard
            icon={<IconUsers />}
            tint={COLOR.members}
            label="New members"
            note={`${stats.totalMembers} ${plural(stats.totalMembers, "member", "members")} in total, across all districts.`}
            value={sum.members.joined}
            unit="joined"
            to="/admin/accounts"
            chip={<DeltaChip value={data.members.value} previous={data.members.previous} word={compareWord} />}
            visual={<Sparkline data={data.members.spark} color={COLOR.members} />}
            legend={<Legend items={[{ label: "members in total", value: stats.totalMembers, color: MUTED }]} />}
          />
          <StatCard
            icon={<IconUser />}
            tint={COLOR.members}
            label="Profiles finished"
            note="How many of the new members finished setting up their profile. Members can't be matched until they do."
            value={sum.members.finished}
            unit={`of ${sum.members.joined} new`}
            visual={<ProgressBar value={sum.members.finished} max={sum.members.joined} color={COLOR.members} />}
            legend={
              <Legend
                items={[
                  { label: "finished", value: sum.members.finished, color: COLOR.members },
                  { label: "not yet", value: sum.members.joined - sum.members.finished, color: MUTED },
                ]}
              />
            }
          />
          <StatCard
            icon={<IconBookmark />}
            tint={COLOR.founding}
            label="Founding places"
            note={`${sum.founding.taken} taken ${period}. The first ${FOUNDING_CAP} members to join Vael get a founding place.`}
            value={sum.founding.held}
            unit={`of ${FOUNDING_CAP}`}
            to="/admin/founding"
            visual={<ProgressBar value={sum.founding.held} max={FOUNDING_CAP} color={COLOR.founding} />}
            legend={
              <Legend
                items={[
                  { label: "taken", value: sum.founding.held, color: COLOR.founding },
                  { label: "free", value: FOUNDING_CAP - sum.founding.held, color: MUTED },
                ]}
              />
            }
          />
          <StatCard
            icon={<IconEye />}
            tint={COLOR.listings}
            label="New listings"
            note="A listing goes live when a member goes visible on Vael, either as available (Vael In) or as looking for someone (Vael Out)."
            value={sum.listings.total}
            unit="went live"
            chip={<DeltaChip value={data.posted.value} previous={data.posted.previous} word={compareWord} />}
            visual={<Sparkline data={data.posted.spark} color={COLOR.listings} />}
            legend={
              <Legend
                items={[
                  { label: "available", value: sum.listings.available, color: COLOR.available },
                  { label: "looking", value: sum.listings.looking, color: COLOR.looking },
                ]}
              />
            }
          />
          <StatCard
            icon={<IconHandshake />}
            tint={COLOR.connections}
            label="New connections"
            note="A connection is made when two members both say yes and can start talking. The product calls this a Handshake."
            value={sum.connections.opened}
            unit="made"
            chip={<DeltaChip value={data.handshakes.value} previous={data.handshakes.previous} word={compareWord} />}
            visual={<Sparkline data={data.handshakes.spark} color={COLOR.connections} />}
            legend={
              <Legend
                items={[
                  { label: "open", value: sum.connections.stillOpen, color: COLOR.connections },
                  { label: "closed", value: sum.connections.ended, color: MUTED },
                ]}
              />
            }
          />
        </div>
      </section>

      <section className="space-y-5">
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
          <ChartCard title="Total members" hint={`People who had joined by the end of each ${per}.`}>
            <LineTrend points={membersLine} color={COLOR.members} unit="member" weekly={weekly} legend={{ label: "Total members", total: data.memberTotals[data.memberTotals.length - 1] ?? 0 }} />
          </ChartCard>
          <ChartCard title="Listings and connections" hint={`Listings that went live and connections made, in each ${stepWord}.`}>
            <GroupedBars
              points={activity}
              stepDays={data.barStep}
              series={[
                { label: "Listings", color: COLOR.listings, total: sum.listings.total },
                { label: "Connections", color: COLOR.connections, total: sum.connections.opened },
              ]}
            />
          </ChartCard>
        </div>
      </section>

      <section className="space-y-5">
        <ChartCard
          title="How each district is doing"
          hint={`New listings in each district, split into available and looking. A bar with only one colour can't match anyone yet, because a match needs both.${unassigned > 0 ? ` ${unassigned} new ${plural(unassigned, "member hasn't", "members haven't")} picked a district, so ${plural(unassigned, "they aren't", "they aren't")} counted here.` : ""}`}
        >
          <StackedColumns
            categories={districtBars}
            series={[
              { label: "Available (Vael In)", color: COLOR.available },
              { label: "Looking (Vael Out)", color: COLOR.looking },
            ]}
            axisTitle="Listings"
            empty="No new listings in any district yet."
          />
        </ChartCard>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-5">
          <ChartCard className="lg:col-span-2" title="Available or looking?" hint="Share of new listings. Available means Vael In. Looking means Vael Out.">
            <Donut rows={data.byVisibility} colors={[COLOR.available, COLOR.looking]} centerLabel="listings" size={156} empty="No new listings yet." />
          </ChartCard>
          <ChartCard className="lg:col-span-3" title="Why people report" hint="Reports received, by the reason given.">
            <StackedColumns
              categories={data.byReason.map((row) => ({ id: row.id, name: shortReason(row.name), title: row.name, parts: [row.count] }))}
              series={[{ label: "Reports", color: COLOR.reports }]}
              axisTitle="Number of reports"
              height={190}
              minWidth={380}
              empty={
                earlierReports > 0
                  ? `No reports ${period}. ${earlierReports} earlier ${plural(earlierReports, "report was", "reports were")} filed, so choose a longer period to see ${plural(earlierReports, "it", "them")}.`
                  : "No reports yet. A column grows as soon as someone files a report."
              }
            />
          </ChartCard>
        </div>
      </section>

      <section className="space-y-5">
        <ReportsTable avgResolve={data.avgResolveHours === null ? "No reports decided yet" : `Decided in ${hoursText(data.avgResolveHours)} on average`} />
      </section>

      <section className={cn(CARD, "overflow-hidden")}>
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-body font-semibold text-foreground">New members</h2>
            <p className="mt-0.5 text-caption text-muted">
              Showing the latest {Math.min(5, data.newestMembers.length)} of {sum.members.joined} who joined {period}.
            </p>
          </div>
          <Link to="/admin/accounts" className="text-body-sm font-medium text-accent hover:underline">
            All accounts →
          </Link>
        </div>
        {data.newestMembers.length === 0 ? (
          <p className="px-5 py-10 text-center text-body-sm text-muted">Nobody joined {period}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-body-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-muted/30 text-caption font-medium uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-3 py-3 font-medium">District</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.newestMembers.slice(0, 5).map((member) => (
                  <tr key={member.handle} className="hover:bg-surface-muted/50">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-3">
                        <Avatar name={member.name} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground">{member.name}</span>
                          <span className="block truncate text-caption text-muted">{member.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-foreground/90">{member.district}</td>
                    <td className="px-3 py-3.5 text-muted">{formatDate(member.joinedAt)}</td>
                    <td className="px-3 py-3.5">
                      <StatusPill tone={member.status === "active" ? "done" : member.status === "blocked" ? "bad" : "warn"}>
                        {member.status === "active" ? "Active" : member.status === "blocked" ? "Blocked" : "Deactivated"}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {member.status === "active" ? (
                        <Tooltip label="Deactivate this account" align="left">
                          <button
                            type="button"
                            aria-label={`Deactivate ${member.name}`}
                            onClick={() => setToDeactivate({ handle: member.handle, name: member.name })}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted motion-safe:transition-colors hover:border-destructive/50 hover:bg-destructive-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                          >
                            <IconUserMinus className="h-[18px] w-[18px]" />
                          </button>
                        </Tooltip>
                      ) : (
                        <span className="text-caption text-muted/70">{member.status === "blocked" ? "Blocked" : "Already off"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <DeactivateDialog member={toDeactivate} onClose={() => setToDeactivate(null)} />
    </>
  );
}
