import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert } from "@/components/ui/feedback";
import { buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { DistrictStatus } from "@/components/vael/status";
import { TruckingAvailabilityCard } from "@/components/trucking/TruckingCards";
import { VisibilityCard } from "@/components/vael/visibility";
import { useTrucking } from "@/lib/truckingCore";
import { districtBySlug } from "@/lib/districts";
import { hoursLeft } from "@/lib/vaelStore";

const BASE = "/districts/trucking";

export function TruckingHomePage() {
  const district = districtBySlug("trucking")!;
  const { listing, latestListing, vaelKind, signedIn } = useTrucking();
  return (
    <CityPage>
      <PageHeader
        kicker="Live district"
        title="Trucking Exchange"
        description="Available transportation capacity, or a load that needs it. Matching by route, timing, and capability — not a freight board."
        crumbs={[{ label: "City", href: "/" }, { label: "Trucking" }]}
        actions={<DistrictStatus status={district.status} />}
        primaryAction={
          <Link to={`${BASE}/vael`} className={buttonClassName()}>
            Create VAEL
          </Link>
        }
        secondaryAction={
          <Link to="/matches?district=trucking" className={buttonClassName({ variant: "outline" })}>
            View Matches
          </Link>
        }
      />
      <div className="mt-8 space-y-10">
        <section>
          <p className="vael-kicker">Your status</p>
          {listing && (vaelKind === "in" || vaelKind === "out" || vaelKind === "expiring") ? (
            <div className="mt-3 max-w-xl">
              <TruckingAvailabilityCard
                side={vaelKind === "expiring" ? "expiring" : listing.side}
                hours={hoursLeft(listing.expiresAt)}
                origin={listing.origin}
                destination={listing.destination}
                availability={listing.availability}
                equipment={listing.equipment}
                capacity={listing.capacity}
              />
            </div>
          ) : (
            <div className="mt-3 max-w-xl">
              <VisibilityCard
                district="Trucking"
                listing={latestListing}
                context={latestListing?.equipment}
                manageHref={`${BASE}/vael`}
                boardHref="/matches?district=trucking"
              />
              {!signedIn ? (
                <p className="mt-3 text-body-sm text-muted">Continue locally, then Vael In or Vael Out in this Room.</p>
              ) : null}
            </div>
          )}
        </section>

        <section className="max-w-2xl space-y-4 text-body-sm">
          <p className="vael-kicker">This Room</p>
          <h2 className="vael-h3">What Trucking Exchange is</h2>
          <p>
            A VAEL district for carriers, drivers, and trucking businesses with capacity, and for shippers or businesses
            with a load. It is not a public freight marketplace and not a dispatch dashboard.
          </p>
          <p className="vael-kicker mt-6">Who it is for</p>
          <p>
            People or companies with transportation capacity available, and people or businesses who need transportation.
          </p>
          <p className="vael-kicker mt-6">What you can post</p>
          <p>
            A 24-hour VAEL: capacity on a lane, or a load with origin, destination, timing, and equipment. A Trucking
            profile holds identity, equipment, service lanes, and documents on this device.
          </p>
          <p className="vael-kicker mt-6">What you can find</p>
          <p>
            Opposite-side listings ranked by percentage fit — route, availability, capacity, equipment — not a table of
            every load in a market.
          </p>
          <p className="vael-kicker mt-6">How matching works</p>
          <p>
            Opposite-side VAELs rank on Trucking criteria: origin, destination, equipment, capacity, availability,
            capability labels, experience. Media & Technology and Construction scoring are not used here.
          </p>
          <p className="vael-kicker mt-6">How Handshake works</p>
          <p>Request Handshake. Full Trucking profile details stay closed until both parties accept. Then you can message.</p>
        </section>

        <Alert tone="info" title="This Room is local">
          Trucking listings stay in this browser. Two devices do not share a City. There is no live map and no DOT or MC
          number in this kit.
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

export function TruckingHowItWorksPage() {
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Trucking Exchange"
        title="How it works"
        description="The VAEL spine with Trucking fields. Load, route, availability, capability."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Trucking", href: BASE },
          { label: "How it works" },
        ]}
      />
      <ol className="mt-8 space-y-6 text-body-sm">
        <li>
          <p className="vael-kicker">1. Profile</p>
          <p className="mt-1">
            Identity, equipment, service lanes, experience, documents. Rates and history stay closed until Handshake.
          </p>
        </li>
        <li>
          <p className="vael-kicker">2. Vael</p>
          <p className="mt-1">
            Vael In — I have transportation capacity available. Vael Out — I need transportation. 24 hours.
          </p>
        </li>
        <li>
          <p className="vael-kicker">3. Board</p>
          <p className="mt-1">
            Percentage fit on Trucking criteria. Route and timing first. Strong ≥80, Good ≥60, Possible ≥40.
          </p>
        </li>
        <li>
          <p className="vael-kicker">4. Handshake</p>
          <p className="mt-1">Same lock as the rest of the City. Both accept, then the private room opens.</p>
        </li>
      </ol>
      <Link to={`${BASE}/vael`} className={buttonClassName({ className: "mt-8" })}>
        Create VAEL
      </Link>
    </CityPage>
  );
}
