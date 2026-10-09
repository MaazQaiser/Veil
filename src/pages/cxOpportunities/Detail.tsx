import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { ResidentialAreas } from "@/components/construction/ResidentialAreas";
import { IconChevronLeft } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/headers";
import { Button, buttonClassName } from "@/components/ui/button";
import { Textarea } from "@/components/ui/controls";
import { useCitySession } from "@/lib/citySession";
import {
  askProjectQuestion,
  contractorEligibleFor,
  contractorInterested,
  getCxProject,
  interestBetween,
  postedByVaelOut,
  publicProjectCard,
  questionsForProject,
} from "@/lib/cxProjectStore";
import { CONTRACTOR_OPPS_PATH } from "@/lib/cxRoutes";
import { useCxProjects } from "@/lib/useCxProjects";
import { formatDate } from "@/lib/time";

export function OpportunityDetailPage() {
  useCxProjects();
  const { projectId = "" } = useParams();
  const { session } = useCitySession();
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const project = getCxProject(projectId);

  const visible = Boolean(
    project &&
      project.status === "live" &&
      project.handle !== session.handle &&
      (postedByVaelOut(project.handle) || contractorEligibleFor(project, session.handle)),
  );

  if (!session.signedIn) return <Navigate to="/sign-in" replace />;
  if (!project || !visible) {
    return (
      <CityPage width="narrow">
        <PageHeader title="Opportunity not found" />
        <Link to={CONTRACTOR_OPPS_PATH} className={buttonClassName({ className: "mt-6" })}>
          Opportunities
        </Link>
      </CityPage>
    );
  }

  const card = publicProjectCard(project);
  const interest = interestBetween(project.id, session.handle);
  const sent = Boolean(interest?.contractorInterested);
  const questions = questionsForProject(project.id);

  return (
    <DashboardShell>
      <ResidentialAreas />
      <Link
        to={CONTRACTOR_OPPS_PATH}
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
      >
        <IconChevronLeft className="h-3.5 w-3.5" />
        Back to Opportunities
      </Link>
      <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
        {card.category || "Opportunity"}
      </h1>
      <dl className="mt-6 space-y-4">
        <div>
          <dt className="text-label font-medium text-muted">Project category</dt>
          <dd className="mt-1 text-body text-foreground">{card.category}</dd>
        </div>
        <div>
          <dt className="text-label font-medium text-muted">Location</dt>
          <dd className="mt-1 text-body text-foreground">
            {card.city} / {card.postalCode}
          </dd>
        </div>
        <div>
          <dt className="text-label font-medium text-muted">Project description</dt>
          <dd className="mt-1 whitespace-pre-wrap text-body text-foreground">{card.description}</dd>
        </div>
        <div>
          <dt className="text-label font-medium text-muted">Photos/video</dt>
          <dd className="mt-2">
            {card.photos.length > 0 ? (
              <ul className="grid grid-cols-3 gap-2">
                {card.photos.map((src, index) => (
                  <li key={index}>
                    <img src={src} alt="" className="h-24 w-full rounded-md object-cover" />
                  </li>
                ))}
              </ul>
            ) : null}
            {project.video ? (
              <video src={project.video} controls className="mt-2 max-h-48 w-full rounded-md" />
            ) : null}
            {card.photos.length === 0 && !project.video ? <p className="text-body text-foreground">None</p> : null}
          </dd>
        </div>
        <div>
          <dt className="text-label font-medium text-muted">Start timing</dt>
          <dd className="mt-1 text-body text-foreground">{card.timing}</dd>
        </div>
        {card.budgetBand ? (
          <div>
            <dt className="text-label font-medium text-muted">Budget</dt>
            <dd className="mt-1 text-body text-foreground">{card.budgetBand}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-label font-medium text-muted">Date posted</dt>
          <dd className="mt-1 text-body text-foreground">{card.postedAt ? formatDate(card.postedAt) : ""}</dd>
        </div>
      </dl>

      <div className="mt-8">
        {sent ? (
          <div>
            <p className="text-body font-medium text-foreground">You're interested.</p>
            <p className="mt-1 text-body-sm text-muted">
              The homeowner can now review your VAELance and decide if they're interested too.
            </p>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => {
              try {
                contractorInterested(project.id, session.handle);
                setError("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not respond.");
              }
            }}
          >
            I'M INTERESTED
          </Button>
        )}
      </div>
      {error ? <p className="mt-3 text-label text-destructive">{error}</p> : null}

      <section className="mt-10">
        <h2 className="text-h4 font-medium">Question about this project</h2>
        <p className="mt-1 text-body-sm text-muted">Questions stay on this project. They are not a private message.</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const body = question.trim();
            if (!body) return;
            askProjectQuestion(project.id, session.handle, body);
            setQuestion("");
          }}
        >
          <label htmlFor="project-question" className="sr-only">
            Question about this project
          </label>
          <Textarea
            id="project-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question about the project"
          />
          <Button type="submit" variant="outline">
            Post on project
          </Button>
        </form>
        <ul className="mt-4 space-y-3">
          {questions.map((item) => (
            <li key={item.id} className="rounded-lg border border-border p-4 text-body-sm">
              <p>{item.body}</p>
              {item.answer ? <p className="mt-2 text-muted">{item.answer}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  );
}
