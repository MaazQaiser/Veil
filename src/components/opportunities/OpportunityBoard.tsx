import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useJoinedDistricts } from "@/components/mt/DistrictsRow";
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
import { IconLock } from "@/components/ui/icons";
import { OpportunityCardView, ProjectCard, ProjectDetailsDialog } from "@/pages/city/Projects";
import { useCitySession } from "@/lib/citySession";
import { contractorStanding, liveCxProjects, respondentCount, type CxProject } from "@/lib/cxProjectStore";
import { opportunityHref, opportunityStart, projectHref } from "@/lib/cxRoutes";
import { MARKETING_PROJECTS, type MarketingProjectIcon } from "@/lib/marketingProjects";
import { relativeTime } from "@/lib/time";
import { useCxProjects } from "@/lib/useCxProjects";
import { useVael } from "@/lib/vaelCore";

const JOIN_DISTRICT_ROUTE = "/join/contractor-exchange";
const DISTRICT_NAME = "Contractor Exchange";

export const CATEGORY_ICON: Record<string, MarketingProjectIcon> = {
  Kitchen: "kitchen",
  Bathroom: "bathroom",
  Roofing: "roofing",
  "Doors & Windows": "doors",
  Painting: "painting",
  Electrical: "electrical",
  Plumbing: "plumbing",
};

function daysLeftFor(project: CxProject) {
  const ms = Date.parse(project.liveUntil) - Date.now();
  return Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 86400000)) : 0;
}

/** How many live opportunities the cards will show, so a tab can carry the count. */
export function useLiveOpportunityCount(samples: "all" | "fallback") {
  useCxProjects();
  const real = liveCxProjects().length;
  return real + (samples === "all" ? MARKETING_PROJECTS.length : real === 0 ? 2 : 0);
}

/**
 * The live opportunities: title, post button, optional tabs, a previews banner for non-members,
 * then the cards. Pass `children` to replace the cards (for example, your own opportunities).
 */
