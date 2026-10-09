import { useState } from "react";
import { CityPage } from "@/components/city/CityShell";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/overlays";
import { IconCalendar, IconClock, IconMapPin, IconWallet } from "@/components/ui/icons";
import { MARKETING_PROJECTS, type MarketingProject, type MarketingProjectIcon } from "@/lib/marketingProjects";

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

function Fact({ icon, label }: { icon: "pin" | "time" | "budget"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-caption leading-none text-muted">
      {icon === "pin" ? <IconMapPin className="h-3.5 w-3.5 shrink-0 text-muted" /> : null}
      {icon === "time" ? <IconCalendar className="h-3.5 w-3.5 shrink-0 text-muted" /> : null}
      {icon === "budget" ? <IconWallet className="h-3.5 w-3.5 shrink-0 text-muted" /> : null}
      {label}
    </span>
  );
}

function ProjectCard({ project, onDetails }: { project: MarketingProject; onDetails: () => void }) {
  return (
    <article className={CARD}>
      <img src={project.image} alt="" className="h-48 w-full shrink-0 object-cover" />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
              <CategoryGlyph icon={project.icon} />
            </span>
            <div className="min-w-0">
              <h2 className="text-body font-semibold leading-snug text-foreground">{project.category}</h2>
              <p className="mt-0.5 text-caption leading-snug text-muted">
                {project.name} · {project.posted}
              </p>
            </div>
          </div>
          <Badge tone="live" className="shrink-0">
            Live
          </Badge>
        </div>
        <p className="line-clamp-3 min-h-[4.5rem] text-body-sm leading-6 text-foreground">{project.description}</p>
        <div className="flex flex-wrap gap-2">
          <Fact icon="pin" label={project.city} />
          <Fact icon="time" label={project.timing} />
          <Fact icon="budget" label={project.budget} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
          <p className="inline-flex items-center gap-1.5 text-caption leading-none text-muted">
            <IconClock className="h-3.5 w-3.5 shrink-0" />
            {project.daysLeft} {project.daysLeft === 1 ? "day" : "days"} left
          </p>
          <button type="button" onClick={onDetails} className="shrink-0 text-body-sm font-medium leading-none text-accent">
            Show details <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function WebsiteProjectsPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = MARKETING_PROJECTS.find((project) => project.id === openId);

  return (
    <CityPage width="wide">
      <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
        Live projects
      </h1>
      <p className="mt-1 max-w-xl text-body-sm text-muted">
        What homeowners in THE CITY OF VAEL need done right now.
      </p>
      <p className="mt-8 text-caption font-semibold uppercase tracking-[0.14em] text-muted">
        {MARKETING_PROJECTS.length} live projects
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MARKETING_PROJECTS.map((project) => (
          <ProjectCard key={project.id} project={project} onDetails={() => setOpenId(project.id)} />
        ))}
      </div>
      <Dialog open={Boolean(open)} onClose={() => setOpenId(null)} title={open?.category ?? "Project"}>
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
    </CityPage>
  );
}
