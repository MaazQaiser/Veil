import { useState, type ChangeEvent } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { IconBookmark, IconCalendar, IconClock, IconChevronLeft, IconClose, IconEdit, IconInfo, IconLock, IconMapPin, IconMessage, IconMessageCircle, IconRefresh, IconTrash, IconUser, IconUsers, IconWallet } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/overlays";
import { ActionIcon } from "@/components/ui/action-icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { stockPhoto } from "@/lib/stockPhotos";
import { useCitySession } from "@/lib/citySession";
import {
  answerProjectQuestion,
  bestMatchGroups,
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
  matchPercent,
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
import { getConnection, getConnections, getMessages } from "@/lib/vaelStore";
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
  const [interestTab, setInterestTab] = useState<"best" | "all" | "saved" | "questions">("best");
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
  const fullTime = liveDaysLeft >= CX_LIVE_DAYS;
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
  const bestGroups = bestMatchGroups(project);
  const bestHandles = new Set([...bestGroups.whole, ...bestGroups.specialty].map((person) => person.handle));
  const bestRespondents = orderedRespondents.filter((person) => bestHandles.has(person.handle));
  const interestedTitle =
    respondents.length === 0
      ? "No contractor has responded yet."
      : `${respondents.length} ${respondents.length === 1 ? "contractor has" : "contractors have"} responded.`;
  const HISTORY_LABEL: Record<string, string> = {
    published: "Published",
    edited: "Edited",
    extended: "Renewed",
    closed: "Closed",
    scope_change: "Scope changed",
  };
  const projectHistory = project.history.filter((item) => item.kind !== "created");
  const cover = stockPhoto(project.category);
  const interestTabs = [
    { id: "best" as const, label: "Best matches", count: bestRespondents.length },
    { id: "all" as const, label: "All respondents", count: respondents.length },
    { id: "saved" as const, label: "Saved", count: saved.length },
    { id: "questions" as const, label: "Questions", count: questions.length },
  ];
  const shownList = interestTab === "saved" ? savedRespondents : interestTab === "best" ? bestRespondents : orderedRespondents;

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
          { label: "Interested contractors", value: respondents.length, hint: "" },
          { label: "Saved", value: saved.length, hint: "" },
          { label: "Handshakes", value: handshakes.length, hint: `Private chats · up to ${CX_MAX_OPEN_HANDSHAKES} open at once` },
          { label: "Questions", value: questions.length, hint: "" },
        ].map(({ label, value, hint }) => (
          <div key={label} className="rounded-2xl border border-border bg-surface px-5 py-4">
            <dt className="text-body-sm text-muted">{label}</dt>
            <dd className="mt-1.5 text-[1.75rem] font-medium leading-none tabular-nums text-foreground">{value}</dd>
            {hint ? <p className="mt-2 text-caption text-muted">{hint}</p> : null}
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

      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <div className="order-2 flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:min-h-[36rem]">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div>
                <h2 className="text-h3 font-medium text-foreground">Who's interested</h2>
                <p className="mt-1 text-body-sm text-muted">{interestedTitle}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
            <div role="tablist" aria-label="Who's interested" className="grid w-full grid-cols-2 gap-1 rounded-xl border border-border bg-surface-muted/40 p-1 xl:grid-cols-4">
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
                      "inline-flex h-10 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-body-sm font-medium motion-safe:transition-colors",
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

            {!closed && !canShake ? (
              <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive-muted px-4 py-3 text-body-sm text-destructive">
                You have {CX_MAX_OPEN_HANDSHAKES} Handshakes open, which is the most at once. Close one to start another.
              </p>
            ) : null}

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
              ) : shownList.length === 0 ? (
                interestTab === "saved" ? (
                  <EmptyPanel icon={IconBookmark} title="No saved contractors" body="Bookmark a contractor to keep them here." />
                ) : interestTab === "best" && respondents.length > 0 ? (
                  <EmptyPanel icon={IconUsers} title="No best matches yet" body="Open All respondents to see everyone who is interested." />
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
                <ul className="grid grid-cols-1 gap-4">
                  {shownList.map((person) => (
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

        <div className="order-1 min-w-0 space-y-6">
          <div className="min-w-0 rounded-2xl border border-border bg-surface">
            <div className="relative h-56 overflow-hidden rounded-t-2xl bg-surface-muted sm:h-72">
              <img
                src={project.photos[0] ?? cover.src}
                alt=""
                className={cn("h-full w-full object-cover", !project.photos[0] && !cover.exact && "scale-110 blur-[5px]")}
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
              <span className="absolute left-3 top-3">
                <Badge tone={closed ? "default" : "live"} className="bg-background/70 backdrop-blur-sm">
                  {closed ? "Closed" : "Live"}
                </Badge>
              </span>
              <div className="absolute right-3 top-3 flex items-center gap-1.5">
                {project.status === "live" ? (
                  <>
                    <ActionIcon size="sm" tone="overlay" label={editing ? "Stop editing" : "Edit"} active={editing} onClick={() => setEditing((value) => !value)}>
                      <IconEdit className="h-4 w-4" />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      tone="overlay"
                      label={fullTime ? "Already at the full 7 days" : "Renew for 7 days"}
                      disabled={fullTime}
                      onClick={() => extendCxProject(project.id)}
                    >
                      <IconRefresh className="h-4 w-4" />
                    </ActionIcon>
                    <ActionIcon size="sm" tone="overlay" label="Close" onClick={() => setClosePrompt(true)}>
                      <IconClose className="h-4 w-4" />
                    </ActionIcon>
                  </>
                ) : (
                  <ActionIcon size="sm" tone="overlay" label="Reopen" onClick={() => extendCxProject(project.id)}>
                    <IconRefresh className="h-4 w-4" />
                  </ActionIcon>
                )}
                <ActionIcon size="sm" tone="overlay" align="end" label="Delete" danger onClick={() => setDeletePrompt(true)}>
                  <IconTrash className="h-4 w-4" />
                </ActionIcon>
              </div>
              {!project.photos[0] ? (
                <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-black/60 px-2.5 py-1 text-caption font-medium leading-none text-white/80 backdrop-blur-sm">
                  Sample photo
                </span>
              ) : project.photos.length > 1 || project.video ? (
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-caption font-medium leading-none text-white backdrop-blur-sm">
                  {project.video ? "Video" : `${project.photos.length} photos`}
                </span>
              ) : null}
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {closed ? (
                <p className="rounded-xl border border-border bg-surface-muted/40 p-4 text-body-sm text-muted">
                  This opportunity is closed. Contractors can no longer respond, but open Handshakes stay available.
                </p>
              ) : null}

              {closePrompt && project.status === "live" ? (
                <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
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

              <header className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent [&_svg]:h-5 [&_svg]:w-5">
                  <CategoryMark category={project.category} />
                </span>
                <div className="min-w-0">
                  <h1 className="font-sans text-[clamp(1.5rem,2.4vw,2.125rem)] font-semibold leading-tight tracking-tight text-foreground">
                    {project.category || "Opportunity"}
                  </h1>
                  <p className="mt-0.5 text-caption text-muted">{endsLine}</p>
                </div>
              </header>

              {closed && original.trim() !== project.description.trim() ? (
                <div className="space-y-4">
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
                <p className="whitespace-pre-wrap text-body-lg leading-relaxed text-foreground/90">{project.description || "No description."}</p>
              )}

              <dl className="grid gap-2.5 sm:grid-cols-3">
                {[
                  { icon: IconMapPin, label: "Location", value: location },
                  { icon: IconCalendar, label: "Starts", value: project.timing },
                  { icon: IconWallet, label: "Budget", value: project.budgetBand },
                ]
                  .filter((item) => Boolean(item.value))
                  .map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-white/[0.02] px-3.5 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-caption leading-none text-muted">{label}</dt>
                        <dd className="mt-1.5 break-words text-body-sm font-semibold leading-snug text-foreground">{value}</dd>
                      </div>
                    </div>
                  ))}
              </dl>

              {project.photos.length > 1 ? (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {project.photos.slice(1).map((src, index) => (
                    <li key={index}>
                      <img src={src} alt="" className="h-20 w-full rounded-lg object-cover" />
                    </li>
                  ))}
                </ul>
              ) : null}
              {project.video ? <video src={project.video} controls className="max-h-56 w-full rounded-xl bg-black" /> : null}
            </div>
          </div>

        {project.firstName || project.streetAddress || project.saveEmail || project.savePhone ? (
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <IconLock className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-body-lg font-semibold text-foreground">Private details</h2>
                <p className="mt-0.5 text-body-sm text-muted">Only you can see these. A contractor sees them after a Handshake opens.</p>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { icon: IconUser, label: "First name", value: project.firstName },
                { icon: IconMapPin, label: "Street address", value: project.streetAddress },
                { icon: IconMessage, label: "Email", value: project.saveEmail },
                { icon: IconMessageCircle, label: "Phone", value: project.savePhone },
              ]
                .filter((item) => Boolean(item.value))
                .map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-white/[0.02] px-3.5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-muted">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-caption leading-none text-muted">{label}</dt>
                      <dd className="mt-1.5 truncate text-body-sm font-medium leading-none text-foreground">{value}</dd>
                    </div>
                  </div>
                ))}
            </dl>
          </section>
        ) : null}

        {projectHistory.length > 0 ? (
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-body-lg font-semibold text-foreground">
              <IconClock className="h-5 w-5 text-accent" />
              History
            </h2>
            <ol className="mt-4 space-y-4 border-l border-border-subtle pl-5">
              {projectHistory.map((item) => (
                <li key={`${item.at}-${item.kind}`} className="relative">
                  <span aria-hidden className="absolute -left-[1.6rem] top-1.5 h-2 w-2 rounded-full bg-accent" />
                  <p className="text-body-sm font-medium text-foreground">{HISTORY_LABEL[item.kind] ?? item.kind}</p>
                  <p className="whitespace-pre-wrap text-body-sm text-muted">{item.note}</p>
                  <p className="mt-0.5 text-caption text-quiet">{formatDate(item.at)}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        </div>
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
  const primary = "h-10 w-full justify-center rounded-full xl:w-auto xl:px-6";

  // What this contractor has written to the homeowner in the Handshake, so it shows right on their card.
  const theirs = connection ? getMessages(connection.id).filter((item) => item.fromHandle !== homeowner) : [];
  const lastMessage = theirs[theirs.length - 1];
  const unreadMessages = theirs.filter((item) => !item.readBy.includes(homeowner)).length;

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3">
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
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-semibold text-accent">
              {matchPercent(person.alignment)}% match
            </span>
            <span>Responded {relativeTime(person.interest.createdAt) || "just now"}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:flex xl:shrink-0">
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
          className={buttonClassName({ size: "sm", variant: "outline", className: "h-10 w-full justify-center rounded-full xl:w-auto xl:px-6" })}
        >
          View profile
        </Link>
      </div>
      </div>
          {lastMessage && connection ? (
        <Link
          to={projectHandshakeHref(projectId, connection.id)}
          className="mt-4 flex items-start gap-3 rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2.5 text-body-sm motion-safe:transition-colors hover:border-accent/40"
        >
          <IconMessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block text-foreground">
              Sent you a message
              {unreadMessages > 0 ? (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-bold text-primary-foreground">{unreadMessages} new</span>
              ) : null}
            </span>
            <span className="mt-0.5 block truncate text-caption text-muted">
              “{lastMessage.body}” · {relativeTime(lastMessage.createdAt) || "just now"}
            </span>
          </span>
        </Link>
      ) : null}
    </li>
  );
}
