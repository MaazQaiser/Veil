import { useState, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { useJoinedDistricts } from "@/components/mt/DistrictsRow";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Textarea } from "@/components/ui/controls";
import { IconCheck, IconChevronLeft, IconLock } from "@/components/ui/icons";
import { useCitySession } from "@/lib/citySession";
import {
  askProjectQuestion,
  contractorInterested,
  contractorStanding,
  getCxProject,
  ineligibleReason,
  interestBetween,
  publicProjectCard,
  questionsForProject,
} from "@/lib/cxProjectStore";
import { BROWSE_OPPORTUNITIES_PATH, projectHandshakeHref, projectHref } from "@/lib/cxRoutes";
import { formatDate, relativeTime } from "@/lib/time";
import { useCxProjects } from "@/lib/useCxProjects";
import { useVael } from "@/lib/vaelCore";

const JOIN_PATH = "/join/contractor-exchange";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-caption font-medium uppercase tracking-[0.1em] text-muted">{label}</dt>
      <dd className="mt-1 text-body text-foreground">{children}</dd>
    </div>
  );
}

/**
 * One live opportunity, seen by a contractor. The panel on the right always says where they stand:
 * join, respond, waiting on the homeowner, or connected.
 */
export function OpportunityDetailPage() {
  useCxProjects();
  const { projectId = "" } = useParams();
  const { session } = useCitySession();
  const { handle, profile, documents } = useVael();
  const mine = handle ? profile(handle) : undefined;
  const joined = useJoinedDistricts(handle, mine, handle ? documents(handle) : []).some(
    (row) => row.district.id === "construction",
  );
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const project = getCxProject(projectId);

  if (!session.signedIn) return <Navigate to={`/sign-in?next=/districts/contractor/opportunities/${projectId}`} replace />;
  if (project && project.handle === session.handle) return <Navigate to={projectHref(project.id)} replace />;

  if (!project || project.status !== "live") {
    return (
      <CityPage width="narrow">
        <h1 className="font-sans text-h2 font-medium text-foreground">This opportunity isn't open</h1>
        <p className="mt-2 text-body text-muted">It may have closed, or it isn't on this device.</p>
        <Link to={BROWSE_OPPORTUNITIES_PATH} className={buttonClassName({ className: "mt-6" })}>
          Back to Opportunities
        </Link>
      </CityPage>
    );
  }

  const card = publicProjectCard(project);
  const standing = contractorStanding(project.id, session.handle);
  const interest = interestBetween(project.id, session.handle);
  const reason = ineligibleReason(project, session.handle);
  const questions = questionsForProject(project.id);
  const daysLeft = project.liveUntil
    ? Math.max(0, Math.ceil((Date.parse(project.liveUntil) - Date.now()) / 86400000))
    : 0;

  return (
    <DashboardShell sidebar={false}>
      <Link
        to={BROWSE_OPPORTUNITIES_PATH}
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
      >
        <IconChevronLeft className="h-3.5 w-3.5" />
        Back to Opportunities
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
            {card.category || "Opportunity"}
          </h1>
          <p className="mt-1.5 text-body-sm text-muted">
            {[project.firstName, card.postedAt ? `Posted ${relativeTime(card.postedAt) || formatDate(card.postedAt)}` : ""]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="live">Live</Badge>
          <span className="text-body-sm text-muted">
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-caption font-semibold uppercase tracking-[0.14em] text-accent">The project</h2>
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <Fact label="Location">{[card.city, card.postalCode].filter(Boolean).join(" · ") || "Not listed."}</Fact>
              <Fact label="Start timing">{card.timing || "Not listed."}</Fact>
              <Fact label="Budget">{card.budgetBand || "Not listed."}</Fact>
              <Fact label="Date posted">{card.postedAt ? formatDate(card.postedAt) : "Not listed."}</Fact>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-caption font-semibold uppercase tracking-[0.14em] text-accent">What needs doing</h2>
            {joined ? (
              <>
                <p className="mt-4 whitespace-pre-wrap text-body text-foreground">{card.description || "No description."}</p>
                {card.photos.length > 0 || project.video ? (
                  <div className="mt-5">
                    {card.photos.length > 0 ? (
                      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {card.photos.map((src, index) => (
                          <li key={index}>
                            <img src={src} alt="" className="h-28 w-full rounded-lg object-cover" />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {project.video ? <video src={project.video} controls className="mt-3 max-h-64 w-full rounded-lg" /> : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-4 flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-muted p-4 text-body-sm text-muted">
                <IconLock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                The description and photos are for members of Contractor Exchange.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-caption font-semibold uppercase tracking-[0.14em] text-accent">Questions</h2>
            <p className="mt-2 text-body-sm text-muted">Questions stay on this project. They are not a private message.</p>
            {joined ? (
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
                <Button type="submit" variant="outline" disabled={!question.trim()}>
                  Post on project
                </Button>
              </form>
            ) : null}
            {questions.length === 0 ? (
              <p className="mt-4 text-body-sm text-muted">No questions yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {questions.map((item) => (
                  <li key={item.id} className="rounded-xl border border-border-subtle p-4 text-body-sm">
                    <p className="text-foreground">{item.body}</p>
                    {item.answer ? <p className="mt-2 text-muted">{item.answer}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-caption font-semibold uppercase tracking-[0.14em] text-accent">Your response</h2>

          {!joined ? (
            <>
              <p className="mt-3 text-body text-foreground">Join Contractor Exchange to see the full project and show interest.</p>
              <Link to={JOIN_PATH} className={buttonClassName({ className: "mt-5 w-full" })}>
                Join the Contractor Exchange
              </Link>
            </>
          ) : standing === "connected" && interest?.connectionId ? (
            <>
              <p className="mt-3 flex items-center gap-2 text-body font-medium text-foreground">
                <IconCheck className="h-4 w-4 text-success" />
                You're connected
              </p>
              <p className="mt-1 text-body-sm text-muted">You and the homeowner are both interested. The Handshake is open.</p>
              <Link
                to={projectHandshakeHref(project.id, interest.connectionId)}
                className={buttonClassName({ className: "mt-5 w-full" })}
              >
                Open Handshake
              </Link>
            </>
          ) : standing === "interested" ? (
            <>
              <p className="mt-3 flex items-center gap-2 text-body font-medium text-foreground">
                <IconCheck className="h-4 w-4 text-success" />
                You're interested
              </p>
              <p className="mt-1 text-body-sm text-muted">
                The homeowner can now review your profile. If they're interested too, a Handshake opens and we'll tell you.
              </p>
            </>
          ) : reason ? (
            <>
              <p className="mt-3 text-body text-foreground">This one is outside what you take on.</p>
              <p className="mt-1 text-body-sm text-muted">{reason}</p>
              <Link
                to={`/media-technology/profile/${session.handle}`}
                className={buttonClassName({ variant: "outline", className: "mt-5 w-full" })}
              >
                Update what you take on
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-body text-foreground">Interested in this project?</p>
              <p className="mt-1 text-body-sm text-muted">
                The homeowner reviews your profile and decides if they're interested too. Nothing is shared until you both are.
              </p>
              <Button
                type="button"
                className="mt-5 w-full"
                onClick={() => {
                  try {
                    contractorInterested(project.id, session.handle);
                    setError("");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Could not respond.");
                  }
                }}
              >
                I'm interested
              </Button>
            </>
          )}
          {error ? <p className="mt-3 text-label text-destructive">{error}</p> : null}
        </aside>
      </div>
    </DashboardShell>
  );
}
