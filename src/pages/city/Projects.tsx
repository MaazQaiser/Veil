import { useState } from "react";
import { Link } from "react-router-dom";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import { Badge } from "@/components/ui/badge";
import {
  DISTRICT_OPTIONS,
  availabilityOf,
  OPPORTUNITY_DISTRICT,
  OpportunityFilterPanel,
  budgetOptions,
  countBy,
  matchesFilters,
  sortLocations,
  useOpportunityFilters,
} from "@/components/opportunities/OpportunityFilters";
import { Container } from "@/components/ui/layout";
import { Dialog } from "@/components/ui/overlays";
import { IconClock, IconLock } from "@/components/ui/icons";
import { useCitySession } from "@/lib/citySession";
import { cn } from "@/lib/cn";
import { MARKETING_PROJECTS, type MarketingProject, type MarketingProjectIcon } from "@/lib/marketingProjects";
import { stockPhoto } from "@/lib/stockPhotos";

const DISTRICT_NAME = "Contractor Exchange";

const CARD =
  "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]";

export function CategoryGlyph({ icon }: { icon: MarketingProjectIcon }) {
  const svg = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5 shrink-0",
    "aria-hidden": true,
  };
  if (icon === "plumbing") {
    return (
      <svg {...svg}>
        <path d="M7.4 4v3.2" />
        <path d="M5.4 4h4" />
        <path d="M4 7.4h11.4a2.8 2.8 0 0 1 2.8 2.8V13" />
        <path d="M4 13h6.6" />
        <path d="M7.3 13v6.6" />
        <path d="M16.4 13.4c1.2 1.6 2.1 2.4 3.4 2.4" />
      </svg>
    );
  }
  if (icon === "construction") {
    return (
      <svg {...svg}>
        <path d="M13.4 4.4 19.6 10.6l-2.2 2.2-6.2-6.2 2.2-2.2z" />
        <path d="M10.2 7.6 4.4 18.4" />
        <path d="M3.8 19.8h4.4" />
      </svg>
    );
  }
  if (icon === "doors") {
    return (
      <svg {...svg}>
        <path d="M4.5 4h15v16.2h-15z" />
        <path d="M12 4v16.2" />
        <path d="M9.2 12.2h.1M14.8 12.2h.1" />
      </svg>
    );
  }
  if (icon === "roofing") {
    return (
      <svg {...svg}>
        <path d="M3.8 11.4 12 4.4 20.2 11.4" />
        <path d="M6.4 10.4V19.6h11.2V10.4" />
      </svg>
    );
  }
  if (icon === "bathroom") {
    return (
      <svg {...svg}>
        <path d="M15.2 4.2v2.6" />
        <path d="M12.6 6.8h5.2" />
        <path d="M4.2 10.2h15.6" />
        <path d="M7.4 10.2V8" />
        <path d="M4.2 10.2v4.4a4.6 4.6 0 0 0 4.6 4.6h6.4a4.6 4.6 0 0 0 4.6-4.6v-4.4" />
      </svg>
    );
  }
  if (icon === "kitchen") {
    return (
      <svg {...svg}>
        <path d="M5 11.4h14v5.2a3.2 3.2 0 0 1-3.2 3.2H8.2A3.2 3.2 0 0 1 5 16.6v-5.2z" />
        <path d="M3 11.4h18" />
        <path d="M9.2 7.6c0-1.3 1-1.7 1-3M13.6 7.6c0-1.3 1-1.7 1-3" />
      </svg>
    );
  }
  if (icon === "electrical") {
    return (
      <svg {...svg}>
        <path d="M14.2 4 4.6 13h6.6L9.6 20l10-9.4h-6.6L14.2 4z" />
      </svg>
    );
  }
  return (
    <svg {...svg}>
      <path d="M4.2 4.2h11.2a1.4 1.4 0 0 1 1.4 1.4v2.4H4.2V4.2z" />
      <path d="M15.4 6.6h4.2" />
      <path d="M17.6 6.6V19.8" />
    </svg>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption leading-none text-muted">{label}</dt>
      <dd className="mt-1.5 text-body-sm font-medium leading-snug text-foreground">{value}</dd>
    </div>
  );
}

export type OpportunityCardProps = {
  category: string;
  icon: MarketingProjectIcon;
  meta: string;
  description: string;
  city: string;
  timing: string;
  budget: string;
  daysLeft: number;
  image?: string;
  photoCount?: number;
  locked: boolean;
  lockedNote?: string;
  lockedAction?: { label: string; to: string };
  action: { label: string; onClick?: () => void; to?: string };
  /** Replaces the Live badge, for example "Interested" or "Handshake open". */
  badge?: { label: string; tone?: "live" | "soon" | "default" };
};