export function OpportunityBoard({
  title,
  subtitle,
  samples,
  tabs,
  notice,
  showPost = false,
  children,
}: {
  title: string;
  subtitle: string;
  /** "all" always lists the website's sample opportunities; "fallback" only when nobody has posted. */
  samples: "all" | "fallback";
  tabs?: ReactNode;
  /** A short confirmation shown under the tabs. */
  notice?: ReactNode;
  /** Show the Post an Opportunity button. Only your own opportunities need it. */
  showPost?: boolean;
  /** When set, shown instead of the live cards and previews banner. */
  children?: ReactNode;
}) {
  useCxProjects();
  const { session } = useCitySession();
  const { handle, profile, documents } = useVael();
  const mine = handle ? profile(handle) : undefined;
  const joined = useJoinedDistricts(handle, mine, handle ? documents(handle) : []).some((row) => row.district.id === "construction");
  const [openId, setOpenId] = useState<string | null>(null);

  const real = liveCxProjects().sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const sampleList = samples === "all" ? MARKETING_PROJECTS : real.length === 0 ? MARKETING_PROJECTS.slice(0, 2) : [];
  const filters = useOpportunityFilters();
  const locations = sortLocations([...real.map((item) => item.city), ...sampleList.map((item) => item.city)]);
  const budgets = budgetOptions([...real.map((item) => item.budgetBand), ...sampleList.map((item) => item.budget)]);
  const counts = {
    districts: countBy([...real, ...sampleList].map(() => OPPORTUNITY_DISTRICT)),
    locations: countBy([...real.map((item) => item.city), ...sampleList.map((item) => item.city)]),
    budgets: countBy([...real.map((item) => item.budgetBand), ...sampleList.map((item) => item.budget)]),
    availability: countBy([...real.map((item) => availabilityOf(item.timing)), ...sampleList.map((item) => availabilityOf(item.timing))]),
  };
  const shownReal = real.filter((item) =>
    matchesFilters(filters, { district: OPPORTUNITY_DISTRICT, city: item.city, budget: item.budgetBand, timing: item.timing, text: [item.category, item.firstName, item.city, item.description] }),
  );
  const shownSamples = sampleList.filter((item) =>
    matchesFilters(filters, { district: OPPORTUNITY_DISTRICT, city: item.city, budget: item.budget, timing: item.timing, text: [item.category, item.name, item.city, item.description] }),
  );
  const total = shownReal.length + shownSamples.length;
  const start = opportunityStart("create");
  const open = MARKETING_PROJECTS.find((item) => item.id === openId);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 max-w-xl text-body-sm text-muted">{subtitle}</p>
        </div>
        {showPost ? (
          <Link
            to={start.to}
            state={start.state}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-button font-semibold text-primary-foreground motion-safe:transition-opacity hover:opacity-90"
          >
            <span aria-hidden className="text-lg leading-none">+</span>
            Post an Opportunity
          </Link>
        ) : null}
      </div>

      {tabs}

      {notice}

      {children ? (
        children
      ) : (
        <>
          {joined ? null : (
            <div className="flex flex-col gap-4 rounded-2xl border border-accent/30 bg-accent/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <IconLock className="mt-1 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <p className="text-body font-semibold text-foreground">Make your profile to see the full opportunities.</p>
                  <p className="mt-0.5 text-body-sm text-muted">
                    You only see previews until your profile is done. After that you can read the details and show interest.
                  </p>
                </div>
              </div>
              <Link
                to={JOIN_DISTRICT_ROUTE}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-primary px-6 text-button font-semibold text-primary-foreground motion-safe:transition-opacity hover:opacity-90"
              >
                Make my profile
              </Link>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start xl:gap-8">
            <OpportunityFilterPanel filters={filters} districts={DISTRICT_OPTIONS} locations={locations} budgets={budgets} counts={counts} />
            <div className="min-w-0">
              <p className="mb-4 text-body-sm text-muted" aria-live="polite">
                {total} {total === 1 ? "opportunity" : "opportunities"}
              </p>
          {total === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-body-sm text-muted">
              {filters.active > 0 ? "No opportunities match these filters." : "No live opportunities right now. New ones will show up here."}
            </p>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(21rem,1fr))] gap-4">
              {shownReal.map((item) => {
                const own = item.handle === session.handle;
                const standing = own ? "open" : contractorStanding(item.id, session.handle);
                const responses = own ? respondentCount(item.id) : 0;
                return (
                <li key={item.id}>
                  <OpportunityCardView
                    category={item.category || "Project"}
                    icon={CATEGORY_ICON[item.category] ?? "construction"}
                    meta={`${item.firstName ? `${item.firstName} · ` : ""}Posted ${relativeTime(item.publishedAt) || "today"}`}
                    description={item.description}
                    city={item.city}
                    timing={item.timing}
                    budget={item.budgetBand}
                    daysLeft={daysLeftFor(item)}
                    image={item.photos[0]}
                    photoCount={item.photos.length}
                    locked={!joined && item.handle !== session.handle}
                    lockedNote={`The description is for members of ${DISTRICT_NAME}`}
                    lockedAction={{ label: "Unlock details", to: JOIN_DISTRICT_ROUTE }}
                    action={
                      own
                        ? { label: "Manage opportunity", to: projectHref(item.id) }
                        : { label: "View opportunity", to: opportunityHref(item.id) }
                    }
                    badge={
                      own
                        ? { label: responses > 0 ? `${responses} interested` : "Yours", tone: responses > 0 ? "soon" : "default" }
                        : standing === "connected"
                          ? { label: "Handshake open", tone: "soon" }
                          : standing === "interested"
                            ? { label: "Interested", tone: "soon" }
                            : undefined
                    }
                  />
                </li>
                );
              })}
              {shownSamples.map((project) => (
                <li key={project.id}>
                  <ProjectCard
                    project={project}
                    locked={!joined}
                    onDetails={() => setOpenId(project.id)}
                    lockedAction={{ label: "Unlock details", to: JOIN_DISTRICT_ROUTE }}
                  />
                </li>
              ))}
            </ul>
          )}
            </div>
          </div>
          <ProjectDetailsDialog project={open} onClose={() => setOpenId(null)} />
        </>
      )}
    </>
  );
}
