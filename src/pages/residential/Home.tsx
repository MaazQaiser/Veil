import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert } from "@/components/ui/feedback";
import { buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { DistrictStatus } from "@/components/vael/status";
import { ResidentialAvailabilityCard } from "@/components/residential/ResidentialCards";
import { VisibilityCard } from "@/components/vael/visibility";
import { useResidential } from "@/lib/residentialCore";
import { districtBySlug } from "@/lib/districts";
import { hoursLeft } from "@/lib/vaelStore";

const BASE = "/districts/residential";

export function ResidentialHomePage() {
  const district = districtBySlug("residential")!;
  const { listing, latestListing, vaelKind, signedIn, myConnections } = useResidential();
  const pending = myConnections.filter((item) => item.status === "pending").length;
  const connected = myConnections.filter((item) => item.status === "connected" && !item.blocked).length;
  const hasRequest = Boolean(listing && (vaelKind === "in" || vaelKind === "out" || vaelKind === "expiring"));

  return (
    <CityPage>
      <PageHeader
        kicker="Live district"
        title="Residential"
        description="Tell us what you need at home. See who is available and relevant — then Handshake before anything private opens."
        crumbs={[{ label: "City", href: "/" }, { label: "Residential" }]}
        actions={<DistrictStatus status={district.status} />}
        primaryAction={
          <Link to={`${BASE}/vael`} className={buttonClassName()}>
            {hasRequest ? "Update need" : "Create VAEL"}
          </Link>
        }
        secondaryAction={
          <Link to="/matches?district=residential" className={buttonClassName({ variant: "outline" })}>
            Find Matches
          </Link>
        }
      />
      <div className="mt-8 space-y-10">
        <section>
          <p className="vael-kicker">{hasRequest ? "Your request" : "Get started"}</p>
          {hasRequest && listing ? (
            <div className="mt-3 max-w-xl space-y-3">
              <ResidentialAvailabilityCard
                side={vaelKind === "expiring" ? "expiring" : listing.side}
                hours={hoursLeft(listing.expiresAt)}
                service={listing.service}
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
                district="Residential"
                listing={latestListing}
                context={latestListing?.service}
                manageHref={`${BASE}/vael`}
                boardHref="/matches?district=residential"
              />
              <p className="text-body-sm text-muted">
                {signedIn
                  ? "Post a need to find people who are available for home work. You do not need construction jargon."
                  : "Continue locally, then post a need."}
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
          <h2 className="vael-h3">What you can use Residential for</h2>
          <p>
            A VAEL district for homeowners and civilians who need help at home, and for people available to do that work.
            It is not a contractor directory, not Real Estate, and not Construction Exchange.
          </p>
          <p className="vael-kicker mt-6">How you find someone</p>
          <p>Post a need. Say what, where, and when. The Board ranks available people by percentage fit.</p>
          <p className="vael-kicker mt-6">What happens after you submit a need</p>
          <p>
            Your need is visible for 24 hours. You see matches. Request Handshake. After both accept, you can message.
            Full provider details stay closed until then.
          </p>
        </section>

        <Alert tone="info" title="Not Real Estate">
          Real Estate is a separate Early Access lot. This Room is homeowner need → available people. Buying or listing
          property is not part of this flow.
        </Alert>

        <Alert tone="info" title="Not Construction Exchange">
          Construction is a professional availability Room with trade fields. Residential uses simpler home-need
          language. They share the City Handshake, not the same form.
        </Alert>

        <Alert tone="warning" title="This Room is local">
          Needs and matches stay in this browser. Two devices do not share a City. There is no map and no live
          scheduling.
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

export function ResidentialHowItWorksPage() {
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Residential"
        title="How it works"
        description="Post a need. See who is available. Handshake, then message."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Residential", href: BASE },
          { label: "How it works" },
        ]}
      />
      <ol className="mt-8 space-y-6 text-body-sm">
        <li>
          <p className="vael-kicker">1. Post a Need</p>
          <p className="mt-1">What you need, where, and when. 24 hours. You can update instead of starting over.</p>
        </li>
        <li>
          <p className="vael-kicker">2. Find Matches</p>
          <p className="mt-1">Percentage fit on service, location, and timing. Strong ≥80, Good ≥60, Possible ≥40.</p>
        </li>
        <li>
          <p className="vael-kicker">3. Request Handshake</p>
          <p className="mt-1">Same lock as the rest of the City. Both accept, then the private room opens.</p>
        </li>
        <li>
          <p className="vael-kicker">4. Message</p>
          <p className="mt-1">The shared VAEL conversation. SMS is not connected.</p>
        </li>
      </ol>
      <p className="mt-8 text-caption text-muted">
        If you are available for home work, you can still vael in from the same form. The primary path is a homeowner
        need.
      </p>
      <Link to={`${BASE}/vael`} className={buttonClassName({ className: "mt-6" })}>
        Post a Need
      </Link>
    </CityPage>
  );
}
