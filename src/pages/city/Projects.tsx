import { useState } from "react";
import { Link } from "react-router-dom";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/overlays";
import { IconCalendar, IconClock, IconLock, IconMapPin } from "@/components/ui/icons";
import { useCitySession } from "@/lib/citySession";
import { cn } from "@/lib/cn";
import { MARKETING_PROJECTS, type MarketingProject, type MarketingProjectIcon } from "@/lib/marketingProjects";

const DISTRICT_NAME = "Contractor Exchange";

const CARD =
  "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]";

function CategoryGlyph({ icon }: { icon: MarketingProjectIcon }) {
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

function FactLine({ icon, label }: { icon: "pin" | "time"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-body-sm text-muted">
      {icon === "pin" ? <IconMapPin className="h-4 w-4 shrink-0" /> : <IconCalendar className="h-4 w-4 shrink-0" />}
      {label}
    </span>
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
  lockedNote: string;
  lockedAction: { label: string; to: string };
  action: { label: string; onClick?: () => void; to?: string };
  /** Replaces the Live badge, for example "Interested" or "Handshake open". */
  badge?: { label: string; tone?: "live" | "soon" | "default" };
};

/** One opportunity as a card. Locked cards blur the photo and hide the description. */
export function OpportunityCardView(props: OpportunityCardProps) {
  const { category, icon, meta, description, city, timing, budget, daysLeft, image, photoCount, locked, lockedNote, lockedAction, action, badge } = props;
  const members = photoCount && photoCount > 0 ? `${photoCount} photo${photoCount === 1 ? "" : "s"} · members only` : "Members only";
  const linkClass = "inline-flex shrink-0 items-center gap-1.5 text-body-sm font-semibold leading-none text-accent hover:underline";
  return (
    <article className={CARD}>
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-surface-muted">
        {image ? (
          <img src={image} alt="" className={cn("h-full w-full object-cover", locked && "scale-110 opacity-60 blur-xl")} />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 via-transparent to-accent/5 text-accent/40">
            <span className="scale-[3]">
              <CategoryGlyph icon={icon} />
            </span>
          </span>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-caption font-medium leading-none text-white backdrop-blur-sm">
          <IconClock className="h-3.5 w-3.5 shrink-0" />
          {daysLeft} {daysLeft === 1 ? "day" : "days"} left
        </span>
        {locked ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-caption font-medium leading-none text-white backdrop-blur-sm">
            <IconLock className="h-3.5 w-3.5" />
            {members}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-body-lg font-semibold leading-snug text-foreground">
              <span className="text-accent">
                <CategoryGlyph icon={icon} />
              </span>
              {category}
            </h2>
            <p className="mt-1 text-caption leading-snug text-muted">{meta}</p>
          </div>
          <Badge tone={badge?.tone ?? "live"} className="shrink-0">
            {badge?.label ?? "Live"}
          </Badge>
        </div>
        {locked ? (
          <p className="flex items-center gap-2 text-body-sm leading-6 text-muted">
            <IconLock className="h-3.5 w-3.5 shrink-0" />
            {lockedNote}
          </p>
        ) : (
          <p className="line-clamp-2 text-body-sm leading-6 text-foreground/80">{description}</p>
        )}
        {city || timing ? (
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {city ? <FactLine icon="pin" label={city} /> : null}
            {timing ? <FactLine icon="time" label={timing} /> : null}
          </div>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border-subtle pt-4">
          <div className="min-w-0">
            {budget ? (
              <>
                <p className="text-caption leading-none text-muted">Budget</p>
                <p className="mt-1.5 text-body font-semibold leading-none text-foreground">{budget}</p>
              </>
            ) : null}
          </div>
          {locked ? (
            <Link to={lockedAction.to} className={linkClass}>
              <IconLock className="h-3.5 w-3.5" />
              {lockedAction.label}
            </Link>
          ) : action.to ? (
            <Link to={action.to} className={linkClass}>
              {action.label} <span aria-hidden>→</span>
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={linkClass}>
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
  lockedAction = { label: "Join to view", to: JOIN_ROUTE },
}: {
  project: MarketingProject;
  locked: boolean;
  onDetails: () => void;
  lockedAction?: { label: string; to: string };
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
      action={{ label: "Show details", onClick: onDetails }}
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

const ALL_DISTRICTS = "All districts";
const PILL = "inline-flex items-center rounded-full border px-5 py-2.5 text-body-sm font-medium motion-safe:transition-colors";

export function WebsiteProjectsPage() {
  const { session } = useCitySession();
  const locked = !session.signedIn;
  const [openId, setOpenId] = useState<string | null>(null);
  const [district, setDistrict] = useState<string>(ALL_DISTRICTS);
  const open = MARKETING_PROJECTS.find((project) => project.id === openId);
  // Every opportunity today is posted into Contractor Exchange, so both views list the same cards.
  const shown = MARKETING_PROJECTS;

  return (
    <>
    <p
      role="status"
      className="flex min-h-9 items-center justify-center gap-2.5 border-b border-success/25 bg-success/10 px-4 py-2 text-center text-body-sm font-medium text-success"
    >
      <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-success" />
      {shown.length} {shown.length === 1 ? "opportunity is" : "opportunities are"} live in {DISTRICT_NAME}
    </p>
    <CityPage width="wide" className="pb-8 pt-3 md:pb-10 md:pt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-foreground">
            Opportunities
          </h1>
          <p className="mt-1.5 max-w-xl text-body text-muted">Live opportunities from across THE CITY OF VAEL.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3" role="group" aria-label="Filter opportunities">
        {[ALL_DISTRICTS, DISTRICT_NAME].map((name) => {
          const active = name === district;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={active}
              onClick={() => setDistrict(name)}
              className={cn(
                PILL,
                active ? "border-accent/60 bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground",
              )}
            >
              {name}
            </button>
          );
        })}
      </div>

      {locked ? (
        <div className="mt-5 rounded-2xl border border-accent/30 bg-accent/10 p-5 sm:p-6">
          <p className="flex items-start gap-3 text-body text-foreground">
            <IconLock className="mt-1 h-4 w-4 shrink-0 text-accent" />
            These opportunities are locked. Create a free account or sign in to get access, then make your profile to see the full projects.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <Link
              to={`${JOIN_ROUTE}?from=opportunities`}
              className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-button font-semibold text-primary-foreground motion-safe:transition-opacity hover:opacity-90"
            >
              Create a free account
            </Link>
            <Link to="/sign-in?next=/opportunities" className="text-body font-medium text-accent">
              I have an account
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((project) => (
          <ProjectCard key={project.id} project={project} locked={locked} onDetails={() => setOpenId(project.id)} />
        ))}
      </div>
      <ProjectDetailsDialog project={open} onClose={() => setOpenId(null)} />
    </CityPage>
    </>
  );
}