/** One opportunity as a card. Locked cards blur the photo and hide the description; without a photo they show a placeholder. */
export function OpportunityCardView(props: OpportunityCardProps) {
  const { category, icon, meta, description, city, timing, budget, daysLeft, image, photoCount, locked, lockedNote, lockedAction, action, badge } = props;
  const [broken, setBroken] = useState(false);
  const stock = image ? undefined : stockPhoto(category);
  const photo = image ?? stock?.src;
  const soft = Boolean(stock) && !stock?.exact;
  const showPhoto = Boolean(photo) && !broken;
  const members = photoCount && photoCount > 0 ? `${photoCount} photo${photoCount === 1 ? "" : "s"} · members only` : "Members only";
  const button =
    "inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-full border border-accent/40 px-5 text-body-sm font-semibold leading-none text-accent motion-safe:transition-colors hover:bg-accent/10";
  return (
    <article className={cn(CARD, "group")}>
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-surface-muted">
        {showPhoto ? (
          <img
            src={photo}
            alt=""
            onError={() => setBroken(true)}
            className={cn(
              "h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500",
              locked ? "scale-110 blur-md" : soft ? "scale-110 blur-[5px]" : "group-hover:scale-105",
            )}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/20 via-accent/[0.06] to-transparent text-accent"
            style={{ backgroundImage: "radial-gradient(rgba(238,138,74,0.16) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-background/60 backdrop-blur-sm">
              <span className="scale-150">
                <CategoryGlyph icon={icon} />
              </span>
            </span>
          </div>
        )}
        {showPhoto ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-0",
              locked ? "bg-black/30" : "inset-x-0 top-auto h-16 bg-gradient-to-t from-black/50 to-transparent",
            )}
          />
        ) : null}
        {daysLeft > 0 ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-caption font-medium leading-none text-white backdrop-blur-sm">
            <IconClock className="h-3.5 w-3.5 shrink-0" />
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left
          </span>
        ) : null}
        {locked ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-caption font-medium leading-none text-white backdrop-blur-sm">
            <IconLock className="h-3.5 w-3.5" />
            {members}
          </span>
        ) : stock && showPhoto ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-black/60 px-2.5 py-1 text-caption font-medium leading-none text-white/80 backdrop-blur-sm">
            Sample photo
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <CategoryGlyph icon={icon} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-body-lg font-semibold leading-snug text-foreground">{category}</h2>
            <p className="mt-0.5 truncate text-caption leading-snug text-muted">{meta}</p>
          </div>
          <Badge tone={badge?.tone ?? "live"} className="shrink-0">
            {badge?.label ?? "Live"}
          </Badge>
        </div>
        {locked ? (
          <div className="space-y-2.5 py-1" aria-label={lockedNote}>
            <span className="block h-2.5 w-full rounded-full bg-foreground/10" />
            <span className="block h-2.5 w-4/5 rounded-full bg-foreground/10" />
            <p className="sr-only">{lockedNote}</p>
          </div>
        ) : (
          <p className="line-clamp-2 text-body-sm leading-6 text-foreground/80">{description}</p>
        )}
        {city || timing || budget ? (
          <dl className="grid grid-cols-[1fr_1fr_1.25fr] gap-x-3 border-t border-border-subtle pt-4">
            {city ? <Fact label="Location" value={city} /> : <span />}
            {timing ? <Fact label="Starts" value={timing} /> : <span />}
            {budget ? <Fact label="Budget" value={budget} /> : <span />}
          </dl>
        ) : null}
        <div className="mt-auto">
          {locked && lockedAction ? (
            <Link to={lockedAction.to} className={button}>
              <IconLock className="h-3.5 w-3.5" />
              {lockedAction.label}
            </Link>
          ) : action.to ? (
            <Link to={action.to} className={button}>
              {action.label} <span aria-hidden>→</span>
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={button}>
              {action.label} <span aria-hidden>→</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProjectCard({
  project,
  locked,
  onDetails,
  lockedAction = { label: "Join to view", to: `${JOIN_ROUTE}?from=opportunities` },
  viewTo,
}: {
  project: MarketingProject;
  locked: boolean;
  onDetails: () => void;
  lockedAction?: { label: string; to: string };
  /** When set, the button opens this page instead of the details dialog. */
  viewTo?: string;
}) {
  return (
    <OpportunityCardView
      category={project.category}
      icon={project.icon}
      meta={`${project.name} · ${project.posted}`}
      description={project.description}
      city={project.city}
      timing={project.timing}
      budget={project.budget}
      daysLeft={project.daysLeft}
      image={project.image}
      locked={locked}
      lockedNote="Description is for members only"
      lockedAction={lockedAction}
      action={viewTo ? { label: "View opportunity", to: viewTo } : { label: "Show details", onClick: onDetails }}
    />
  );
}

export function ProjectDetailsDialog({ project: open, onClose }: { project?: MarketingProject; onClose: () => void }) {
  return (
    <Dialog open={Boolean(open)} onClose={onClose} title={open?.category ?? "Opportunity"}>
      {open ? (
        <div className="space-y-4">
          <img src={open.image} alt="" className="h-44 w-full rounded-xl object-cover" />
          <p className="text-body-sm text-muted">
            {open.name} · {open.posted}
          </p>
          <p className="text-body text-foreground">{open.description}</p>
          <dl className="grid gap-3 text-body-sm">
            <div>
              <dt className="text-muted">Location</dt>
              <dd className="text-foreground">{open.city}</dd>
            </div>
            <div>
              <dt className="text-muted">Timing</dt>
              <dd className="text-foreground">{open.timing}</dd>
            </div>
            <div>
              <dt className="text-muted">Budget</dt>
              <dd className="text-foreground">{open.budget}</dd>
            </div>
            <div>
              <dt className="text-muted">Time left</dt>
              <dd className="text-foreground">
                {open.daysLeft} {open.daysLeft === 1 ? "day" : "days"} left
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </Dialog>
  );
}

const LOCATIONS = sortLocations(MARKETING_PROJECTS.map((project) => project.city));
const BUDGETS = budgetOptions(MARKETING_PROJECTS.map((project) => project.budget));
const COUNTS = {
  districts: countBy(MARKETING_PROJECTS.map(() => OPPORTUNITY_DISTRICT)),
  locations: countBy(MARKETING_PROJECTS.map((project) => project.city)),
  budgets: countBy(MARKETING_PROJECTS.map((project) => project.budget)),
  availability: countBy(MARKETING_PROJECTS.map((project) => availabilityOf(project.timing))),
};

export function WebsiteProjectsPage() {
  const { session } = useCitySession();
  const locked = !session.signedIn;
  const [openId, setOpenId] = useState<string | null>(null);
  const filters = useOpportunityFilters();
  const open = MARKETING_PROJECTS.find((project) => project.id === openId);
  // Every opportunity today is posted into Contractor Exchange, so both district views list the same cards.
  const shown = MARKETING_PROJECTS.filter((project) =>
    matchesFilters(filters, {
      district: OPPORTUNITY_DISTRICT,
      city: project.city,
      budget: project.budget,
      timing: project.timing,
      text: [project.category, project.name, project.city, project.description],
    }),
  );

  return (
    <>
    <div role="status" className="border-b border-success/25 bg-success/10 py-2 text-body-sm font-medium text-success">
      <Container width="wide" className="flex min-h-5 items-center gap-2.5">
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-success" />
        {MARKETING_PROJECTS.length} {MARKETING_PROJECTS.length === 1 ? "opportunity is" : "opportunities are"} live in {DISTRICT_NAME}
      </Container>
    </div>
    <CityPage width="wide" className="pb-8 pt-3 md:pb-10 md:pt-4">
      <div>
        <h1 className="font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-foreground">Opportunities</h1>
        <p className="mt-1.5 max-w-xl text-body text-muted">Live opportunities from across THE CITY OF VAEL.</p>
      </div>

      {locked ? (
        <div className="mt-5 flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="flex items-center gap-2.5 text-body-sm text-foreground">
            <IconLock className="h-4 w-4 shrink-0 text-accent" />
            These opportunities are locked. Create an account, then make your profile to see the full opportunities.
          </p>
          <div className="flex shrink-0 items-center gap-5 pl-6 text-body-sm sm:pl-0">
            <Link to={`${JOIN_ROUTE}?from=opportunities`} className="font-semibold text-accent underline-offset-4 hover:underline">
              Create an account
            </Link>
            <Link to="/sign-in?next=/opportunities" className="font-medium text-muted underline-offset-4 hover:text-foreground hover:underline">
              I have an account
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start xl:gap-8">
        <OpportunityFilterPanel filters={filters} districts={DISTRICT_OPTIONS} locations={LOCATIONS} budgets={BUDGETS} counts={COUNTS} />
        <div className="min-w-0">
          <p className="mb-4 text-body-sm text-muted" aria-live="polite">
            {shown.length} {shown.length === 1 ? "opportunity" : "opportunities"}
          </p>
          {shown.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-body-sm text-muted">
              {filters.query.trim() ? `No opportunities match "${filters.query.trim()}".` : "No opportunities match these filters."}
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(21rem,1fr))]">
              {shown.map((project) => (
                <ProjectCard key={project.id} project={project} locked={locked} onDetails={() => setOpenId(project.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
      <ProjectDetailsDialog project={open} onClose={() => setOpenId(null)} />
    </CityPage>
    </>
  );
}
