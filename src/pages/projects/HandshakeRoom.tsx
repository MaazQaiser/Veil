import { Link, useParams } from "react-router-dom";
import { NeedFooter, NeedHead } from "@/pages/need/NeedLayout";
import { IconChevronLeft } from "@/components/ui/icons";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/controls";
import { MessageThread } from "@/components/vael";
import { useCitySession } from "@/lib/citySession";
import { findAccountByHandle } from "@/lib/accounts";
import {
  answerProjectQuestion,
  askProjectQuestion,
  closeOtherHandshakes,
  confirmProjectScopeChange,
  displayNameFor,
  editLiveProject,
  getCxProject,
  keepCurrentScope,
  openProjectHandshakesFor,
  projectThreadFor,
  proposedScopeText,
  questionsForProject,
  revealedContacts,
  sendHandshakeMessage,
  type CxQuestion,
} from "@/lib/cxProjectStore";
import { PROJECTS_PATH, projectHref } from "@/lib/cxRoutes";
import { useCxProjects } from "@/lib/useCxProjects";
import { useVael } from "@/lib/vaelCore";
import { getCxProfile } from "@/lib/constructionStore";
import { closeConnection, getConnection } from "@/lib/vaelStore";
import { useEffect, useState } from "react";

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
          <Link to={PROJECTS_PATH} className={buttonClassName({ size: "lg", className: "rounded-lg px-10" })}>
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

  return (
    <div className="flex flex-1 flex-col">
      <Link
        to={projectHref(project.id)}
        className="mb-4 inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
      >
        <IconChevronLeft className="h-3.5 w-3.5" />
        Back to project
      </Link>
      <NeedHead title="Handshake" lede={`With ${otherName}. Only the two of you can see this room.`} />
      {connected && session.handle === project.handle ? (
        <div className="mt-6">
          {proceedPrompt ? (
            <div className="rounded-lg border border-border p-4">
              <p className="text-body font-medium">Close your other Handshakes?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
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
                  onClick={() => {
                    setProceedPrompt(false);
                    setKeptOthers(true);
                  }}
                >
                  Keep them open
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => (otherHandshakes.length > 0 ? setProceedPrompt(true) : setKeptOthers(true))}>
              Proceed with {otherName}
            </Button>
          )}
          {keptOthers && otherHandshakes.length > 0 ? (
            <p className="mt-3 text-body-sm text-muted">Your other Handshakes stay open.</p>
          ) : null}
        </div>
      ) : null}
      {connected ? (
        <div className="mt-4">
          {closePrompt ? (
            <div className="rounded-lg border border-border p-4">
              <p className="text-body font-medium">Close this Handshake?</p>
              <p className="mt-2 text-body-sm text-muted">
                {session.handle === project.handle
                  ? "You can close this connection if you no longer want to continue with this contractor."
                  : "You can close this connection if you no longer want to continue with this homeowner."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setClosePrompt(false)}>
                  Keep Handshake
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    closeConnection(connection.id);
                    setClosePrompt(false);
                  }}
                >
                  Close Handshake
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setClosePrompt(true)}>
              Close Handshake
            </Button>
          )}
        </div>
      ) : (
        <p className="mt-4 text-body-sm text-muted">
          This Handshake is closed. The project and this conversation stay on record.
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["project", "communication", "documents"] as const).map((item) => (
          <Button key={item} type="button" size="sm" variant={tab === item ? "primary" : "outline"} onClick={() => setTab(item)}>
            {item === "project" ? "Project" : item === "communication" ? "Communication" : "Documents"}
          </Button>
        ))}
      </div>

      {tab === "project" ? (
        <section className="mt-8 space-y-4">
          <h2 className="text-h4 font-medium">Current scope</h2>
          <p className="whitespace-pre-wrap text-body">{project.description}</p>
          <h3 className="text-body font-medium">Confirmed clarifications</h3>
          <ul className="space-y-2 text-body-sm text-muted">
            {clarifications.map((item) => (
              <li key={item.id}>
                {item.body} — {item.answer}
              </li>
            ))}
            {clarifications.length === 0 ? <li>No confirmed clarifications yet.</li> : null}
          </ul>
          <h3 className="text-body font-medium">Project history</h3>
          <ul className="space-y-2 text-body-sm text-muted">
            {project.history.map((item) => (
              <li key={`${item.at}-${item.kind}`} className="whitespace-pre-wrap">
                {item.kind === "scope_change" ? item.note : `${item.kind}: ${item.note}`}
              </li>
            ))}
          </ul>
          <ProjectQuestions
            homeowner={session.handle === project.handle}
            viewer={session.handle}
            homeownerHandle={project.handle}
            projectId={project.id}
            description={project.description}
            questions={questions}
          />
        </section>
      ) : null}

      {tab === "communication" ? (
        <section className="mt-8">
          <h2 className="text-h4 font-medium">Private messages</h2>
          <p className="mt-2 text-body-sm text-muted">
            This conversation stays on the {project.category} project. Only you and {otherName} can see it.
          </p>
          {revealed ? (
            <div className="mb-6 rounded-lg border border-border p-4 text-body-sm">
              <p className="font-medium text-foreground">Contact details</p>
              <p className="mt-2 font-medium text-foreground">Homeowner</p>
              <p>{revealed.fullName}</p>
              {revealed.phone ? <p>{revealed.phone}</p> : null}
              {revealed.email ? <p>{revealed.email}</p> : null}
              <p>{revealed.address || `${project.city} / ${project.postalCode}`}</p>
              <p className="mt-3 font-medium text-foreground">Contractor</p>
              <p>{displayNameFor(contractorHandle)}</p>
              {contractorAccount?.phone ? <p>{contractorAccount.phone}</p> : null}
              {contractorAccount?.email ? <p>{contractorAccount.email}</p> : null}
              {contractorProfile?.serviceArea || contractorProfile?.location ? (
                <p>{contractorProfile.serviceArea || contractorProfile.location}</p>
              ) : null}
              {session.handle === project.handle ? (
                <form
                  className="mt-4 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    editLiveProject(project.id, { streetAddress: address.trim() });
                  }}
                >
                  <Input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Street address (shared only here)"
                  />
                  <Button type="submit" size="sm">
                    Share address
                  </Button>
                </form>
              ) : null}
            </div>
          ) : connected ? (
            <p className="mb-4 text-body-sm text-muted">Contact details open after mutual interest.</p>
          ) : null}
          <MessageThread
            handle={session.handle}
            messages={messages}
            enabled={connected}
            readOnly={!connected}
            placeholder={`Message ${otherName} about this project...`}
            onSend={(body, attachmentName) => sendHandshakeMessage(connection.id, session.handle, body, attachmentName)}
          />
        </section>
      ) : null}

      {tab === "documents" ? (
        <section className="mt-8">
          <h2 className="text-h4 font-medium">Documents</h2>
          <p className="mt-2 text-body-sm text-muted">Shared files and project records for this Handshake only.</p>
          {project.photos.length > 0 ? (
            <ul className="mt-4 grid grid-cols-3 gap-2">
              {project.photos.map((src, index) => (
                <li key={index}>
                  <img src={src} alt="" className="h-24 w-full rounded-md object-cover" />
                </li>
              ))}
            </ul>
          ) : null}
          <ul className="mt-4 space-y-2 text-body-sm">
            {project.video ? <li>Project video</li> : null}
            {messages
              .filter((item) => item.attachmentName)
              .map((item) => (
                <li key={item.id}>{item.attachmentName}</li>
              ))}
            {project.photos.length === 0 && !project.video && messages.every((item) => !item.attachmentName) ? (
              <li>No files shared yet.</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <Link to={projectHref(project.id)} className="mt-10 inline-block text-body-sm font-medium text-muted hover:text-foreground">
        ← Project
      </Link>
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
    <div className="space-y-4">
      {pending.map((item) => (
        <div key={item.id} className="rounded-lg border border-border p-4">
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
      {homeowner ? null : (
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
          <h3 className="text-body font-medium">Ask about the project</h3>
          <p className="text-body-sm text-muted">This stays on the project. It does not change the scope by itself.</p>
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Are you also replacing the plumbing?" />
          <Button type="submit" size="sm" variant="outline">
            Post on project
          </Button>
        </form>
      )}
    </div>
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
      <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Answer on the project" />
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
