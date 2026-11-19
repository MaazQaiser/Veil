import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { REPORT_ACTIONS, adminReports, personName, reportSubject, reportedHandle, resolveReport, type ReportAction } from "@/lib/adminStore";
import type { CxReport } from "@/lib/cxProjectStore";
import { relativeTime } from "@/lib/time";
import { useAdmin } from "@/lib/useAdmin";
import { AdminPageHeader, ChoiceCard, EmptyPanel, Panel, StatusPill, TabBar, whenText } from "./parts";

const OUTCOME: Record<ReportAction, string> = {
  warn: "Warned the person",
  none: "No action needed",
  deactivate: "Deactivated their account",
};

export function AdminReportsPage() {
  useAdmin();
  const [params, setParams] = useSearchParams();
  const all = adminReports();
  const waiting = all.filter((item) => item.status === "open");
  const resolved = all.filter((item) => item.status === "resolved");
  const wanted = params.get("open") ?? "";
  const [tab, setTab] = useState<"waiting" | "resolved">("waiting");
  const [selectedId, setSelectedId] = useState(wanted);

  // Jumping in from the Overview opens that report on the right tab.
  useEffect(() => {
    if (!wanted) return;
    const target = all.find((item) => item.id === wanted);
    if (target) {
      setTab(target.status === "open" ? "waiting" : "resolved");
      setSelectedId(wanted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted]);

  const list = tab === "waiting" ? waiting : resolved;
  const selected = list.find((item) => item.id === selectedId) ?? list[0];

  function pick(id: string) {
    setSelectedId(id);
    if (wanted) setParams({}, { replace: true });
  }

  return (
    <>
      <AdminPageHeader
        title="Reports"
        lede="Members report people and opportunities here. Review each one, decide what to do, and both people are told."
      />
      <TabBar
        label="Reports"
        value={tab}
        onChange={(next) => {
          setTab(next);
          setSelectedId("");
        }}
        tabs={[
          { id: "waiting", label: "Needs review", count: waiting.length },
          { id: "resolved", label: "Resolved", count: resolved.length },
        ]}
      />

      {list.length === 0 ? (
        <EmptyPanel
          title={tab === "waiting" ? "Nothing waiting" : "No resolved reports yet"}
          body={
            tab === "waiting"
              ? "When a member reports someone from a Handshake room or an opportunity, it lands here."
              : "Reports you resolve are kept here, with what you decided."
          }
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <ul className="space-y-3">
            {list.map((report) => (
              <li key={report.id}>
                <ReportRow report={report} active={selected?.id === report.id} onPick={() => pick(report.id)} />
              </li>
            ))}
          </ul>
          {selected ? <ReportDetail key={selected.id} report={selected} /> : null}
        </div>
      )}
    </>
  );
}

function ReportRow({ report, active, onPick }: { report: CxReport; active: boolean; onPick: () => void }) {
  const open = report.status === "open";
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border bg-surface p-4 text-left motion-safe:transition-colors",
        active ? "border-accent" : "border-border hover:border-foreground/30",
      )}
    >
      <Avatar name={personName(reportedHandle(report))} size="md" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-body-sm font-semibold text-foreground">{reportSubject(report)}</span>
          <StatusPill tone={open ? "waiting" : "done"}>{open ? "Needs review" : "Resolved"}</StatusPill>
        </span>
        <span className="mt-1 block truncate text-caption text-muted">
          {report.reason} · {report.kind === "person" ? "Person" : "Opportunity"}
        </span>
        <span className="mt-1 block truncate text-caption text-muted">
          Reported by {personName(report.byHandle)} · {relativeTime(report.createdAt)}
        </span>
      </span>
    </button>
  );
}

function ReportDetail({ report }: { report: CxReport }) {
  const [action, setAction] = useState<ReportAction>("warn");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const open = report.status === "open";
  const about = reportedHandle(report);

  function resolve() {
    try {
      resolveReport(report.id, action, note);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not resolve this report.");
    }
  }

  return (
    <Panel className="lg:sticky lg:top-6" bodyClassName="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption font-medium uppercase tracking-wide text-muted">
            {report.kind === "person" ? "Report about a person" : "Report about an opportunity"}
          </p>
          <h2 className="mt-1 truncate text-h4 font-semibold text-foreground">{reportSubject(report)}</h2>
          {about && report.kind === "project" ? <p className="mt-0.5 text-body-sm text-muted">Posted by {personName(about)}</p> : null}
        </div>
        <StatusPill tone={open ? "waiting" : "done"}>{open ? "Needs review" : "Resolved"}</StatusPill>
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
        <p className="mt-1.5 whitespace-pre-line text-body-sm leading-6 text-foreground/90">
          {report.details || "They didn't add any details."}
        </p>
      </div>

      {open ? (
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
          <div className="flex justify-end">
            <Button type="button" onClick={resolve}>
              Resolve report
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-success/30 bg-success-muted p-4">
          <p className="text-body-sm font-semibold text-success">{report.resolution ? OUTCOME[report.resolution.action] : "Resolved"}</p>
          <p className="mt-1 text-caption text-muted">
            {report.resolution ? `Resolved ${whenText(report.resolution.at)}` : null}
          </p>
          {report.resolution?.note ? <p className="mt-2 whitespace-pre-line text-body-sm text-foreground/90">{report.resolution.note}</p> : null}
        </div>
      )}
    </Panel>
  );
}
