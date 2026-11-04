import { useState, type ChangeEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { IconBookmark, IconCalendar, IconChevronLeft, IconClock, IconClose, IconEdit, IconLock, IconMapPin, IconRefresh, IconTrash, IconWallet } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/overlays";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { useCitySession } from "@/lib/citySession";
import {
  answerProjectQuestion,
  canHomeownerHandshake,
  closeCxProject,
  confirmProjectScopeChange,
  deleteCxProject,
  CX_BUDGET_BANDS,
  CX_LIVE_DAYS,
  CX_MAX_PHOTOS,
  CX_MAX_OPEN_HANDSHAKES,
  CX_TIMINGS,
  editLiveProject,
  extendCxProject,
  getCxProject,
  homeownerInterested,
  interestsForProject,
  keepCurrentScope,
  openProjectHandshakesFor,
  originalProjectDescription,
  proposedScopeText,
  questionsForProject,
  respondentsFor,
  toggleSavedContractor,
  type CxBudgetBand,
  type CxProject,
  type CxQuestion,
  type CxRespondent,
  type CxTiming,
} from "@/lib/cxProjectStore";
import { MY_OPPORTUNITIES_PATH, projectHandshakeHref, vaelanceCompareHref, vaelanceHref } from "@/lib/cxRoutes";
import { useCxProjects } from "@/lib/useCxProjects";
import { CategoryMark } from "@/pages/need/OpportunityChrome";
import { displayNameFor } from "@/lib/cxProjectStore";
import { getConnection, getConnections } from "@/lib/vaelStore";
import { formatDate, relativeTime } from "@/lib/time";

export function ProjectDetailPage() {
  useCxProjects();
  const { projectId = "" } = useParams();
  const { session } = useCitySession();
  const project = getCxProject(projectId);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [closePrompt, setClosePrompt] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState(false);
  const navigate = useNavigate();

  if (!project) {
    return (
      <div className="flex flex-1 flex-col">
        <h1 className="font-sans text-h2 font-medium text-foreground">Opportunity not found</h1>
        <p className="mt-2 text-body text-muted">That opportunity is not on this device.</p>
        <Link to={MY_OPPORTUNITIES_PATH} className={buttonClassName({ className: "mt-6 w-fit" })}>
          Your opportunities
        </Link>
      </div>
    );
  }

  if (session.signedIn && project.handle && project.handle !== session.handle) {
    return <Navigate to={MY_OPPORTUNITIES_PATH} replace />;
  }

  const respondents = respondentsFor(project);
  const questions = questionsForProject(project.id);
  const closed = project.status === "closed" || project.status === "expired";
  const original = originalProjectDescription(project);
  const saved = interestsForProject(project.id).filter((item) => item.savedByHomeowner);
  const handshakes = getConnections().filter(
    (item) => item.source === "project_interest" && item.projectId === project.id,
  );
  const liveDaysLeft =
    project.liveUntil && project.status === "live"
      ? Math.max(0, Math.ceil((Date.parse(project.liveUntil) - Date.now()) / 86400000))
      : 0;
  const openHandshake = handshakes.find((item) => item.status === "connected");
  const fullTime = liveDaysLeft >= CX_LIVE_DAYS;
  const handshakesOpen = openProjectHandshakesFor(session.handle).length;
  const canShake = canHomeownerHandshake(session.handle);
  const orderedRespondents = [...respondents].sort((a, b) => {
    const rank = (person: CxRespondent) => {
      const connection = person.interest.connectionId ? getConnection(person.interest.connectionId) : undefined;
      if (connection?.status === "connected") return 0;
      if (person.interest.savedByHomeowner) return 1;
      return connection ? 3 : 2;
    };
    return rank(a) - rank(b) || b.alignment - a.alignment;
  });

  const location = [project.city, project.postalCode].filter(Boolean).join(" · ");
  const posted = formatDate(project.publishedAt || project.createdAt);

  return (
    <div className="flex flex-1 flex-col">
      <Link
        to={MY_OPPORTUNITIES_PATH}
        className="mb-5 inline-flex w-fit items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
      >
        <IconChevronLeft className="h-3.5 w-3.5" />
        Back to Your opportunities
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          {editing && project.status === "live" ? (
            <EditProjectForm project={project} onDone={() => setEditing(false)} />
          ) : null}

          <article className="rounded-2xl border border-border bg-surface p-5 sm:p-8">
            <header className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent [&_svg]:h-6 [&_svg]:w-6">
                  <CategoryMark category={project.category} />
                </span>
                <div className="min-w-0">
                  <p className="text-body-sm text-muted">
                    Your opportunity{project.firstName ? ` · ${project.firstName}` : ""}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium leading-tight tracking-tight text-foreground">
                      {project.category || "Opportunity"}
                    </h1>
                    <Badge tone={closed ? "default" : "live"}>{closed ? "Closed" : "Live"}</Badge>
                    {project.status === "live" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-caption font-medium text-foreground">
                        <IconClock className="h-3.5 w-3.5 text-muted" />
                        {liveDaysLeft} {liveDaysLeft === 1 ? "day" : "days"} left
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {project.status === "live" ? (
                  <>
                    <ActionIcon label={editing ? "Stop editing" : "Edit"} active={editing} onClick={() => setEditing((value) => !value)}>
                      <IconEdit className="h-[18px] w-[18px]" />
                    </ActionIcon>
                    <ActionIcon
                      label={fullTime ? "Already at the full 7 days" : "Renew for 7 days"}
                      disabled={fullTime}
                      onClick={() => extendCxProject(project.id)}
                    >
                      <IconRefresh className="h-[18px] w-[18px]" />
                    </ActionIcon>
                    <ActionIcon label="Close" onClick={() => setClosePrompt(true)}>
                      <IconClose className="h-[18px] w-[18px]" />
                    </ActionIcon>
                  </>
                ) : (
                  <ActionIcon label="Reopen" onClick={() => extendCxProject(project.id)}>
                    <IconRefresh className="h-[18px] w-[18px]" />
                  </ActionIcon>
                )}
                <ActionIcon label="Delete" danger onClick={() => setDeletePrompt(true)}>
                  <IconTrash className="h-[18px] w-[18px]" />
                </ActionIcon>
              </div>
            </header>

            <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm text-muted">
              {project.timing ? (
                <li className="inline-flex items-center gap-1.5">
                  <IconCalendar className="h-4 w-4" />
                  {project.timing}
                </li>
              ) : null}
              {location ? (
                <li className="inline-flex items-center gap-1.5">
                  <IconMapPin className="h-4 w-4" />
                  {location}
                </li>
              ) : null}
              {project.budgetBand ? (
                <li className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <IconWallet className="h-4 w-4 text-muted" />
                  {project.budgetBand}
                </li>
              ) : null}
            </ul>

            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-accent/50 bg-accent/30 lg:grid-cols-4">
              {[
                ["Interested contractors", respondents.length],
                ["Saved", saved.length],
                ["Handshakes", handshakes.length],
                ["Questions", questions.length],
              ].map(([label, value]) => (
                <div key={label} className="bg-surface px-5 py-4">
                  <dt className="text-body-sm text-muted">{label}</dt>
                  <dd className="mt-1.5 text-[1.5rem] font-medium leading-none tabular-nums text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            <section className="mt-8">
              <h2 className="text-h4 font-medium text-foreground">About this project</h2>
              {closed && original.trim() !== project.description.trim() ? (
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="text-caption font-medium uppercase tracking-[0.1em] text-muted">Original description</p>
                    <p className="mt-1 whitespace-pre-wrap text-body text-foreground">{original}</p>
                  </div>
                  <div>
                    <p className="text-caption font-medium uppercase tracking-[0.1em] text-muted">Current scope</p>
                    <p className="mt-1 whitespace-pre-wrap text-body text-foreground">{project.description}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-body-lg leading-relaxed text-muted">
                  {project.description || "No description."}
                </p>
              )}
              {project.photos.length > 0 ? (
                <div className="mt-5 grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-3">
                  <img src={project.photos[0]} alt="" className="h-64 w-full object-cover sm:col-span-2 sm:h-72" />
                  {project.photos.length > 1 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:grid-rows-2">
                      {project.photos.slice(1, 3).map((src, index) => (
                        <img key={index} src={src} alt="" className="h-32 w-full object-cover sm:h-full" />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {project.photos.length > 3 ? (
                <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {project.photos.slice(3).map((src, index) => (
                    <li key={index}>
                      <img src={src} alt="" className="h-24 w-full rounded-lg object-cover" />
                    </li>
                  ))}
                </ul>
              ) : null}
              {project.video ? <video src={project.video} controls className="mt-5 max-h-64 w-full rounded-lg" /> : null}
            </section>

            <section className="mt-8 border-t border-border-subtle pt-8">
              <h2 className="text-h4 font-medium text-foreground">Project details</h2>
              <p className="mt-1 text-body-sm text-muted">What contractors see on the opportunity.</p>
              <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {[
                  ["Category", project.category || "Not listed"],
                  ["Location", location || "Not listed"],
                  ["Start timing", project.timing || "Not listed"],
                  ["Budget", project.budgetBand || "Not listed"],
                  ["Date posted", posted],
                  closed
                    ? ["Closed", project.closedAt ? formatDate(project.closedAt) : "Closed"]
                    : ["Closes", project.liveUntil ? formatDate(project.liveUntil) : "Not set"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 border-b border-border-subtle py-3 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
                    <dt className="text-body-sm text-muted">{label}</dt>
                    <dd className="min-w-0 break-words text-right text-body-sm font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {project.firstName || project.streetAddress || project.saveEmail || project.savePhone ? (
              <section className="mt-8 rounded-xl border border-dashed border-border p-5">
                <h2 className="flex items-center gap-2 text-body font-medium text-foreground">
                  <IconLock className="h-4 w-4 text-accent" />
                  Private to you
                </h2>
                <p className="mt-1 text-body-sm text-muted">Shared with a contractor only after a Handshake opens.</p>
                <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
                  {[
                    ["Shown as", project.firstName],
                    ["Street address", project.streetAddress],
                    ["Email", project.saveEmail],
                    ["Phone", project.savePhone],
                  ]
                    .filter(([, value]) => Boolean(value))
                    .map(([label, value]) => (
                      <div key={label} className="flex items-baseline justify-between gap-4 border-b border-border-subtle py-3 last:border-b-0">
                        <dt className="text-body-sm text-muted">{label}</dt>
                        <dd className="min-w-0 break-words text-right text-body-sm font-medium text-foreground">{value}</dd>
                      </div>
                    ))}
                </dl>
              </section>
            ) : null}

            <section className="mt-8 border-t border-border-subtle pt-8">
              <h2 className="text-h4 font-medium text-foreground">Questions on this project</h2>
              <p className="mt-1 text-body-sm text-muted">Answers belong to the project, not a private conversation.</p>
              <div className="mt-4">
            {questions.length === 0 ? (
                <p className="text-body-sm text-muted">No questions yet.</p>
              ) : (
                <ul className="space-y-3">
                  {questions.map((item) => (
                    <li key={item.id} className="rounded-xl border border-border-subtle p-4">
                      <p className="text-body font-medium text-foreground">{item.body}</p>
                      <p className="mt-1 text-caption text-muted">From {displayNameFor(item.fromHandle)}</p>
                      {closed ? (
                        <p className="mt-2 text-body-sm text-foreground">{item.answer ? `Answer: ${item.answer}` : "No answer recorded."}</p>
                      ) : item.scopeChangeRequested && !item.scopeChangeConfirmed ? (
                        <ScopeConfirm projectDescription={project.description} question={item} homeowner={session.handle} />
                      ) : item.answer ? (
                        <p className="mt-2 text-body-sm text-foreground">Answer: {item.answer}</p>
                      ) : (
                        <AnswerForm questionId={item.id} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
              </div>
            </section>
          </article>

          {closed ? (
            <>
              <Panel title="Saved contractors">
                {saved.length === 0 ? (
                  <p className="text-body-sm text-muted">None saved.</p>
                ) : (
                  <ul className="space-y-2 text-body">
                    {saved.map((item) => (
                      <li key={item.id}>{displayNameFor(item.contractorHandle)}</li>
                    ))}
                  </ul>
                )}
              </Panel>
              <Panel title="Previous Handshakes">
                {handshakes.length === 0 ? (
                  <p className="text-body-sm text-muted">No Handshakes.</p>
                ) : (
                  <ul className="space-y-3">
                    {handshakes.map((item) => {
                      const other = item.requesterHandle === project.handle ? item.counterpartHandle : item.requesterHandle;
                      return (
                        <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-body">
                            {displayNameFor(other)} · {item.status === "connected" ? "Active" : "Closed"}
                          </p>
                          <Link to={projectHandshakeHref(project.id, item.id)} className={buttonClassName({ size: "sm", variant: "outline" })}>
                            {item.status === "connected" ? "Handshake room" : "Handshake record"}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
              <Panel title="Project history">
                <ul className="space-y-2 text-body-sm text-muted">
                  {project.history.map((item) => (
                    <li key={`${item.at}-${item.kind}`} className="whitespace-pre-wrap">
                      {item.kind === "scope_change" ? item.note : `${item.kind}: ${item.note}`}
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/15 via-accent/[0.06] to-transparent p-5 sm:p-6">
            <p className="text-caption font-semibold uppercase tracking-[0.14em] text-accent">
              {closed ? "Contractor responses" : "Respond"}
            </p>
            <h2 className="mt-2 text-h4 font-medium text-foreground">
              {respondents.length > 0
                ? `${respondents.length} ${respondents.length === 1 ? "contractor is" : "contractors are"} interested`
                : closed
                  ? "No responses"
                  : "Waiting for contractors"}
            </h2>
            <p className="mt-1.5 text-body-sm text-muted">
              {closed
                ? "New responses are stopped while this is closed. Handshakes stay available."
                : respondents.length > 0
                  ? "Say you are interested to open a Handshake with a contractor."
                  : "Matching contractors show up here. When you are both interested, the Handshake opens."}
            </p>

            {closed ? null : (
              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 text-caption text-muted">
                  <span>Handshakes open</span>
                  <span className="tabular-nums text-foreground">
                    {handshakesOpen} of {CX_MAX_OPEN_HANDSHAKES}
                  </span>
                </div>
                <div className="mt-1.5 flex gap-1.5" role="img" aria-label={`${handshakesOpen} of ${CX_MAX_OPEN_HANDSHAKES} Handshakes open`}>
                  {Array.from({ length: CX_MAX_OPEN_HANDSHAKES }, (_, index) => (
                    <span key={index} className={cn("h-1 flex-1 rounded-full", index < handshakesOpen ? "bg-accent" : "bg-foreground/15")} />
                  ))}
                </div>
                {!canShake ? (
                  <p className="mt-2 text-caption text-destructive">
                    You have {CX_MAX_OPEN_HANDSHAKES} Handshakes open. Close one to start another.
                  </p>
                ) : null}
              </div>
            )}

            {!closed && orderedRespondents.length >= 2 ? (
              <Link
                to={vaelanceCompareHref(orderedRespondents[0].handle, orderedRespondents[1].handle)}
                className={buttonClassName({ variant: "outline", className: "mt-5 w-full justify-center rounded-full bg-surface" })}
              >
                Compare the top two
              </Link>
            ) : null}
          </section>

          {error ? <p className="text-label text-destructive">{error}</p> : null}

          {orderedRespondents.length > 0 ? (
            <>
              <h2 id="respond" className="scroll-mt-28 pt-2 text-h4 font-medium text-foreground">
                {closed ? "Contractor responses" : "Contractors who responded"}
              </h2>
              <ul className="space-y-3">
                {orderedRespondents.map((person) => (
                  <RespondentCard
                    key={person.handle}
                    person={person}
                    projectId={project.id}
                    homeowner={session.handle}
                    readOnly={closed}
                    canShake={canShake}
                    onError={setError}
                  />
                ))}
              </ul>
            </>
          ) : (
            <span id="respond" className="block scroll-mt-28" />
          )}

          {closePrompt && project.status === "live" ? (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-body font-medium text-foreground">Close this project?</p>
              <p className="mt-1 text-body-sm text-muted">This will stop new contractors from responding to the project.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setClosePrompt(false)}>
                  Keep open
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    closeCxProject(project.id);
                    setClosePrompt(false);
                    setEditing(false);
                  }}
                >
                  Close project
                </Button>
              </div>
            </div>
          ) : null}

          {project.status === "live" && project.day5Reminded ? (
            <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5">
              <p className="text-body-sm font-medium text-foreground">This project will close in 2 days.</p>
              <Button type="button" size="sm" className="mt-3 rounded-full" onClick={() => extendCxProject(project.id)}>
                Renew for 7 days
              </Button>
            </div>
          ) : null}

          {openHandshake ? (
            <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5">
              <p className="text-body-sm font-medium text-foreground">A Handshake is open on this opportunity.</p>
              <Link to={projectHandshakeHref(project.id, openHandshake.id)} className={buttonClassName({ className: "mt-3 w-full" })}>
                Open Handshake
              </Link>
            </div>
          ) : null}
        </aside>
      </div>

      <Dialog
        open={deletePrompt}
        onClose={() => setDeletePrompt(false)}
        title="Delete this opportunity?"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setDeletePrompt(false)}>
              Keep it
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                deleteCxProject(project.id);
                setDeletePrompt(false);
                navigate(MY_OPPORTUNITIES_PATH, { replace: true });
              }}
            >
              Delete opportunity
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-body-sm text-muted">
          <p>
            This removes the opportunity, the interest and questions on it
            {handshakes.length > 0 ? `, and ${handshakes.length} ${handshakes.length === 1 ? "Handshake" : "Handshakes"}` : ""}.
            {respondents.length > 0 ? " Contractors who responded are told it was removed." : ""} This cannot be undone.
          </p>
          <p>To stop new responses but keep the record, close it instead.</p>
        </div>
      </Dialog>
    </div>
  );
}

/** A round icon button that names itself in a tooltip on hover and keyboard focus. */
function ActionIcon({
  label,
  onClick,
  children,
  danger = false,
  active = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active || undefined}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full border motion-safe:transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          danger
            ? "border-destructive/30 bg-destructive-muted text-destructive hover:border-destructive/60"
            : active
              ? "border-accent/60 bg-accent/10 text-accent"
              : "border-border bg-surface text-foreground hover:border-foreground/30 hover:bg-surface-muted",
        )}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-caption font-medium text-background opacity-0 shadow-md motion-safe:transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-h4 font-medium text-foreground">{title}</h2>
      {note ? <p className="mt-1 text-body-sm text-muted">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EditProjectForm({ project, onDone }: { project: CxProject; onDone: () => void }) {
  const [nextDescription, setNextDescription] = useState(project.description);
  const [nextCity, setNextCity] = useState(project.city);
  const [nextPostal, setNextPostal] = useState(project.postalCode);
  const [nextStreet, setNextStreet] = useState(project.streetAddress);
  const [nextTiming, setNextTiming] = useState<CxTiming | "">(project.timing);
  const [nextBudget, setNextBudget] = useState<CxBudgetBand | "">(project.budgetBand);
  const [photos, setPhotos] = useState<string[]>(project.photos);
  const [video, setVideo] = useState(project.video);
  const [error, setError] = useState("");

  function onFiles(event: ChangeEvent<HTMLInputElement>, kind: "photo" | "video") {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    for (const file of files) {
      if (file.size > 400_000) {
        setError("Keep each file under 400 KB on this device.");
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        if (kind === "video") setVideo(dataUrl);
        else setPhotos((current) => [...current, dataUrl].slice(0, CX_MAX_PHOTOS));
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-accent/40 bg-surface p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!nextDescription.trim() || !nextCity.trim() || !nextPostal.trim() || !nextTiming || !nextBudget) {
          setError("Finish the project details before saving.");
          return;
        }
        // Send only what changed, so contractors are not told about an edit that changed nothing.
        const patch: Parameters<typeof editLiveProject>[1] = {};
        if (nextDescription.trim() !== project.description.trim()) patch.description = nextDescription.trim();
        if (nextCity.trim() !== project.city) patch.city = nextCity.trim();
        if (nextPostal.trim() !== project.postalCode) patch.postalCode = nextPostal.trim();
        if (nextStreet.trim() !== project.streetAddress) patch.streetAddress = nextStreet.trim();
        if (nextTiming !== project.timing) patch.timing = nextTiming;
        if (nextBudget !== project.budgetBand) patch.budgetBand = nextBudget;
        if (JSON.stringify(photos) !== JSON.stringify(project.photos)) patch.photos = photos;
        if (video !== project.video) patch.video = video;
        if (Object.keys(patch).length > 0) editLiveProject(project.id, patch);
        onDone();
      }}
    >
      <div>
        <h2 className="text-h4 font-medium text-foreground">Edit opportunity</h2>
        <p className="mt-1 text-body-sm text-muted">Contractors who showed interest are told when the details change.</p>
      </div>
      <label className="block text-body-sm font-medium">
        Description
        <Textarea className="mt-1" value={nextDescription} onChange={(event) => setNextDescription(event.target.value)} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-body-sm font-medium">
          City / Town
          <Input className="mt-1" value={nextCity} onChange={(event) => setNextCity(event.target.value)} />
        </label>
        <label className="block text-body-sm font-medium">
          ZIP / Postal Code
          <Input className="mt-1" value={nextPostal} onChange={(event) => setNextPostal(event.target.value)} />
        </label>
        <label className="block text-body-sm font-medium sm:col-span-2">
          Street address <span className="font-normal text-muted">(private, shared after a Handshake)</span>
          <Input className="mt-1" value={nextStreet} onChange={(event) => setNextStreet(event.target.value)} />
        </label>
        <label className="block text-body-sm font-medium">
          Start
          <Select className="mt-1" value={nextTiming} onChange={(event) => setNextTiming(event.target.value as CxTiming)}>
            {CX_TIMINGS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
        <label className="block text-body-sm font-medium">
          Budget
          <Select className="mt-1" value={nextBudget} onChange={(event) => setNextBudget(event.target.value as CxBudgetBand)}>
            {CX_BUDGET_BANDS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-body-sm font-medium">Photos</p>
          <p className="text-caption text-muted">
            {photos.length} of {CX_MAX_PHOTOS}
          </p>
        </div>
        {photos.length > 0 ? (
          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((src, index) => (
              <li key={`${index}-${src.slice(-12)}`} className="relative">
                <img src={src} alt="" className="h-20 w-full rounded-lg object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => setPhotos((current) => current.filter((_, at) => at !== index))}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                >
                  <IconClose className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {photos.length < CX_MAX_PHOTOS ? (
          <Input className="mt-2" type="file" accept="image/*" multiple aria-label="Add photos" onChange={(event) => onFiles(event, "photo")} />
        ) : null}
      </div>

      <div>
        <p className="text-body-sm font-medium">Short video</p>
        {video ? (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2">
            <p className="text-body-sm text-success">Video saved on this device.</p>
            <button type="button" className="text-body-sm text-muted hover:text-foreground" onClick={() => setVideo("")}>
              Remove
            </button>
          </div>
        ) : (
          <Input className="mt-2" type="file" accept="video/*" aria-label="Add a short video" onChange={(event) => onFiles(event, "video")} />
        )}
      </div>

      {error ? <p className="text-label text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" className="rounded-full">
          Save changes
        </Button>
        <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AnswerForm({ questionId }: { questionId: string }) {
  const [answer, setAnswer] = useState("");
  const [scope, setScope] = useState(false);
  return (
    <form
      className="mt-3 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!answer.trim()) return;
        answerProjectQuestion(questionId, answer, scope);
        setAnswer("");
      }}
    >
      <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Answer once for everyone." />
      <label className="flex items-center gap-2 text-body-sm">
        <input type="checkbox" checked={scope} onChange={(event) => setScope(event.target.checked)} />
        This changes the project scope
      </label>
      {scope ? (
        <p className="text-body-sm text-muted">The project stays as it is until you confirm the updated scope.</p>
      ) : null}
      <Button type="submit" size="sm">
        {scope ? "Review change" : "Answer"}
      </Button>
    </form>
  );
}

function ScopeConfirm({
  projectDescription,
  question,
  homeowner,
}: {
  projectDescription: string;
  question: CxQuestion;
  homeowner: string;
}) {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-body-sm text-foreground">Answer: {question.answer}</p>
      <h3 className="text-body font-medium">Updated project information</h3>
      <p className="whitespace-pre-wrap text-body-sm">{proposedScopeText(projectDescription, question.answer)}</p>
      <p className="text-body-sm text-muted">Confirm this change before the project is updated.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => confirmProjectScopeChange(question.id, homeowner)}>
          Confirm change
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => keepCurrentScope(question.id, homeowner)}>
          Keep current scope
        </Button>
      </div>
    </div>
  );
}

function RespondentCard({
  person,
  projectId,
  homeowner,
  readOnly,
  canShake,
  onError,
}: {
  person: CxRespondent;
  projectId: string;
  homeowner: string;
  readOnly: boolean;
  canShake: boolean;
  onError: (value: string) => void;
}) {
  const navigate = useNavigate();
  const name = displayNameFor(person.handle);
  const connection = person.interest.connectionId ? getConnection(person.interest.connectionId) : undefined;
  const connected = connection?.status === "connected";
  const saved = person.interest.savedByHomeowner;
  const blurb = person.profile?.headline || (person.profile?.trades ?? []).join(", ");
  const primary = "h-10 w-full justify-center rounded-full";

  return (
    <li className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar name={name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-body font-semibold text-foreground">{name}</p>
            {readOnly ? null : (
              <button
                type="button"
                aria-label={saved ? "Remove from saved" : "Save contractor"}
                aria-pressed={saved}
                title={saved ? "Saved" : "Save"}
                onClick={() => toggleSavedContractor(projectId, person.handle, homeowner)}
                className={cn(
                  "-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full motion-safe:transition-colors",
                  saved ? "text-accent" : "text-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <IconBookmark className={cn("h-[18px] w-[18px]", saved && "fill-current")} />
              </button>
            )}
          </div>
          {blurb ? <p className="mt-0.5 truncate text-body-sm text-muted">{blurb}</p> : null}
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted">
            <span className="rounded-full border border-border px-2 py-0.5 font-medium text-foreground">
              {person.group === "whole" ? "Whole project" : "Specialty"}
            </span>
            <span>Responded {relativeTime(person.interest.createdAt) || "just now"}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {connection && (connected || connection.status === "closed") ? (
          <Link
            to={projectHandshakeHref(projectId, connection.id)}
            className={buttonClassName({ size: "sm", variant: connected ? "primary" : "outline", className: primary })}
          >
            {connected ? "Open Handshake" : "Handshake record"}
          </Link>
        ) : readOnly ? null : (
          <Button
            type="button"
            size="sm"
            className={primary}
            disabled={!canShake}
            title={canShake ? undefined : "Close a Handshake before starting another."}
            onClick={() => {
              try {
                const next = homeownerInterested(projectId, person.handle, homeowner);
                onError("");
                if (next.connectionId) navigate(projectHandshakeHref(projectId, next.connectionId));
              } catch (err) {
                onError(err instanceof Error ? err.message : "Could not connect.");
              }
            }}
          >
            I'm interested
          </Button>
        )}
        <Link
          to={vaelanceHref(person.handle)}
          className={buttonClassName({ size: "sm", variant: "outline", className: "h-10 w-full justify-center rounded-full" })}
        >
          View profile
        </Link>
      </div>
    </li>
  );
}
