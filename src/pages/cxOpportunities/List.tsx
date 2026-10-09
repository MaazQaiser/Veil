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
        <p className="mt-1 text-caption text-quiet">
          Residential Opportunity Access — {CX_ACCESS_PRICE_LABEL} · {CX_ACCESS_NOTICE}
        </p>
      </div>
      {error ? <p className="mt-4 text-label text-destructive">{error}</p> : null}
      {items.length === 0 ? (
        <p className="mt-8 text-body text-muted">No open projects match what you do right now.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((item) => {
            const interest = interestBetween(item.id, session.handle);
            const sent = Boolean(interest?.contractorInterested);
            return (
              <li key={item.id} className="rounded-lg border border-border p-5">
                <Link to={opportunityHref(item.id)} className="block">
                  <p className="text-caption font-bold uppercase tracking-[0.08em] text-[#DE7C40]">{item.category}</p>
                  <p className="mt-2 text-body text-foreground">
                    {item.city} / {item.postalCode}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-body text-foreground">{item.description}</p>
                  {item.photos.length > 0 ? (
                    <ul className="mt-3 grid grid-cols-4 gap-2">
                      {item.photos.map((src, index) => (
                        <li key={index}>
                          <img src={src} alt="" className="h-16 w-full rounded-md object-cover" />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {item.video ? <p className="mt-3 text-body-sm text-muted">1 short video</p> : null}
                  <p className="mt-3 text-body-sm text-muted">Start: {item.timing}</p>
                  {item.budgetBand ? <p className="mt-1 text-body-sm text-muted">Budget: {item.budgetBand}</p> : null}
                  <p className="mt-1 text-body-sm text-muted">
                    Posted: {item.publishedAt ? formatDate(item.publishedAt) : ""}
                  </p>
                </Link>
                {sent ? (
                  <div className="mt-4">
                    <p className="text-body font-medium text-foreground">You're interested.</p>
                    <p className="mt-1 text-body-sm text-muted">
                      The homeowner can now review your VAELance and decide if they're interested too.
                    </p>
                  </div>
                ) : (
                  <Button
                    type="button"
                    className="mt-4"
                    onClick={() => {
                      try {
                        contractorInterested(item.id, session.handle);
                        setError("");
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Could not respond.");
                      }
                    }}
                  >
                    I'M INTERESTED
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <section className="mt-10">
        <h2 className="text-h4 font-medium text-foreground">Your responses</h2>
        <p className="mt-1 text-body-sm text-muted">Projects you have already said you are interested in.</p>
        {responses.length === 0 ? (
          <p className="mt-3 text-body-sm text-muted">No responses yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {responses.map((item) => (
              <li key={item.id}>
                <Link to={opportunityHref(item.id)} className="block py-4">
                  <p className="text-body font-medium text-foreground">{item.category || "Project"}</p>
                  <p className="mt-1 text-body-sm text-muted">
                    {item.city} / {item.postalCode}
                    {item.status === "live" ? " · Live" : ` · ${item.status}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}
