import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { NeedFooter, NeedHead } from "@/pages/need/NeedLayout";
import { IconChevronLeft } from "@/components/ui/icons";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { useCitySession } from "@/lib/citySession";
import {
  answerProjectQuestion,
  closeCxProject,
  confirmProjectScopeChange,
  CX_BUDGET_BANDS,
  CX_TIMINGS,
  editLiveProject,
  extendCxProject,
  getCxProject,
  homeownerInterested,
  interestsForProject,
  keepCurrentScope,
  originalProjectDescription,
  proposedScopeText,
  questionsForProject,
  respondentsFor,
  toggleSavedContractor,
  type CxBudgetBand,
  type CxQuestion,
  type CxRespondent,
  type CxTiming,
} from "@/lib/cxProjectStore";
import { projectHandshakeHref, PROJECTS_PATH, vaelanceCompareHref, vaelanceHref } from "@/lib/cxRoutes";
import { useCxProjects } from "@/lib/useCxProjects";
import { displayNameFor } from "@/lib/cxProjectStore";
import { getConnection, getConnections } from "@/lib/vaelStore";
import { relativeTime } from "@/lib/time";

export function ProjectDetailPage() {
  useCxProjects();
  const { projectId = "" } = useParams();
  const { session } = useCitySession();
  const project = getCxProject(projectId);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [closePrompt, setClosePrompt] = useState(false);

  if (!project) {
    return (
      <div className="flex flex-1 flex-col">
        <NeedHead title="Project not found" lede="That project is not on this device." />
        <NeedFooter>
          <Link to={PROJECTS_PATH} className={buttonClassName({ size: "lg", className: "rounded-lg px-10" })}>
            Your projects
          </Link>
        </NeedFooter>
      </div>
    );
  }

  if (session.signedIn && project.handle && project.handle !== session.handle) {
    return <Navigate to={PROJECTS_PATH} replace />;
  }

  const respondents = respondentsFor(project);
  const whole = respondents.filter((person) => person.group === "whole");
  const specialty = respondents.filter((person) => person.group === "specialty");
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

  return (
    <div className="flex flex-1 flex-col">
      <Link
        to={PROJECTS_PATH}
        className="mb-4 inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
      >
        <IconChevronLeft className="h-3.5 w-3.5" />
        Back to My Projects
      </Link>
      <NeedHead
        title={project.category || "Project"}
        lede={
          openHandshake
            ? "You and a contractor are both interested. Open the Handshake to continue."
            : "Contractors who match this project show up here. When you are both interested, the Handshake opens."
        }
      />
      {closed ? (
        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-label font-medium text-muted">Project details</dt>
            <dd className="mt-1 text-body">{project.category}</dd>
          </div>
          <div>
            <dt className="text-label font-medium text-muted">Original description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-body">{original}</dd>
          </div>
          {original.trim() !== project.description.trim() ? (
            <div>
              <dt className="text-label font-medium text-muted">Current scope</dt>
              <dd className="mt-1 whitespace-pre-wrap text-body">{project.description}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-label font-medium text-muted">Photos/video</dt>
            <dd className="mt-2 text-body-sm text-muted">
              {project.photos.length === 0 && !project.video ? "None added." : null}
              {project.photos.length > 0 ? (
                <ul className="grid grid-cols-3 gap-2">
                  {project.photos.map((src, index) => (
                    <li key={index}>
                      <img src={src} alt="" className="h-24 w-full rounded-md object-cover" />
                    </li>
                  ))}
                </ul>
              ) : null}
              {project.video ? <video src={project.video} controls className="mt-2 max-h-48 w-full rounded-md" /> : null}
            </dd>
          </div>
          <div>
            <dt className="text-label font-medium text-muted">Location</dt>
            <dd className="mt-1 text-body">
              {project.city} / {project.postalCode}
            </dd>
          </div>
          <div>
            <dt className="text-label font-medium text-muted">Timing</dt>
            <dd className="mt-1 text-body">{project.timing}</dd>
          </div>
          <div>
            <dt className="text-label font-medium text-muted">Budget</dt>
            <dd className="mt-1 text-body">{project.budgetBand}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-body text-foreground whitespace-pre-wrap">{project.description}</p>
      )}
      {!closed && project.photos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {project.photos.map((src, index) => (
            <li key={index}>
              <img src={src} alt="" className="h-24 w-full rounded-md object-cover" />
            </li>
          ))}
        </ul>
      ) : null}

      {project.status === "live" && project.day5Reminded ? (
        <div className="mt-6 rounded-lg border border-border p-4">
          <p className="text-body font-medium">This project will close in 2 days.</p>
          <Button type="button" className="mt-3" onClick={() => extendCxProject(project.id)}>
            Extend Project
          </Button>
        </div>
      ) : null}
      {closed ? (
        <div className="mt-6">
          <p className="text-body-sm text-muted">
            This project is closed and read-only. New contractor responses are stopped. Handshakes stay available.
          </p>
          <Button type="button" className="mt-3" variant="outline" onClick={() => extendCxProject(project.id)}>
            Reopen Project
          </Button>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        {project.status === "live" ? (
          <>
            <Button type="button" variant="outline" onClick={() => setEditing((value) => !value)}>
              Edit Project
            </Button>
            <Button type="button" variant="outline" onClick={() => extendCxProject(project.id)}>
              Extend Project
            </Button>
            <Button type="button" variant="ghost" onClick={() => setClosePrompt(true)}>
              Close Project
            </Button>
          </>
        ) : null}
      </div>
      {closePrompt && project.status === "live" ? (
        <div className="mt-6 rounded-lg border border-border p-4">
          <p className="text-body font-medium">Close this project?</p>
          <p className="mt-2 text-body-sm text-muted">This will stop new contractors from responding to the project.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setClosePrompt(false)}>
              Keep Project Open
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                closeCxProject(project.id);
                setClosePrompt(false);
                setEditing(false);
              }}
            >
              Close Project
            </Button>
          </div>
        </div>
      ) : null}
      {editing && project.status === "live" ? (
        <EditProjectForm
          projectId={project.id}
          description={project.description}
          city={project.city}
          postalCode={project.postalCode}
          timing={project.timing}
          budgetBand={project.budgetBand}
          onDone={() => setEditing(false)}
        />
      ) : null}
      <p className="mt-3 text-body-sm text-muted">
        {project.status === "live" ? `Live · ${liveDaysLeft} days left` : `Status: ${project.status}`}
      </p>

      <section className="mt-10">
        <h2 className="text-h3 font-medium text-foreground">Questions on this project</h2>
        <p className="mt-1 text-body-sm text-muted">Answers belong to the project, not a private conversation.</p>
        {questions.length === 0 ? (
          <p className="mt-4 text-body-sm text-muted">No questions yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {questions.map((item) => (
              <li key={item.id} className="rounded-lg border border-border p-4">
                <p className="text-body font-medium">{item.body}</p>
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
      </section>

      {closed ? (
        <>
          <section className="mt-10">
            <h2 className="text-h3 font-medium text-foreground">Saved contractors</h2>
            {saved.length === 0 ? (
              <p className="mt-2 text-body-sm text-muted">None saved.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-body">
                {saved.map((item) => (
                  <li key={item.id}>{displayNameFor(item.contractorHandle)}</li>
                ))}
              </ul>
            )}
          </section>
          <section className="mt-10">
            <h2 className="text-h3 font-medium text-foreground">Previous Handshakes</h2>
            {handshakes.length === 0 ? (
              <p className="mt-2 text-body-sm text-muted">No Handshakes.</p>
            ) : (
              <ul className="mt-3 space-y-3">
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
          </section>
          <section className="mt-10">
            <h2 className="text-h3 font-medium text-foreground">Project history</h2>
            <ul className="mt-3 space-y-2 text-body-sm text-muted">
              {project.history.map((item) => (
                <li key={`${item.at}-${item.kind}`} className="whitespace-pre-wrap">
                  {item.kind === "scope_change" ? item.note : `${item.kind}: ${item.note}`}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <section className="mt-10">
        <h2 className="text-h3 font-medium text-foreground">{closed ? "Contractor responses" : "Best Matches"}</h2>
        {error ? <p className="mt-3 text-label text-destructive">{error}</p> : null}
        <RespondentGroup
          title="Can manage your whole project"
          people={whole}
          projectId={project.id}
          homeowner={session.handle}
          readOnly={closed}
          onError={setError}
        />
        <RespondentGroup
          title="Specialty work for part of it"
          people={specialty}
          projectId={project.id}
          homeowner={session.handle}
          readOnly={closed}
          onError={setError}
        />
      </section>
      <section className="mt-10">
        <h2 className="text-h3 font-medium text-foreground">All Respondents</h2>
        <RespondentGroup
          title="Everyone who responded"
          people={respondents}
          projectId={project.id}
          homeowner={session.handle}
          readOnly={closed}
          onError={setError}
        />
      </section>
      {openHandshake ? (
        <NeedFooter>
          <Link
            to={projectHandshakeHref(project.id, openHandshake.id)}
            className={buttonClassName({ size: "lg", className: "rounded-lg px-10" })}
          >
            Open Handshake
          </Link>
        </NeedFooter>
      ) : null}
    </div>
  );
}

function EditProjectForm({
  projectId,
  description,
  city,
  postalCode,
  timing,
  budgetBand,
  onDone,
}: {
  projectId: string;
  description: string;
  city: string;
  postalCode: string;
  timing: CxTiming | "";
  budgetBand: CxBudgetBand | "";
  onDone: () => void;
}) {
  const [nextDescription, setNextDescription] = useState(description);
  const [nextCity, setNextCity] = useState(city);
  const [nextPostal, setNextPostal] = useState(postalCode);
  const [nextTiming, setNextTiming] = useState(timing);
  const [nextBudget, setNextBudget] = useState(budgetBand);
  const [error, setError] = useState("");

  return (
    <form
      className="mt-6 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!nextDescription.trim() || !nextCity.trim() || !nextPostal.trim() || !nextTiming || !nextBudget) {
          setError("Finish the project details before saving.");
          return;
        }
        editLiveProject(projectId, {
          description: nextDescription.trim(),
          city: nextCity.trim(),
          postalCode: nextPostal.trim(),
          timing: nextTiming,
          budgetBand: nextBudget,
        });
        onDone();
      }}
    >
      <label className="block text-body-sm font-medium">
        Description
        <Textarea className="mt-1" value={nextDescription} onChange={(event) => setNextDescription(event.target.value)} />
      </label>
      <label className="block text-body-sm font-medium">
        City / Town
        <Input className="mt-1" value={nextCity} onChange={(event) => setNextCity(event.target.value)} />
      </label>
      <label className="block text-body-sm font-medium">
        ZIP / Postal Code
        <Input className="mt-1" value={nextPostal} onChange={(event) => setNextPostal(event.target.value)} />
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
      {error ? <p className="text-label text-destructive">{error}</p> : null}
      <Button type="submit" size="sm">
        Save project
      </Button>
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

function RespondentGroup({
  title,
  people,
  projectId,
  homeowner,
  readOnly = false,
  onError,
}: {
  title: string;
  people: CxRespondent[];
  projectId: string;
  homeowner: string;
  readOnly?: boolean;
  onError: (value: string) => void;
}) {
  const navigate = useNavigate();
  const compare = people.slice(0, 2);
  return (
    <div className="mt-6">
      <h3 className="text-body font-medium text-foreground">{title}</h3>
      {people.length === 0 ? (
        <p className="mt-2 text-body-sm text-muted">No one in this group yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {people.map((person) => {
            const connection = person.interest.connectionId ? getConnection(person.interest.connectionId) : undefined;
            const connected = connection?.status === "connected";
            return (
              <li key={person.handle} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-body font-medium">{displayNameFor(person.handle)}</p>
                  <p className="text-body-sm text-muted">
                    {person.group === "whole" ? "Whole project" : "Specialty"} ·{" "}
                    {relativeTime(person.interest.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {readOnly ? null : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSavedContractor(projectId, person.handle, homeowner)}
                  >
                    {person.interest.savedByHomeowner ? "Saved" : "Save"}
                  </Button>
                  )}
                  {!readOnly && compare.length === 2 ? (
                    <Link
                      to={vaelanceCompareHref(compare[0].handle, compare[1].handle)}
                      className={buttonClassName({ size: "sm", variant: "ghost" })}
                    >
                      Compare
                    </Link>
                  ) : null}
                  <Link to={vaelanceHref(person.handle)} className={buttonClassName({ size: "sm", variant: "outline" })}>
                    View VAELance
                  </Link>
                  {readOnly && !connection ? null : connection && (connected || connection.status === "closed") ? (
                    <Link
                      to={projectHandshakeHref(projectId, connection.id)}
                      className={buttonClassName({ size: "sm", variant: connected ? "primary" : "outline" })}
                    >
                      {connected ? "Handshake room" : "Handshake record"}
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
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
                      I'M INTERESTED
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
