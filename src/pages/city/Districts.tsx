import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, ErrorState } from "@/components/ui/feedback";
import { DistrictCard } from "@/components/vael/cards";
import { DistrictStatus } from "@/components/vael/status";
import { Button, buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { JourneyProgress } from "@/components/city/setup";
import { useCitySession } from "@/lib/citySession";
import { districtBySlug, districts, isDistrictEnterable, primaryDistricts } from "@/lib/districts";

/** The Room a Provider's Media & Technology profile belongs to. */
const PROFILE_DISTRICT = "media-technology";

export function DistrictsPage() {
  const [params] = useSearchParams();
  if (params.get("setup") === "1") return <ChooseDistrictPage />;
  return <DistrictsBrowsePage />;
}

function ChooseDistrictPage() {
  const navigate = useNavigate();
  const { session } = useCitySession();
  const [chosen, setChosen] = useState(PROFILE_DISTRICT);
  const open = primaryDistricts;
  const notYet = districts.filter((district) => !isDistrictEnterable(district));
  const selected = districts.find((district) => district.id === chosen);

  return (
    <CityPage width="wide">
      <JourneyProgress step="District" />
      <PageHeader
        kicker="The City of VAEL"
        title="Choose your district"
        description="Choose where you want to offer your availability and connect with relevant opportunities."
        crumbs={[{ label: "City", href: "/" }, { label: "Districts" }]}
      />

      <fieldset className="mt-8">
        <legend className="sr-only">Choose the district you want to work in</legend>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {open.map((district) => (
            <DistrictCard
              key={district.id}
              name={district.name}
              status={district.status}
              summary={district.blurb}
              note={
                district.id === PROFILE_DISTRICT
                  ? "The profile you just built belongs to this district."
                  : "Open, but it keeps its own profile and matching. You would set that up separately."
              }
              selection={{
                group: "district",
                selected: chosen === district.id,
                onSelect: () => setChosen(district.id),
              }}
            />
          ))}
        </div>
      </fieldset>

      <section className="mt-14">
        <h2 className="vael-h4">Not open yet</h2>
        <p className="mt-2 text-body-sm text-muted">
          These lots are on the map but you cannot work in them yet. There is no waitlist.
        </p>
        <ul className="mt-6 border-t border-border-subtle">
          {notYet.map((district) => (
            <li
              key={district.id}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle py-4"
            >
              <div className="min-w-0">
                <p className="text-body text-muted">{district.name}</p>
                <p className="text-body-sm text-quiet">{district.blurb}</p>
              </div>
              <div className="flex items-center gap-4">
                <DistrictStatus status={district.status} />
                <Link
                  to={district.route}
                  className="text-body-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
                >
                  View status
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-14 flex flex-wrap items-center gap-3">
        <Button onClick={() => selected && navigate(selected.route)} disabled={!selected}>
          Continue
        </Button>
        <Link
          to={`/media-technology/profile/${session.handle}/edit`}
          className={buttonClassName({ variant: "ghost" })}
        >
          Back
        </Link>
      </div>
      {selected ? (
        <p className="mt-4 text-caption text-muted">Next: your {selected.name} overview.</p>
      ) : null}
    </CityPage>
  );
}

function DistrictsBrowsePage() {
  return (
    <CityPage width="wide">
      <PageHeader
        kicker="City"
        title="Districts"
        description="Rooms inside the City. Only live lots open a working Room. Coming Soon and Future lots stay labeled."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Districts" },
        ]}
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {primaryDistricts.map((district) => (
          <DistrictCard
            key={district.id}
            name={district.name}
            status={district.status}
            summary={district.summary}
            href={district.route}
          />
        ))}
      </div>
      <p className="mt-8 text-caption text-muted">
        Extra lots from the original registry (Healthcare, Equipment, Government, Real Estate, Legal & Finance) remain
        labeled placeholders and are not in the primary switcher.
      </p>
    </CityPage>
  );
}

export function DistrictPlaceholderPage() {
  const { slug } = useParams();
  const district = districtBySlug(slug) ?? districts.find((d) => d.slug === slug);

  if (!district) {
    return (
      <CityPage>
        <PageHeader kicker="City" title="Unknown lot" crumbs={[{ label: "City", href: "/" }, { label: "Districts", href: "/districts" }]} />
        <ErrorState
          title="This lot is not on the map"
          description="No district matches that slug."
          action={
            <Link to="/districts" className={buttonClassName({ variant: "outline" })}>
              Districts
            </Link>
          }
        />
      </CityPage>
    );
  }

  return (
    <CityPage>
      <PageHeader
        kicker="District lot"
        title={district.name}
        description={district.summary}
        crumbs={[
          { label: "City", href: "/" },
          { label: "Districts", href: "/districts" },
          { label: district.name },
        ]}
        actions={<DistrictStatus status={district.status} />}
      />
      <Alert
        tone="warning"
        title={district.status === "future" ? "Future Room" : district.status === "early" ? "Early Access" : "Coming Soon"}
      >
        This lot is not a working exchange. There is no Board, Veil form, or Handshake for {district.name} in this
        milestone.
        {district.registryName ? ` The original registry names this lot ${district.registryName}.` : null}
        {district.id === "real-estate"
          ? " Real Estate is not the homeowner flow. Residential is a separate live Room."
          : null}
      </Alert>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/" className={buttonClassName({ variant: "outline" })}>
          Return to the City
        </Link>
        {district.id === "real-estate" ? (
          <Link to="/districts/residential" className={buttonClassName()}>
            Open Residential
          </Link>
        ) : (
          <Link to="/media-technology" className={buttonClassName()}>
            Enter Media & Technology
          </Link>
        )}
      </div>
    </CityPage>
  );
}