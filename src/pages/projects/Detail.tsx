import { useState, type ChangeEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { IconBookmark, IconCalendar, IconChevronLeft, IconClose, IconEdit, IconInfo, IconLock, IconMapPin, IconRefresh, IconTrash, IconUsers, IconWallet } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/overlays";
import { ActionIcon } from "@/components/ui/action-icon";
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
  const [searchParams] = useSearchParams();
  const [editing, setEditing] = useState(searchParams.get("edit") === "1");
  const [closePrompt, setClosePrompt] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState(false);
  const [interestTab, setInterestTab] = useState<"all" | "saved" | "questions">("all");
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

  const endsLine = closed
    ? `Posted ${posted} · ${project.closedAt ? `Closed ${formatDate(project.closedAt)}` : "Closed"}`
    : `Posted ${posted} · Live until ${project.liveUntil ? formatDate(project.liveUntil) : "soon"}`;
  const savedRespondents = orderedRespondents.filter((person) => person.interest.savedByHomeowner);
  const interestedTitle =
    respondents.length === 0
      ? "No contractor has responded yet."
      : `${respondents.length} ${respondents.length === 1 ? "contractor has" : "contractors have"} responded.`;
  const interestTabs = [
    { id: "all" as const, label: "All", count: respondents.length },
    { id: "saved" as const, label: "Saved", count: saved.length },
    { id: "questions" as const, label: "Questions", count: questions.length },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <Link
        to={MY_OPPORTUNITIES_PATH}
        className="mb-5 inline-flex w-fit items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
      >
        <IconChevronLeft className="h-3.5 w-3.5" />
        Your opportunities
      </Link>

      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Interested contractors", respondents.length],
          ["Saved", saved.length],
          ["Handshakes", handshakes.length],
          ["Questions", questions.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-accent/40 bg-surface px-5 py-4">
            <dt className="text-body-sm text-muted">{label}</dt>
            <dd className="mt-1.5 text-[1.75rem] font-medium leading-none tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      <Dialog
        open={editing && project.status === "live"}
        onClose={() => setEditing(false)}
        title="Edit opportunity"
        className="w-[min(44rem,calc(100%-2.5rem))]"
      >
        <EditProjectForm project={project} onDone={() => setEditing(false)} />
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_27rem] lg:items-start">
        <div className="relative min-w-0 overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-8">
          {closed ? (
            <p className="mb-6 rounded-xl border border-border bg-surface-muted/40 p-4 text-body-sm text-muted">
              This opportunity is closed. Contractors can no longer respond, but open Handshakes stay available.
            </p>
          ) : null}

          {closePrompt && project.status === "live" ? (
            <div className="mb-6 rounded-xl border border-border bg-surface-muted/40 p-4">
              <p className="text-body font-medium text-foreground">Close this opportunity?</p>
              <p className="mt-1 text-body-sm text-muted">Contractors will no longer be able to respond.</p>
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
                  Close opportunity
                </Button>
              </div>
            </div>
          ) : null}

          {project.status === "live" && project.day5Reminded ? (
            <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 p-4">
              <p className="text-body-sm font-medium text-foreground">This opportunity closes in 2 days.</p>
              <Button type="button" size="sm" className="mt-3 rounded-full" onClick={() => extendCxProject(project.id)}>
                Renew for 7 days
              </Button>
            </div>
          ) : null}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/15 blur-[80px]"
        />
        <header className="relative flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent shadow-[0_8px_24px_-10px_rgba(238,138,74,0.5)] [&_svg]:h-6 [&_svg]:w-6">
              <CategoryMark category={project.category} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium leading-tight tracking-tight text-foreground">
                  {project.category || "Opportunity"}
                </h1>
                <Badge tone={closed ? "default" : "live"}>{closed ? "Closed" : "Live"}</Badge>
              </div>
              <p className="mt-1 text-body-sm text-muted">{endsLine}</p>
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

        {closed && original.trim() !== project.description.trim() ? (
          <div className="relative mt-6 space-y-4">
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
          <p className="relative mt-6 max-w-3xl whitespace-pre-wrap text-body-lg leading-relaxed text-foreground/90">
            {project.description || "No description."}
          </p>
        )}

        <ul className="relative mt-5 flex flex-wrap gap-2">
          {[
            location ? { icon: IconMapPin, text: location } : null,
            project.timing ? { icon: IconCalendar, text: project.timing } : null,
            project.budgetBand ? { icon: IconWallet, text: project.budgetBand } : null,
          ]
            .filter((chip): chip is { icon: typeof IconMapPin; text: string } => Boolean(chip))
            .map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted/50 px-3.5 py-1.5 text-body-sm text-foreground"
              >
                <Icon className="h-4 w-4 text-accent" />
                {text}
              </li>
            ))}
        </ul>

        {project.photos.length > 0 ? (
          <div className="relative mt-6 grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-3">
            <img src={project.photos[0]} alt="" className="h-56 w-full object-cover sm:col-span-2 sm:h-64" />
            {project.photos.length > 1 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:grid-rows-2">
                {project.photos.slice(1, 3).map((src, index) => (
                  <img key={index} src={src} alt="" className="h-28 w-full object-cover sm:h-full" />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        {project.photos.length > 3 ? (
          <ul className="relative mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {project.photos.slice(3).map((src, index) => (
              <li key={index}>
                <img src={src} alt="" className="h-20 w-full rounded-lg object-cover" />
              </li>
            ))}
          </ul>
        ) : null}
        {project.video ? <video src={project.video} controls className="relative mt-4 max-h-64 w-full rounded-xl bg-black" /> : null}
        {project.firstName || project.streetAddress || project.saveEmail || project.savePhone ? (
          <div className="relative mt-8 border-t border-border-subtle pt-6">
            <h2 className="flex items-center gap-2 text-body font-semibold text-foreground">
              <IconLock className="h-4 w-4 text-accent" />
              Private details
            </h2>
            <p className="mt-1 text-body-sm text-muted">Only you can see these. A contractor sees them after a Handshake opens.</p>
            <dl className="mt-3 grid gap-x-10 sm:grid-cols-2">
              {[
                ["First name", project.firstName],
                ["Street address", project.streetAddress],
                ["Email", project.saveEmail],
                ["Phone", project.savePhone],
              ]
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 border-b border-border-subtle py-3 sm:[&:nth-last-child(-n+2)]:border-b-0">
                    <dt className="text-body-sm text-muted">{label}</dt>
                    <dd className="min-w-0 break-words text-right text-body-sm font-medium text-foreground">{value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        ) : null}
        </div>

        <div className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          {openHandshake ? (
            <div className="mb-5 rounded-xl border border-accent/30 bg-accent/10 p-4">
              <p className="text-body-sm font-medium text-foreground">A Handshake is open on this opportunity.</p>
              <Link to={projectHandshakeHref(project.id, openHandshake.id)} className={buttonClassName({ className: "mt-3 w-full" })}>
                Open Handshake
              </Link>
            </div>
          ) : null}
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div>
                <h2 className="text-h3 font-medium text-foreground">Responses</h2>
                <p className="mt-1 text-body-sm text-muted">{interestedTitle}</p>
              </div>
              {closed ? null : (
                <div className="w-full sm:w-60">
                  <div className="flex items-center justify-between gap-3 text-caption text-muted">
                    <span>Handshakes open</span>
                    <span className="tabular-nums">
                      <span className="font-semibold text-foreground">{handshakesOpen}</span> of {CX_MAX_OPEN_HANDSHAKES}
                    </span>
                  </div>
                  <div className="mt-1.5 flex gap-1.5" role="img" aria-label={`${handshakesOpen} of ${CX_MAX_OPEN_HANDSHAKES} Handshakes open`}>
                    {Array.from({ length: CX_MAX_OPEN_HANDSHAKES }, (_, index) => (
                      <span key={index} className={cn("h-1.5 flex-1 rounded-full", index < handshakesOpen ? "bg-accent" : "bg-foreground/15")} />
                    ))}
                  </div>
                  {!canShake ? (
                    <p className="mt-1.5 text-caption text-destructive">
                      You have {CX_MAX_OPEN_HANDSHAKES} Handshakes open. Close one to start another.
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3">
            <div role="tablist" aria-label="Responses" className="flex w-full gap-1 rounded-xl border border-border bg-surface-muted/40 p-1">
              {interestTabs.map((item) => {
                const on = interestTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setInterestTab(item.id)}
                    className={cn(
                      "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-body-sm font-medium motion-safe:transition-colors",
                      on ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-caption font-semibold tabular-nums",
                        on ? "bg-accent/20 text-accent" : "bg-surface-muted text-muted",
                      )}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
            {!closed && orderedRespondents.length >= 2 ? (
              <Link
                to={vaelanceCompareHref(orderedRespondents[0].handle, orderedRespondents[1].handle)}
                className="text-body-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                Compare the top two
              </Link>
            ) : null}
            </div>

            {error ? <p className="mt-3 text-label text-destructive">{error}</p> : null}

            <div className="mt-4 flex flex-1 flex-col">
              {interestTab === "questions" ? (
                questions.length === 0 ? (
                  <EmptyPanel icon={IconInfo} title="No questions yet" body="Questions from contractors will appear here." />
                ) : (
                  <ul className="space-y-3">
                    {questions.map((item) => (
                      <li key={item.id} className="rounded-2xl border border-border bg-surface p-5">
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
                )
              ) : (interestTab === "saved" ? savedRespondents : orderedRespondents).length === 0 ? (
                interestTab === "saved" ? (
                  <EmptyPanel icon={IconBookmark} title="No saved contractors" body="Bookmark a contractor to keep them here." />
                ) : (
                  <EmptyPanel
                    icon={IconUsers}
                    title="No responses yet"
                    body={
                      closed
                        ? "This opportunity was closed before anyone responded."
                        : "Contractors who do this kind of work in your area can see your opportunity. You'll be told when one responds."
                    }
                  />
                )
              ) : (
                <ul className="grid gap-4">
                  {(interestTab === "saved" ? savedRespondents : orderedRespondents).map((person) => (
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
              )}
            </div>
        </div>
      </div>

      {closed ? (
        <div className="mt-6 space-y-6">
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
              <Panel title="History">
                <ul className="space-y-2 text-body-sm text-muted">
                  {project.history.map((item) => (
                    <li key={`${item.at}-${item.kind}`} className="whitespace-pre-wrap">
                      {item.kind === "scope_change" ? item.note : `${item.kind}: ${item.note}`}
                    </li>
                  ))}
                </ul>
              </Panel>
        </div>
      ) : null}


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

function EmptyPanel({ icon: Icon, title, body }: { icon: typeof IconUsers; title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-body-lg font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-md text-body-sm leading-relaxed text-muted">{body}</p>
    </div>
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
      className="max-h-[calc(100dvh-16rem)] space-y-5 overflow-y-auto pr-1"
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
      <p className="text-body-sm text-muted">Contractors who showed interest are told when the details change.</p>
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
          <Input className="mt-2 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-accent/15 file:px-3.5 file:py-1.5 file:text-body-sm file:font-medium file:text-accent text-body-sm text-muted" type="file" accept="image/*" multiple aria-label="Add photos" onChange={(event) => onFiles(event, "photo")} />
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
          <Input className="mt-2 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-accent/15 file:px-3.5 file:py-1.5 file:text-body-sm file:font-medium file:text-accent text-body-sm text-muted" type="file" accept="video/*" aria-label="Add a short video" onChange={(event) => onFiles(event, "video")} />
        )}
      </div>

      {error ? <p className="text-label text-destructive">{error}</p> : null}
      <div className="sticky bottom-0 -mb-px flex flex-wrap gap-2 border-t border-border-subtle bg-[#141414] pb-1 pt-4">
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
