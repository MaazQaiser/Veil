import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { REPORT_ABOUT, REPORT_ACTIONS, adminReports, personName, reportAbout, reportSubject, reportedHandle, resolveReport, subjectPhoto, type ReportAction, type ReportAbout } from "@/lib/adminStore";
import type { CxReport } from "@/lib/cxProjectStore";
import { useAdmin } from "@/lib/useAdmin";
import { CARD } from "./gauges";
import { AdminPageHeader, ChoiceCard, EmptyPanel, FilterSelect, Pagination, StatusPill, TabBar, whenText } from "./parts";
import { SideSheet } from "./SideSheet";

const OUTCOME: Record<ReportAction, string> = {
  warn: "Warned the person",
  none: "No action needed",
  deactivate: "Deactivated their account",
};

/** How many reports show on one page. */
const PAGE_SIZE = 8;

type Tab = "all" | "waiting" | "resolved";
type About = "everything" | ReportAbout;
type Order = "oldest" | "newest";

export function AdminReportsPage() {
  useAdmin();
  const [params, setParams] = useSearchParams();
  const all = adminReports();
  const wanted = params.get("open") ?? "";

  const [tab, setTab] = useState<Tab>("all");
  const [about, setAbout] = useState<About>("everything");
  const [order, setOrder] = useState<Order>("oldest");
  // The report shown in the side panel. It stays set while the panel slides out, so it does not go blank on the way.
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Jumping in from the Overview opens that report straight away.
  useEffect(() => {
    if (!wanted) return;
    const target = all.find((item) => item.id === wanted);
    if (target) {
      setTab(target.status === "open" ? "waiting" : "resolved");
      setSelectedId(target.id);
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted]);

  const counts = {
    all: all.length,
    waiting: all.filter((item) => item.status === "open").length,
    resolved: all.filter((item) => item.status === "resolved").length,
  };

  const rows = all
    .filter((item) => (tab === "all" ? true : tab === "waiting" ? item.status === "open" : item.status === "resolved"))
    .filter((item) => about === "everything" || reportAbout(item) === about)
    .sort((a, b) => (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * (order === "oldest" ? 1 : -1));

  // A new tab or filter starts again from the first page, and a page that no longer exists falls back to the last one.
  useEffect(() => setPage(1), [tab, about, order]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const selected = all.find((item) => item.id === selectedId);
  const filtered = about !== "everything";
  const aboutLabel = (REPORT_ABOUT.find((item) => item.id === about)?.label ?? "").toLowerCase();

  function show(id: string) {
    setSelectedId(id);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    if (wanted) setParams({}, { replace: true });
  }

  return (
    <>
      <AdminPageHeader
        title="Reports"
        lede="Here is an overview of the reports members have made."
        action={
          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect label="About" value={about} onChange={(value) => setAbout(value as About)}>
              <option value="everything">Everything</option>
              {REPORT_ABOUT.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Order" value={order} onChange={(value) => setOrder(value as Order)}>
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
            </FilterSelect>
          </div>
        }
      />

      <TabBar
        label="Reports"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "all", label: "All", count: counts.all },
          { id: "waiting", label: "Waiting", count: counts.waiting },
          { id: "resolved", label: "Resolved", count: counts.resolved },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyPanel
          title={filtered ? (about === "other" ? "No other reports here" : `No reports about ${aboutLabel} here`) : tab === "waiting" ? "Nothing waiting" : tab === "resolved" ? "No resolved reports yet" : "No reports yet"}
          body={
            filtered
              ? "Nothing in this tab is about that. Try another tab, or set About back to Everything."
              : tab === "resolved"
                ? "Reports you resolve are kept here, with what you decided."
                : "When a member reports someone from a Handshake room or an opportunity, it lands here."
          }
          action={
            filtered ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setAbout("everything")}>
                Show everything
              </Button>
            ) : undefined
          }
        />
      ) : (
        <section className={cn(CARD, "overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-body-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-muted/30 text-caption uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Report about</th>
                  <th className="px-3 py-3 font-medium">Reason</th>
                  <th className="px-3 py-3 font-medium">Reported by</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {pageRows.map((report) => {
                  const waiting = report.status === "open";
                  const isSelected = open && selectedId === report.id;
                  return (
                    <tr
                      key={report.id}
                      tabIndex={0}
                      onClick={() => show(report.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          show(report.id);
                        }
                      }}
                      aria-label={`Open the report about ${reportSubject(report)}`}
                      className={cn(
                        "cursor-pointer motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70",
                        isSelected ? "bg-accent/[0.07]" : "hover:bg-surface-muted/50",
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-3">
                          <Avatar name={reportSubject(report)} src={subjectPhoto(report)} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-foreground">{reportSubject(report)}</span>
                            <span className="block text-caption text-muted">{report.kind === "person" ? "Person" : "Opportunity"}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-foreground/90">{report.reason}</td>
                      <td className="px-3 py-3.5 text-muted">{personName(report.byHandle)}</td>
                      <td className="px-3 py-3.5">
                        <StatusPill tone={waiting ? "waiting" : "done"}>{waiting ? "Waiting" : "Resolved"}</StatusPill>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-muted">{whenText(report.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={current} pageSize={PAGE_SIZE} total={rows.length} onChange={setPage} noun="reports" />
        </section>
      )}

      {selected ? <ReportSheet report={selected} open={open} onClose={close} /> : null}
    </>
  );
}

/** One report, in full, in the panel that slides in from the right. The decision is made here. */
function ReportSheet({ report, open, onClose }: { report: CxReport; open: boolean; onClose: () => void }) {
  const [action, setAction] = useState<ReportAction>("warn");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const waiting = report.status === "open";
  const about = reportedHandle(report);

  // A different report starts with a clean form.
  useEffect(() => {
    setAction("warn");
    setNote("");
    setError("");
  }, [report.id]);

  function resolve() {
    try {
      resolveReport(report.id, action, note);
      setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not resolve this report.");
    }
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      dirty={waiting && note.trim() !== ""}
      title={reportSubject(report)}
      footer={
        waiting ? (
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="button" onClick={resolve}>
              Resolve report
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="space-y-6">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={reportSubject(report)} src={subjectPhoto(report)} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-body font-semibold text-foreground">{reportSubject(report)}</p>
            <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
              <StatusPill tone={waiting ? "waiting" : "done"}>{waiting ? "Waiting" : "Resolved"}</StatusPill>
              {report.kind === "project" && about ? <span className="truncate text-body-sm text-muted">Posted by {personName(about)}</span> : null}
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 text-body-sm sm:grid-cols-2">
          <div>
            <dt className="text-caption text-muted">Reported by</dt>
            <dd className="mt-0.5 font-medium text-foreground">{personName(report.byHandle)}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">When</dt>
            <dd className="mt-0.5 font-medium text-foreground">{whenText(report.createdAt)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-caption text-muted">Reason</dt>
            <dd className="mt-0.5 font-medium text-foreground">{report.reason}</dd>
          </div>
        </dl>

        <div className="rounded-xl border border-border-subtle bg-surface-muted/60 p-4">
          <p className="text-caption font-medium text-muted">What they wrote</p>
          <p className="mt-1.5 whitespace-pre-line text-body-sm leading-6 text-foreground/90">{report.details || "They didn't add any details."}</p>
        </div>

        {waiting ? (
          <>
            <fieldset className="space-y-2.5">
              <legend className="mb-2 text-body-sm font-semibold text-foreground">What do you want to do?</legend>
              {REPORT_ACTIONS.map((item) => (
                <ChoiceCard
                  key={item.id}
                  name={`action-${report.id}`}
                  checked={action === item.id}
                  onSelect={() => setAction(item.id)}
                  title={item.label}
                  hint={item.hint}
                />
              ))}
            </fieldset>
            <Field label="Note for the record" htmlFor={`note-${report.id}`} hint="Only admins see this. It goes in the audit log.">
              <Textarea
                id={`note-${report.id}`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-[5.5rem]"
                placeholder="What did you check, and why did you decide this?"
              />
            </Field>
            {error ? <p className="text-body-sm text-destructive">{error}</p> : null}
          </>
        ) : (
          <div className="rounded-xl border border-success/30 bg-success-muted p-4">
            <p className="text-body-sm font-semibold text-success">{report.resolution ? OUTCOME[report.resolution.action] : "Resolved"}</p>
            {report.resolution ? <p className="mt-1 text-caption text-muted">Resolved {whenText(report.resolution.at)}</p> : null}
            {report.resolution?.note ? <p className="mt-2 whitespace-pre-line text-body-sm text-foreground/90">{report.resolution.note}</p> : null}
          </div>
        )}
      </div>
    </SideSheet>
  );
}
