import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert } from "@/components/ui/feedback";
import { buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { DistrictStatus } from "@/components/vael/status";
import { CommercialAvailabilityCard } from "@/components/commercial/CommercialCards";
import { VisibilityCard } from "@/components/vael/visibility";
import { useCommercial } from "@/lib/commercialCore";
import { districtBySlug } from "@/lib/districts";
import { hoursLeft } from "@/lib/vaelStore";

const BASE = "/districts/commercial";

export function CommercialHomePage() {
  const district = districtBySlug("commercial")!;
  const { listing, latestListing, vaelKind, signedIn, myConnections } = useCommercial();
  const pending = myConnections.filter((item) => item.status === "pending").length;
  const connected = myConnections.filter((item) => item.status === "connected" && !item.blocked).length;
  const hasRequest = Boolean(listing && (vaelKind === "in" || vaelKind === "out" || vaelKind === "expiring"));

  return (
    <CityPage>
      <PageHeader
        kicker="Live district"
        title="Commercial"
        description="State a business need. See companies and providers who can fulfill it — then Handshake before anything private opens."
        crumbs={[{ label: "City", href: "/" }, { label: "Commercial" }]}
        actions={<DistrictStatus status={district.status} />}
        primaryAction={
          <Link to={`${BASE}/vael`} className={buttonClassName()}>
            {hasRequest ? "Update need" : "Create VAEL"}
          </Link>
        }
        secondaryAction={
          <Link to="/matches?district=commercial" className={buttonClassName({ variant: "outline" })}>
            Find Matches
          </Link>
        }
      />
      <div className="mt-8 space-y-10">
        <section>
          <p className="vael-kicker">{hasRequest ? "Active work" : "Get started"}</p>
          {hasRequest && listing ? (
            <div className="mt-3 max-w-xl space-y-3">
              <CommercialAvailabilityCard
                side={vaelKind === "expiring" ? "expiring" : listing.side}
                hours={hoursLeft(listing.expiresAt)}
                capability={listing.capability}
                area={listing.area}
                availability={listing.availability}
              />
              <p className="text-body-sm text-muted">
                You do not need to start over. Update the need, or go to matches from here.
              </p>
            </div>
          ) : (
            <div className="mt-3 max-w-xl space-y-3">
              <VisibilityCard
                district="Commercial"
                listing={latestListing}
                context={latestListing?.capability}
                manageHref={`${BASE}/vael`}
                boardHref="/matches?district=commercial"
              />
              <p className="text-body-sm text-muted">
                {signedIn
                  ? "Create a need to find companies or providers who can fulfill a business capability. This is not a homeowner flow."
                  : "Continue locally, then create a need."}
              </p>
            </div>
          )}
          {pending || connected ? (
            <ul className="mt-4 flex flex-wrap gap-3 text-body-sm">
              {pending ? (
                <li>
                  <Link to={`${BASE}/connections`} className="underline">
                    {pending} pending Handshake{pending === 1 ? "" : "s"}
                  </Link>
                </li>
              ) : null}
              {connected ? (
                <li>
                  <Link to={`${BASE}/connections`} className="underline">
                    {connected} connection{connected === 1 ? "" : "s"}
                  </Link>
                </li>
              ) : null}
            </ul>
          ) : null}
        </section>

        <section className="max-w-2xl space-y-4 text-body-sm">
          <p className="vael-kicker">This Room</p>
          <h2 className="vael-h3">What Commercial is for</h2>
          <p>
            A VAEL district for businesses that need a capability, and for companies or professionals who can fulfill
            that need. It is not a homeowner marketplace, not Construction Exchange, not a job board, and not a
            procurement system.
          </p>
          <p className="vael-kicker mt-6">Who it is for</p>
          <p>
            A business with a defined need. A company or provider who can fulfill that need. The primary path is the
            business need.
          </p>
          <p className="vael-kicker mt-6">How matching works</p>
          <p>
            Create a need. Say what capability, where, when, and what is required. The Board ranks available providers
            by percentage fit to that need.
          </p>
          <p className="vael-kicker mt-6">What happens after a match</p>
          <p>
            Request Handshake. After both accept, company details and conversation open. Private information stays
            closed until then.
          </p>
        </section>

        <Alert tone="info" title="Not Residential">
          Residential is for homeowners who need help at home. Commercial is for business capability. They share the
          City Handshake, not the same intake.
        </Alert>

        <Alert tone="info" title="Not Construction Exchange">
          Construction is professional availability by trade. Commercial is a business need against a company or
          provider capability. They do not share scoring.
        </Alert>

        <Alert tone="warning" title="This Room is local">
          Needs and matches stay in this browser. Two devices do not share a City. There is no map and no procurement
          workflow.
        </Alert>

        <section className="grid gap-3 sm:grid-cols-2">
          <Link to={`${BASE}/how-it-works`} className={buttonClassName({ variant: "ghost" })}>
            How it works
          </Link>
          <Link to={`${BASE}/community`} className={buttonClassName({ variant: "ghost" })}>
            Community
          </Link>
          <Link to={`${BASE}/connections`} className={buttonClassName({ variant: "ghost" })}>
            Handshakes
          </Link>
        </section>
      </div>
    </CityPage>
  );
}

export function CommercialHowItWorksPage() {
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Commercial"
        title="How it works"
        description="Create a need. See who can fulfill it. Handshake, then message."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Commercial", href: BASE },
          { label: "How it works" },
        ]}
      />
      <ol className="mt-8 space-y-6 text-body-sm">
        <li>
          <p className="vael-kicker">1. Create a Need</p>
          <p className="mt-1">Capability, context, location, timing, and requirements. 24 hours. You can update instead of starting over.</p>
        </li>
        <li>
          <p className="vael-kicker">2. Find Matches</p>
          <p className="mt-1">Percentage fit on capability, location, timing, and requirements. Strong ≥80, Good ≥60, Possible ≥40.</p>
        </li>
        <li>
          <p className="vael-kicker">3. Request Handshake</p>
          <p className="mt-1">Same lock as the rest of the City. Both accept, then the private room opens.</p>
        </li>
        <li>
          <p className="vael-kicker">4. Open Conversation</p>
          <p className="mt-1">The shared VAEL conversation. SMS is not connected.</p>
        </li>
      </ol>
      <p className="mt-8 text-caption text-muted">
        If you can fulfill a commercial need, you can still list availability from the same form. The primary path is a
        business need.
      </p>
      <Link to={`${BASE}/vael`} className={buttonClassName({ className: "mt-6" })}>
        Create a Need
      </Link>
    </CityPage>
  );
}
