import { Link } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { ResidentialAreas } from "@/components/construction/ResidentialAreas";
import { PageHeader } from "@/components/ui/headers";
import { Button, buttonClassName } from "@/components/ui/button";
import { useCitySession } from "@/lib/citySession";
import { contractorInterested, interestBetween, opportunitiesForVaelIn, responsesForContractor } from "@/lib/cxProjectStore";
import { opportunityHref } from "@/lib/cxRoutes";
import { CX_ACCESS_NOTICE, CX_ACCESS_PRICE_LABEL } from "@/lib/cxAccess";
import { useCxProjects } from "@/lib/useCxProjects";
import { formatDate } from "@/lib/time";
import { useState } from "react";

export function OpportunitiesListPage() {
  useCxProjects();
  const { session } = useCitySession();
  const [error, setError] = useState("");
  if (!session.signedIn) {
    return (
      <CityPage width="narrow">
        <PageHeader title="Opportunities" description="Sign in to see work that matches what you do." />
        <Link to="/sign-in" className={buttonClassName({ className: "mt-6" })}>
          Sign in
        </Link>
      </CityPage>
    );
  }
  const items = opportunitiesForVaelIn(session.handle);
  const responses = responsesForContractor(session.handle);

  return (
    <DashboardShell>
      <ResidentialAreas />
      <div>
        <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
          Available Opportunities
        </h1>
        <p className="mt-1 text-body-sm text-muted">Projects posted from Vael Out, ready for you to review.</p>
        <p className="mt-4 inline-flex max-w-full items-start gap-2 rounded-full bg-white/[0.05] px-4 py-2 text-caption text-muted">
          <span className="font-medium text-foreground">Residential Opportunity Access</span>
          <span aria-hidden>·</span>
          <span>
            {CX_ACCESS_PRICE_LABEL} · {CX_ACCESS_NOTICE}
          </span>
        </p>
      </div>
      {error ? <p className="text-label text-destructive">{error}</p> : null}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-accent/25 bg-accent/[0.05] px-5 py-10 text-center text-body-sm text-muted">
          No open projects match what you do right now. New ones posted from Vael Out will show up here.
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const interest = interestBetween(item.id, session.handle);
            const sent = Boolean(interest?.contractorInterested);
            return (
              <li key={item.id} className="flex flex-col rounded-lg border border-border bg-surface p-5 sm:p-6">
                <Link to={opportunityHref(item.id)} className="block flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-accent/15 px-3 py-1 text-caption font-medium text-accent">
                      {item.category}
                    </span>
                    <span className="text-caption text-quiet">
                      {item.publishedAt ? formatDate(item.publishedAt) : ""}
                    </span>
                  </div>
                  <p className="mt-4 text-body font-medium text-foreground">
                    {item.city} / {item.postalCode}
                  </p>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-body-sm text-muted">{item.description}</p>
                  {item.photos.length > 0 ? (
                    <ul className="mt-4 grid grid-cols-4 gap-2">
                      {item.photos.map((src, index) => (
                        <li key={index}>
                          <img src={src} alt="" className="h-16 w-full rounded-md object-cover" />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/[0.06] px-3 py-1 text-caption text-muted">
                      Start: {item.timing}
                    </span>
                    {item.budgetBand ? (
                      <span className="rounded-full bg-white/[0.06] px-3 py-1 text-caption text-muted">
                        Budget: {item.budgetBand}
                      </span>
                    ) : null}
                    {item.video ? (
                      <span className="rounded-full bg-white/[0.06] px-3 py-1 text-caption text-muted">1 short video</span>
                    ) : null}
                  </div>
                </Link>
                <div className="mt-5 border-t border-border-subtle pt-4">
                  {sent ? (
                    <div>
                      <p className="text-body-sm font-medium text-accent">You're interested.</p>
                      <p className="mt-1 text-body-sm text-muted">
                        The homeowner can now review your VAELance and decide if they're interested too.
                      </p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      className="rounded-full px-6"
                      onClick={() => {
                        try {
                          contractorInterested(item.id, session.handle);
                          setError("");
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Could not respond.");
                        }
                      }}
                    >
                      I'm interested
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section>
        <h2 className="text-h4 font-medium text-foreground">Your responses</h2>
        <p className="mt-1 text-body-sm text-muted">Projects you have already said you are interested in.</p>
        {responses.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-accent/25 bg-accent/[0.05] px-5 py-8 text-center text-body-sm text-muted">
            No responses yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border-subtle rounded-lg border border-border bg-surface">
            {responses.map((item) => (
              <li key={item.id}>
                <Link
                  to={opportunityHref(item.id)}
                  className="flex items-center justify-between gap-4 px-5 py-4 motion-safe:transition-colors hover:bg-white/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium text-foreground">{item.category || "Project"}</p>
                    <p className="mt-0.5 text-body-sm text-muted">
                      {item.city} / {item.postalCode}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-caption font-medium capitalize text-accent">
                    {item.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}
