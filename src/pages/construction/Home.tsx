import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert } from "@/components/ui/feedback";
import { buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { DistrictStatus } from "@/components/vael/status";
import { ConstructionAvailabilityCard } from "@/components/construction/ConstructionCards";
import { VisibilityCard } from "@/components/vael/visibility";
import { useConstruction } from "@/lib/constructionCore";
import { districtBySlug } from "@/lib/districts";
import { hoursLeft } from "@/lib/vaelStore";

const BASE = "/districts/contractor";

export function ConstructionHomePage() {
  const district = districtBySlug("contractor")!;
  const { listing, latestListing, veilKind, signedIn } = useConstruction();
  return (
    <CityPage>
      <PageHeader
        kicker="Live district"
        title="Construction Exchange"
        description="Available construction capability, or a need for it. Matching by trade, service area, and fit — not a contractor directory."
        crumbs={[{ label: "City", href: "/" }, { label: "Construction" }]}
        actions={<DistrictStatus status={district.status} />}
        primaryAction={
          <Link to={`${BASE}/veil`} className={buttonClassName()}>
            Create VAEL
          </Link>
        }
        secondaryAction={
          <Link to="/matches?district=construction" className={buttonClassName({ variant: "outline" })}>
            View Matches
          </Link>
        }
      />
      <div className="mt-8 space-y-10">
        <section>
          <p className="vael-kicker">Your status</p>
          {listing && (veilKind === "in" || veilKind === "out" || veilKind === "expiring") ? (
            <div className="mt-3 max-w-xl">
              <ConstructionAvailabilityCard
                side={veilKind === "expiring" ? "expiring" : listing.side}
                hours={hoursLeft(listing.expiresAt)}
                trade={listing.trade}
                serviceArea={listing.serviceArea}
                availability={listing.availability}
              />
            </div>
          ) : (
            <div className="mt-3 max-w-xl">
              <VisibilityCard
                district="Construction"
                listing={latestListing}
                context={latestListing?.trade}
                manageHref={`${BASE}/veil`}
                boardHref="/matches?district=construction"
              />
              {!signedIn ? (
                <p className="mt-3 text-body-sm text-muted">Continue locally, then Veil In or Veil Out in this Room.</p>
              ) : null}
            </div>
          )}
        </section>

        <section className="max-w-2xl space-y-4 text-body-sm">
          <p className="vael-kicker">This Room</p>
          <h2 className="vael-h3">What Construction Exchange is</h2>
          <p>
            A VAEL district for construction professionals and companies, and for people or businesses who need that
            capability. It is not a job board and not a public contractor list.
          </p>
          <p className="vael-kicker mt-6">Who it is for</p>
          <p>People or companies available for construction work, and people or businesses who need that work.</p>
          <p className="vael-kicker mt-6">What you can do</p>
          <p>Keep a Construction profile. Veil for 24 hours. See percentage fit. Request a Handshake. Message after both accept.</p>
          <p className="vael-kicker mt-6">How matching works</p>
          <p>
            Opposite-side VAELs rank by Construction criteria: trade, job type, capabilities, service area, availability,
            listed credentials, experience. Media & Technology scoring is not used here.
          </p>
          <p className="vael-kicker mt-6">How you connect</p>
          <p>Request Handshake. Full Construction profile details stay closed until both parties accept.</p>
        </section>

        <Alert tone="info" title="This Room is local">
          Construction listings stay in this browser. Two devices do not share a City. The URL still uses the Contractor
          slug.
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

export function ConstructionHowItWorksPage() {
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Construction Exchange"
        title="How it works"
        description="The VAEL spine with Construction fields. Not Media & Technology’s form."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Construction", href: BASE },
          { label: "How it works" },
        ]}
      />
      <ol className="mt-8 space-y-6 text-body-sm">
        <li>
          <p className="vael-kicker">1. Profile</p>
          <p className="mt-1">Trade, service area, credentials, documents. Rates and portfolio stay closed until Handshake.</p>
        </li>
        <li>
          <p className="vael-kicker">2. Veil</p>
          <p className="mt-1">Veil In — I am available for construction work. Veil Out — I need construction capability. 24 hours.</p>
        </li>
        <li>
          <p className="vael-kicker">3. Board</p>
          <p className="mt-1">Percentage fit on Construction criteria. Strong ≥80, Good ≥60, Possible ≥40.</p>
        </li>
        <li>
          <p className="vael-kicker">4. Handshake</p>
          <p className="mt-1">Same lock as the rest of the City. Both accept, then the private room opens.</p>
        </li>
      </ol>
      <Link to={`${BASE}/veil`} className={buttonClassName({ className: "mt-8" })}>
        Create VAEL
      </Link>
    </CityPage>
  );
}
