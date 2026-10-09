import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, ErrorState } from "@/components/ui/feedback";
import { DistrictCard } from "@/components/vael/cards";
import { DistrictStatus } from "@/components/vael/status";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { JourneyProgress } from "@/components/city/setup";
import { useCitySession } from "@/lib/citySession";
import { districtBySlug, districts, isDistrictEnterable, primaryDistricts } from "@/lib/districts";
import type { DistrictLotStatus } from "@/components/vael/status";

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

/** Website district cards. Live districts send the visitor to sign in or sign up. */
const WEBSITE_DISTRICT_CARDS: {
  id: string;
  name: string;
  status: DistrictLotStatus;
  icon: "media" | "contractor" | "trucking" | "nursing" | "equipment" | "government";
  lead: string;
  audience: string;
  roles?: [string, string];
}[] = [
  {
    id: "media-technology",
    name: "Media & Technology",
    status: "live",
    icon: "media",
    lead: "Editors, developers, studios, and the buyers who need them — matched in real time.",
    audience: "Media & technology professionals, studios, and the buyers who hire them.",
    roles: ["I'm available for work", "I'm hiring"],
  },
  {
    id: "construction",
    name: "The Contractor Exchange",
    status: "live",
    icon: "contractor",
    lead: "Skilled trades, construction, and the homeowners and businesses who hire them.",
    audience: "General contractors, skilled trades, crews, homeowners, and businesses.",
    roles: ["I'm available for work", "I'm hiring"],
  },
  {
    id: "trucking",
    name: "Trucking Exchange",
    status: "live",
    icon: "trucking",
    lead: "Drivers, carriers, dispatchers, and the freight that needs moving — matched by equipment and lane.",
    audience: "Drivers, owner operators, carriers, dispatchers, and shippers.",
    roles: ["I'm available to drive", "I need a driver"],
  },
  {
    id: "nursing-healthcare",
    name: "Nursing / Healthcare",
    status: "soon",
    icon: "nursing",
    lead: "Clinical staffing and healthcare talent — coming to THE CITY OF VAEL.",
    audience: "Nurses, clinicians, and the healthcare facilities that need them.",
  },
  {
    id: "equipment",
    name: "Equipment",
    status: "early",
    icon: "equipment",
    lead: "Heavy equipment, rentals, and operators — early access planning underway.",
    audience: "Equipment operators, rental yards, and job sites needing gear.",
  },
  {
    id: "government",
    name: "Government",
    status: "early",
    icon: "government",
    lead: "Public-sector contracting and staffing — early access planning underway.",
    audience: "Public-sector agencies and the contractors who serve them.",
  },
];

function DistrictMark({ icon }: { icon: (typeof WEBSITE_DISTRICT_CARDS)[number]["icon"] }) {
  const svg = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
    "aria-hidden": true,
  };
  if (icon === "media") {
    return (
      <svg {...svg}>
        <rect x="4" y="7.2" width="16" height="12.4" rx="2" />
        <path d="M8 7.2 6.4 4.2M12 7.2V4.2M16 7.2l1.6-3" />
        <path d="M10 11.4v3.8l3.6-1.9-3.6-1.9z" />
      </svg>
    );
  }
  if (icon === "contractor") {
    return (
      <svg {...svg}>
        <path d="M6 14.2c0-5.6 2.5-9.6 6-9.6s6 4 6 9.6" />
        <path d="M3.6 14.2h16.8" />
        <path d="M6.8 14.2v3.2c0 1.4 1 2.4 2.2 2.4h6c1.2 0 2.2-1 2.2-2.4v-3.2" />
      </svg>
    );
  }
  if (icon === "trucking") {
    return (
      <svg {...svg}>
        <path d="M3.5 6h10.2v11.4H3.5z" />
        <path d="M13.7 9.2h3.2L20.4 13v4.4h-6.7V9.2z" />
        <circle cx="7" cy="19.2" r="1.5" />
        <circle cx="16.6" cy="19.2" r="1.5" />
      </svg>
    );
  }
  if (icon === "nursing") {
    return (
      <svg {...svg}>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    );
  }
  if (icon === "equipment") {
    return (
      <svg {...svg}>
        <path d="M15.4 4.6a4.2 4.2 0 0 1-5.4 5.6L4.6 15.6 8.4 19.4l5.4-5.4a4.2 4.2 0 0 1 5.6-5.4l-2.8 2.8-2.6-2.6 2.8-2.8z" />
      </svg>
    );
  }
  return (
    <svg {...svg}>
      <path d="M4 19.6h16" />
      <path d="M6.2 19.6V10.6M9.6 19.6V10.6M14.4 19.6V10.6M17.8 19.6V10.6" />
      <path d="M4 10.6h16" />
      <path d="M12 4.4 20 10.6H4L12 4.4z" />
    </svg>
  );
}

function DistrictState({ status }: { status: DistrictLotStatus }) {
  if (status === "live") return <Badge tone="live" className="shrink-0 whitespace-nowrap">Live</Badge>;
  if (status === "soon") return <Badge tone="outline" className="shrink-0 whitespace-nowrap">Coming soon</Badge>;
  return <Badge tone="early" className="shrink-0 whitespace-nowrap">Early access</Badge>;
}

function WebsiteDistrictCard({ card }: { card: (typeof WEBSITE_DISTRICT_CARDS)[number] }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
            <DistrictMark icon={card.icon} />
          </span>
          <h2 className="flex min-h-[2.6rem] max-w-[11rem] items-center text-body font-semibold leading-tight text-foreground">
            {card.name}
          </h2>
        </div>
        <DistrictState status={card.status} />
      </div>
      <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-body-sm leading-6 text-muted">{card.lead}</p>
      <p className="mt-3 line-clamp-2 min-h-[3rem] text-body-sm leading-6 text-foreground/70">{card.audience}</p>
      <div className="mt-4 flex min-h-[4.25rem] flex-wrap content-start gap-2">
        {card.roles?.map((role) => (
          <span key={role} className="rounded-full border border-border px-3 py-1 text-caption text-muted">
            {role}
          </span>
        ))}
      </div>
      <p className="mt-5 min-h-[1.25rem] text-body-sm font-medium text-accent">
        {card.status === "live" ? (
          <>
            Enter the district <span aria-hidden>→</span>
          </>
        ) : null}
      </p>
    </>
  );

  const className =
    "flex h-full flex-col rounded-2xl border border-border bg-surface p-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]";

  if (card.status !== "live") {
    return <article className={className}>{body}</article>;
  }

  return (
    <Link to="/sign-in" className={`${className} hover:border-accent/40`}>
      {body}
    </Link>
  );
}

function DistrictsBrowsePage() {
  return (
    <CityPage>
      <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
        Districts
      </h1>
      <p className="mt-1 max-w-xl text-body-sm text-muted">
        Live districts are open. The rest are still being planned.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WEBSITE_DISTRICT_CARDS.map((card) => (
          <WebsiteDistrictCard key={card.id} card={card} />
        ))}
      </div>
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
        This lot is not a working exchange. There is no Board, Vael form, or Handshake for {district.name} in this
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