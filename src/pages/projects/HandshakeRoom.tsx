import { Link, useParams } from "react-router-dom";
import { NeedFooter, NeedHead } from "@/pages/need/NeedLayout";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconClock,
  IconDocument,
  IconFlag,
  IconLock,
  IconMapPin,
  IconMessageCircle,
  IconTrash,
  IconWallet,
} from "@/components/ui/icons";
import { ReportDialog } from "@/components/opportunities/ReportDialog";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/time";
import { CategoryMark } from "@/pages/need/OpportunityChrome";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/controls";
import { MessageThread } from "@/components/vael";
import { useCitySession } from "@/lib/citySession";
import { findAccountByHandle } from "@/lib/accounts";
import {
  CX_ROOM_MAX_BYTES,
  CX_ROOM_MAX_FILES,
  addRoomFile,
  answerProjectQuestion,
  askProjectQuestion,
  blockRoom,
  canReopenRoom,
  closeOtherHandshakes,
  closeRoom,
  confirmProjectScopeChange,
  displayNameFor,
  editLiveProject,
  fileReport,
  getCxProject,
  getRoom,
  hasAskedQuestion,
  interestBetween,
  keepCurrentScope,
  openProjectHandshakesFor,
  projectThreadFor,
  proposedScopeText,
  questionsForProject,
  removeRoomFile,
  reopenRoom,
  revealedContacts,
  roomUsage,
  sendHandshakeMessage,
  shareContactDetails,
  type CxQuestion,
  PERSON_REPORT_REASONS,
} from "@/lib/cxProjectStore";
import { MY_OPPORTUNITIES_PATH, opportunityHref, projectHref } from "@/lib/cxRoutes";
import { useCxProjects } from "@/lib/useCxProjects";
import { useVael } from "@/lib/vaelCore";
import { getCxProfile } from "@/lib/constructionStore";
import { getConnection } from "@/lib/vaelStore";
import { useEffect, useState } from "react";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function ProjectHandshakeRoomPage() {
  useCxProjects();
  const { projectId = "", connectionId = "" } = useParams();
  const { session } = useCitySession();
  const vael = useVael();
  const project = getCxProject(projectId);
  const connection = getConnection(connectionId);
  const [address, setAddress] = useState(project?.streetAddress ?? "");
  const [tab, setTab] = useState<"project" | "communication" | "documents">("project");
  const [proceedPrompt, setProceedPrompt] = useState(false);
  const [keptOthers, setKeptOthers] = useState(false);
  const [closePrompt, setClosePrompt] = useState(false);
  const [blockPrompt, setBlockPrompt] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [roomError, setRoomError] = useState("");
  const party =
    !!connection &&
    (connection.requesterHandle === session.handle || connection.counterpartHandle === session.handle);
  const sameProject =
    !!project &&
    !!connection &&
    connection.source === "project_interest" &&
    connection.projectId === project.id;

  const readThread = vael.readThread;
  useEffect(() => {
    if (tab !== "communication" || !party || !sameProject) return;
    readThread(connectionId, session.handle);
  }, [tab, party, sameProject, connectionId, session.handle, readThread]);

  if (!project || !connection || !party || !sameProject) {
    return (
      <div className="flex flex-1 flex-col">
        <NeedHead title="Handshake not found" />
        <NeedFooter>
          <Link to={MY_OPPORTUNITIES_PATH} className={buttonClassName({ size: "lg", className: "rounded-lg px-10" })}>
            Your projects
          </Link>
        </NeedFooter>
      </div>
    );
  }

  const revealed = revealedContacts(project, connection);
  const contractorHandle =
    connection.requesterHandle === project.handle ? connection.counterpartHandle : connection.requesterHandle;
  const contractorAccount = findAccountByHandle(contractorHandle);
  const contractorProfile = getCxProfile(contractorHandle);
  const questions = questionsForProject(project.id);
  const clarifications = questions.filter((item) => item.answer && !item.scopeChangeRequested);
  const messages = projectThreadFor(project.id, connection.id, session.handle);
  const otherName = displayNameFor(session.handle === project.handle ? contractorHandle : project.handle);
  const connected = connection.status === "connected" && !connection.blocked;
  const otherHandshakes =
    session.handle === project.handle
      ? openProjectHandshakesFor(project.handle).filter((item) => item.id !== connection.id)
      : [];

  const isHomeowner = session.handle === project.handle;
  const otherHandle = isHomeowner ? contractorHandle : project.handle;
  const room = getRoom(connection.id);
  const usage = roomUsage(connection.id);
  const blocked = connection.blocked;
  const reopenable = canReopenRoom(connection.id, session.handle);
  const contractorInterest = interestBetween(project.id, contractorHandle);
  const backTo = isHomeowner ? projectHref(project.id) : opportunityHref(project.id);
  const place = [project.city, project.postalCode].filter(Boolean).join(" · ");
  const HISTORY_LABEL: Record<string, string> = {
    published: "Published",
    edited: "Edited",
    extended: "Renewed",
    closed: "Closed",
    scope_change: "Scope changed",
  };
  const timeline = [
    ...project.history
      .filter((item) => item.kind !== "created")
      .map((item) => ({ key: `${item.at}-${item.kind}`, at: item.at, label: HISTORY_LABEL[item.kind] ?? item.kind, note: item.note })),
    ...(contractorInterest
      ? [{ key: "interest", at: contractorInterest.createdAt, label: "Interest shown", note: `${displayNameFor(contractorHandle)} showed interest.` }]
      : []),
    { key: "handshake", at: connection.createdAt, label: "Handshake opened", note: "You both showed interest, so this room opened." },
    ...(!connected && room.closedBy
      ? [{ key: "closed", at: connection.createdAt, label: blocked ? "Blocked" : "Closed", note: `${displayNameFor(room.closedBy)} ${blocked ? "blocked" : "closed"} this Handshake.` }]
      : []),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const tabs = [
    { id: "project" as const, label: "Project", icon: IconDocument },
    { id: "communication" as const, label: "Communication", icon: IconMessageCircle },
    { id: "documents" as const, label: "Documents", icon: IconLock },
  ];
  const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";
  const inner = "rounded-xl border border-border-subtle bg-white/[0.02]";

  return (
    <div className="flex flex-1 flex-col">
      <Link
        to={backTo}
        className="mb-5 inline-flex w-fit items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
      >
        <IconChevronLeft className="h-3.5 w-3.5" />
        Back to opportunity
      </Link>

      <section className={cn(card, "relative overflow-hidden")}>
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-x-6 gap-y-5">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={otherName} size="lg" />
            <div className="min-w-0">
              <p className="text-caption font-semibold uppercase tracking-[0.14em] text-accent">Handshake</p>
              <h1 className="mt-1 font-sans text-[clamp(1.5rem,2.6vw,2.125rem)] font-semibold leading-tight tracking-tight text-foreground">
                {otherName}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-muted">
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <span className="text-accent [&_svg]:h-4 [&_svg]:w-4">
                    <CategoryMark category={project.category} />
                  </span>
                  {project.category || "Opportunity"}
                </span>
                {place ? <span>· {place}</span> : null}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={connected ? "live" : "default"}>{connected ? "Connected" : blocked ? "Blocked" : "Closed"}</Badge>
            {connected && isHomeowner && !proceedPrompt ? (
              <Button type="button" size="sm" className="rounded-full" onClick={() => (otherHandshakes.length > 0 ? setProceedPrompt(true) : setKeptOthers(true))}>
                Proceed with {otherName}
              </Button>
            ) : null}
            {connected && !closePrompt && !blockPrompt ? (
              <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setClosePrompt(true)}>
                Close Handshake
              </Button>
            ) : null}
            {reopenable ? (
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  try {
                    reopenRoom(connection.id, session.handle);
                    setRoomError("");
                  } catch (err) {
                    setRoomError(err instanceof Error ? err.message : "Could not reopen.");
                  }
                }}
              >
                Reopen Handshake
              </Button>
            ) : null}
          </div>
        </div>

        <p className="relative mt-4 text-body-sm text-muted">
          {connected
            ? "A private room for the two of you. Nobody else can see it."
            : blocked
              ? "This Handshake was blocked and stays closed. The opportunity and this conversation stay on record."
              : room.closedBy === session.handle
                ? "You closed this Handshake. You can reopen it whenever you like."
                : room.closedBy
                  ? `${displayNameFor(room.closedBy)} closed this Handshake. Only they can reopen it.`
                  : "This Handshake is closed. The opportunity and this conversation stay on record."}
        </p>
        {roomError ? <p className="relative mt-2 text-body-sm text-destructive">{roomError}</p> : null}

        <div className="relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border-subtle pt-4">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted motion-safe:transition-colors hover:text-foreground"
          >
            <IconFlag className="h-4 w-4" />
            Report {otherName}
          </button>
          {connected && !blockPrompt ? (
            <button
              type="button"
              onClick={() => {
                setBlockPrompt(true);
                setClosePrompt(false);
              }}
              className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted motion-safe:transition-colors hover:text-destructive"
            >
              Block {otherName}
            </button>
          ) : null}
        </div>

        {connected && blockPrompt ? (
          <div className={cn(inner, "relative mt-4 p-4")}>
            <p className="text-body font-medium text-foreground">Block {otherName}?</p>
            <p className="mt-1 text-body-sm text-muted">
              This closes the Handshake for good. Neither of you can message or reopen it. The record stays.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setBlockPrompt(false)}>
                Keep Handshake
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  blockRoom(connection.id, session.handle);
                  setBlockPrompt(false);
                }}
              >
                Block {otherName}
              </Button>
            </div>
          </div>
        ) : null}

        {connected && isHomeowner && proceedPrompt ? (
          <div className={cn(inner, "relative mt-4 p-4")}>
            <p className="text-body font-medium text-foreground">Close your other Handshakes?</p>
            <p className="mt-1 text-body-sm text-muted">You can keep them open if you still want to hear from other contractors.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  closeOtherHandshakes(project.handle, connection.id);
                  setProceedPrompt(false);
                }}
              >
                Close other Handshakes
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setProceedPrompt(false);
                  setKeptOthers(true);
                }}
              >
                Keep them open
              </Button>
            </div>
          </div>
        ) : null}
        {connected && isHomeowner && keptOthers && otherHandshakes.length > 0 ? (
          <p className="relative mt-3 text-body-sm text-muted">Your other Handshakes stay open.</p>
        ) : null}

        {connected && closePrompt ? (
          <div className={cn(inner, "relative mt-4 p-4")}>
            <p className="text-body font-medium text-foreground">Close this Handshake?</p>
            <p className="mt-1 text-body-sm text-muted">
              {isHomeowner
                ? "You can close this connection if you no longer want to continue with this contractor."
                : "You can close this connection if you no longer want to continue with this homeowner."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setClosePrompt(false)}>
                Keep Handshake
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  closeRoom(connection.id, session.handle);
                  setClosePrompt(false);
                }}
              >
                Close Handshake
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <div role="tablist" aria-label="Handshake" className="mt-6 grid w-full grid-cols-3 gap-1 rounded-xl border border-border bg-surface-muted/40 p-1 sm:max-w-xl">
        {tabs.map((item) => {
          const on = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex h-10 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-2 text-body-sm font-medium motion-safe:transition-colors",
                on ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "project" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          <div className="min-w-0 space-y-6">
            <section className={card}>
              <h2 className="text-body-lg font-semibold text-foreground">Current scope</h2>
              <p className="mt-2 whitespace-pre-wrap text-body leading-relaxed text-foreground/90">{project.description}</p>
              <dl className="mt-5 grid gap-2.5 sm:grid-cols-3">
                {[
                  { icon: IconMapPin, label: "Location", value: place },
                  { icon: IconCalendar, label: "Starts", value: project.timing },
                  { icon: IconWallet, label: "Budget", value: project.budgetBand },
                ]
                  .filter((item) => Boolean(item.value))
                  .map(({ icon: Icon, label, value }) => (
                    <div key={label} className={cn(inner, "flex min-w-0 items-center gap-3 px-3.5 py-3")}>
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
            </section>

            <section className={card}>
              <h2 className="text-body-lg font-semibold text-foreground">Confirmed clarifications</h2>
              {clarifications.length === 0 ? (
                <p className="mt-2 text-body-sm text-muted">No confirmed clarifications yet.</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {clarifications.map((item) => (
                    <li key={item.id} className={cn(inner, "px-4 py-3 text-body-sm")}>
                      <p className="text-foreground">{item.body}</p>
                      <p className="mt-1.5 border-l-2 border-accent/50 pl-3 text-muted">{item.answer}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <ProjectQuestions
              homeowner={isHomeowner}
              viewer={session.handle}
              homeownerHandle={project.handle}
              projectId={project.id}
              description={project.description}
              questions={questions}
            />
          </div>

          <section className={card}>
            <h2 className="flex items-center gap-2 text-body-lg font-semibold text-foreground">
              <IconClock className="h-5 w-5 text-accent" />
              History
            </h2>
            <ol className="mt-4 space-y-4 border-l border-border-subtle pl-5">
              {timeline.map((item) => (
                <li key={item.key} className="relative">
                  <span aria-hidden className="absolute -left-[1.6rem] top-1.5 h-2 w-2 rounded-full bg-accent" />
                  <p className="text-body-sm font-medium text-foreground">{item.label}</p>
                  <p className="whitespace-pre-wrap text-body-sm text-muted">{item.note}</p>
                  <p className="mt-0.5 text-caption text-quiet">{formatDate(item.at)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}

      {tab === "communication" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          <section className={card}>
            <h2 className="text-body-lg font-semibold text-foreground">Private messages</h2>
            <p className="mt-1 mb-5 text-body-sm text-muted">
              This conversation stays on the {project.category} opportunity. Only you and {otherName} can see it.
            </p>
            <MessageThread
              handle={session.handle}
              messages={messages}
              enabled={connected}
              readOnly={!connected}
              placeholder={`Message ${otherName} about this opportunity...`}
              onSend={(body, attachmentName) => sendHandshakeMessage(connection.id, session.handle, body, attachmentName)}
            />
          </section>

          <section className={card}>
            <h2 className="flex items-center gap-2 text-body-lg font-semibold text-foreground">
              <IconLock className="h-5 w-5 text-accent" />
              Contact details
            </h2>
            {revealed ? (
              <div className="mt-4 space-y-3 text-body-sm">
                <div className={cn(inner, "p-4")}>
                  <p className="text-caption font-semibold uppercase tracking-[0.1em] text-muted">Homeowner</p>
                  <p className="mt-1.5 font-medium text-foreground">{revealed.fullName}</p>
                  {revealed.phone ? <p className="text-muted">{revealed.phone}</p> : null}
                  {revealed.email ? <p className="break-all text-muted">{revealed.email}</p> : null}
                  <p className="text-muted">{revealed.address || place}</p>
                </div>
                <div className={cn(inner, "p-4")}>
                  <p className="text-caption font-semibold uppercase tracking-[0.1em] text-muted">Contractor</p>
                  <p className="mt-1.5 font-medium text-foreground">{displayNameFor(contractorHandle)}</p>
                  {contractorAccount?.phone ? <p className="text-muted">{contractorAccount.phone}</p> : null}
                  {contractorAccount?.email ? <p className="break-all text-muted">{contractorAccount.email}</p> : null}
                  {contractorProfile?.serviceArea || contractorProfile?.location ? (
                    <p className="text-muted">{contractorProfile.serviceArea || contractorProfile.location}</p>
                  ) : null}
                </div>
                {isHomeowner ? (
                  <form
                    className="flex flex-col gap-2 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault();
                      editLiveProject(project.id, { streetAddress: address.trim() });
                    }}
                  >
                    <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street address (shared only here)" />
                    <Button type="submit" size="sm" className="shrink-0 rounded-full">
                      Share address
                    </Button>
                  </form>
                ) : null}
              </div>
            ) : connected ? (
              <div className="mt-2">
                <p className="text-body-sm text-muted">
                  {isHomeowner
                    ? "Your contact details stay private until you choose to share them. Once you do, you and the contractor can see each other's name, phone and email."
                    : "The homeowner hasn't shared contact details yet. They stay private until the homeowner chooses to share them."}
                </p>
                {isHomeowner ? (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-4 rounded-full"
                    onClick={() => {
                      try {
                        shareContactDetails(connection.id, session.handle);
                        setRoomError("");
                      } catch (err) {
                        setRoomError(err instanceof Error ? err.message : "Could not share.");
                      }
                    }}
                  >
                    Share my contact details
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-body-sm text-muted">Contact details are only shown while the Handshake is open.</p>
            )}
          </section>
        </div>
      ) : null}

      {tab === "documents" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          <section className={card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-body-lg font-semibold text-foreground">Shared files</h2>
                <p className="mt-1 text-body-sm text-muted">Only you and {otherName} can see these.</p>
              </div>
              {connected ? (
                <label className="inline-flex h-10 cursor-pointer items-center rounded-full bg-accent px-5 text-body-sm font-semibold text-primary-foreground motion-safe:transition-opacity hover:opacity-90">
                  Add file
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      const save = (data: string) => {
                        try {
                          addRoomFile(connection.id, session.handle, { name: file.name, size: file.size, data });
                          setRoomError("");
                        } catch (err) {
                          setRoomError(err instanceof Error ? err.message : "Could not add the file.");
                        }
                      };
                      // Small files keep their content so they can be downloaded. Larger ones are recorded by name and size only.
                      if (file.size > 250_000) {
                        save("");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => save(typeof reader.result === "string" ? reader.result : "");
                      reader.onerror = () => save("");
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              ) : null}
            </div>

            {roomError ? <p className="mt-3 text-body-sm text-destructive">{roomError}</p> : null}

            {room.files.length === 0 ? (
              <p className="mt-5 rounded-xl border border-dashed border-border p-6 text-center text-body-sm text-muted">No files shared yet.</p>
            ) : (
              <ul className="mt-5 space-y-2.5">
                {room.files.map((file) => (
                  <li key={file.id} className={cn(inner, "flex items-center gap-3 px-4 py-3")}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <IconDocument className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-caption text-muted">
                        {formatBytes(file.size)} · {file.by === session.handle ? "You" : displayNameFor(file.by)} · {formatDate(file.at)}
                      </p>
                    </div>
                    {file.data ? (
                      <a href={file.data} download={file.name} className="text-body-sm font-medium text-accent underline-offset-4 hover:underline">
                        Download
                      </a>
                    ) : (
                      <span className="text-caption text-quiet">Not stored in this demo</span>
                    )}
                    {file.by === session.handle && connected ? (
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => removeRoomFile(connection.id, session.handle, file.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted motion-safe:transition-colors hover:bg-destructive-muted hover:text-destructive"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="min-w-0 space-y-6">
            <section className={card}>
              <h2 className="text-body-lg font-semibold text-foreground">Space used</h2>
              <p className="mt-2 text-body-sm text-muted">
                <span className="font-semibold text-foreground">{usage.files}</span> of {CX_ROOM_MAX_FILES} files ·{" "}
                <span className="font-semibold text-foreground">{formatBytes(usage.bytes)}</span> of {formatBytes(CX_ROOM_MAX_BYTES)}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/15" role="img" aria-label="Space used in this Handshake">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(100, Math.max(usage.files / CX_ROOM_MAX_FILES, usage.bytes / CX_ROOM_MAX_BYTES) * 100)}%` }}
                />
              </div>
            </section>

            {project.photos.length > 0 || project.video ? (
              <section className={card}>
                <h2 className="text-body-lg font-semibold text-foreground">From the opportunity</h2>
                {project.photos.length > 0 ? (
                  <ul className="mt-4 grid grid-cols-3 gap-2">
                    {project.photos.map((src, index) => (
                      <li key={index}>
                        <img src={src} alt="" className="h-20 w-full rounded-xl object-cover" />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {project.video ? <video src={project.video} controls className="mt-3 max-h-48 w-full rounded-xl bg-black" /> : null}
              </section>
            ) : null}
          </div>
        </div>
      ) : null}

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={`Report ${otherName}`}
        question="What happened?"
        thanks="Thanks for your report. We'll review it and let you know what we decide."
        reasons={PERSON_REPORT_REASONS}
        onSend={(reason, details) => fileReport({ kind: "person", byHandle: session.handle, target: otherHandle, projectId: project.id, reason, details })}
      />
    </div>
  );
}

function ProjectQuestions({
  homeowner,
  viewer,
  homeownerHandle,
  projectId,
  description,
  questions,
}: {
  homeowner: boolean;
  viewer: string;
  homeownerHandle: string;
  projectId: string;
  description: string;
  questions: CxQuestion[];
}) {
  const open = questions.filter((item) => !item.answer);
  const pending = questions.filter((item) => item.scopeChangeRequested && !item.scopeChangeConfirmed);
  const [body, setBody] = useState("");

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-body-lg font-semibold text-foreground">Questions about the opportunity</h2>
      {pending.map((item) => (
        <div key={item.id} className="rounded-xl border border-border-subtle bg-white/[0.02] p-4">
          <p className="text-body font-medium">{item.body}</p>
          <p className="mt-2 text-body-sm">Answer: {item.answer}</p>
          {homeowner ? (
            <>
              <h3 className="mt-4 text-body font-medium">Updated project information</h3>
              <p className="mt-2 whitespace-pre-wrap text-body-sm">{proposedScopeText(description, item.answer)}</p>
              <p className="mt-2 text-body-sm text-muted">Confirm this change before the project is updated.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => confirmProjectScopeChange(item.id, homeownerHandle)}>
                  Confirm change
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => keepCurrentScope(item.id, homeownerHandle)}>
                  Keep current scope
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-body-sm text-muted">Waiting for the homeowner to confirm this scope change.</p>
          )}
        </div>
      ))}
      {open.length > 0 ? (
        <div>
          <h3 className="text-body font-medium">Open questions</h3>
          <ul className="mt-2 space-y-4">
            {open.map((item) => (
              <li key={item.id}>
                <p className="text-body-sm">{item.body}</p>
                {homeowner ? <AnswerForm questionId={item.id} /> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {homeowner ? null : hasAskedQuestion(projectId, viewer) ? (
        <p className="flex items-center gap-2 text-body-sm text-muted">
          <IconCheck className="h-3.5 w-3.5 text-success" />
          You've used your one question on this opportunity.
        </p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const next = body.trim();
            if (!next) return;
            askProjectQuestion(projectId, viewer, next);
            setBody("");
          }}
        >
          <h3 className="text-body font-medium">Ask about the opportunity</h3>
          <p className="text-body-sm text-muted">This stays on the opportunity. It does not change the scope by itself.</p>
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Are you also replacing the plumbing?" />
          <Button type="submit" size="sm" variant="outline" className="rounded-full">
            Post question
          </Button>
        </form>
      )}
      {questions.length === 0 && homeowner ? <p className="text-body-sm text-muted">No questions yet.</p> : null}
    </section>
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
        setScope(false);
      }}
    >
      <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Your answer" />
      <label className="flex items-center gap-2 text-body-sm">
        <input type="checkbox" checked={scope} onChange={(event) => setScope(event.target.checked)} />
        This changes the scope
      </label>
      {scope ? (
        <p className="text-body-sm text-muted">The project stays as it is until you confirm the updated scope.</p>
      ) : null}
      <Button type="submit" size="sm" className="rounded-full">
        {scope ? "Review change" : "Answer"}
      </Button>
    </form>
  );
}
