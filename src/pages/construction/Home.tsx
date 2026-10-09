import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { EmptyState } from "@/components/ui/feedback";
import { IconChevronLeft } from "@/components/ui/icons";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVael } from "@/lib/vaelCore";
import { CONTRACTOR_OPPS_PATH, PROJECTS_PATH } from "@/lib/cxRoutes";
import { getOnboardingDraft } from "@/lib/onboarding";
import { visibilityKindFromListing } from "@/lib/visibilityPlans";

const BASE = "/districts/contractor";

type ContractorCategory = "residential" | "commercial";

/**
 * Residential uses the same opportunity split as the dashboards: Vael Out
 * creates opportunities, Vael In reviews the ones Vael Out posted. Commercial
 * stays here until it has its own entry.
 */
export function ConstructionHomePage({ category = "residential" }: { category?: ContractorCategory }) {
  const navigate = useNavigate();
  const { latestListing, handle, signedIn } = useVael();
  const kind = visibilityKindFromListing(latestListing);
  const vaeledIn = (kind === "in" || kind === "expiring") && latestListing?.side !== "out";
  const vaeledOut = kind === "out" || ((kind === "in" || kind === "expiring") && latestListing?.side === "out");
  const intent = signedIn ? (getOnboardingDraft(handle)?.intent ?? "") : "";
  const vaelOut = vaeledOut || (intent === "out" && !vaeledIn);

  if (category === "residential") {
    return (
      <DashboardShell>
        <Link
          to="/media-technology/districts"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
        >
          <IconChevronLeft className="h-3.5 w-3.5" />
          Back to Districts
        </Link>
        <div>
          <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
            Contractor Exchange
          </h1>
          <p className="mt-1 max-w-xl text-body-sm text-muted">
            Available contractors, and people who need construction work.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={vaelOut ? PROJECTS_PATH : CONTRACTOR_OPPS_PATH} className={buttonClassName()}>
            {vaelOut ? "Your projects" : "Available opportunities"} →
          </Link>
          <Link to="/matches?district=construction" className={buttonClassName({ variant: "outline" })}>
            Matches
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <Link
        to="/media-technology/districts"
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
      >
        <IconChevronLeft className="h-3.5 w-3.5" />
        Back to Districts
      </Link>
      <div>
        <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
          Contractor Exchange
        </h1>
        <p className="mt-1 max-w-xl text-body-sm text-muted">
          Residential is where homeowners ask for work at home, and contractors find the projects that match.
        </p>
      </div>
      <section>
        <Tabs
          value={category}
          onValueChange={(next) => navigate(`${BASE}/${next}`)}
          defaultValue="residential"
          className="gap-0"
        >
          <TabsList aria-label="Contractor Exchange category">
            <TabsTrigger value="residential">Residential</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-4 rounded-2xl border border-border bg-white dark:border-white/10 dark:bg-surface">
          <EmptyState
            title="Commercial opportunities are coming soon"
            description="Businesses will be able to post and manage commercial opportunities here."
          />
        </div>
      </section>
    </DashboardShell>
  );
}

export function ConstructionHowItWorksPage() {
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Contractor Exchange"
        title="How it works"
        description="The VAEL spine with Construction fields. Not Media & Technology’s form."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Contractor Exchange", href: BASE },
          { label: "How it works" },
        ]}
      />
      <ol className="mt-8 space-y-6 text-body-sm">
        <li>
          <p className="vael-kicker">1. Profile</p>
          <p className="mt-1">Trade, service area, credentials, documents. Rates and portfolio stay closed until Handshake.</p>
        </li>
        <li>
          <p className="vael-kicker">2. Vael</p>
          <p className="mt-1">Vael In — I am available for construction work. Vael Out — I need construction capability. 24 hours.</p>
        </li>
        <li>
          <p className="vael-kicker">3. Board</p>
          <p className="mt-1">Percentage fit on Construction criteria. Strong ≥80, Good ≥60, Possible ≥40.</p>
        </li>
        <li>
          <p className="vael-kicker">4. Opportunities</p>
          <p className="mt-1">Homeowner projects appear here. Separate from who is available on the Board.</p>
        </li>
        <li>
          <p className="vael-kicker">5. Handshake</p>
          <p className="mt-1">Same lock as the rest of the City. Both accept, then the private room opens.</p>
        </li>
      </ol>
      <Link to={`${BASE}/vael`} className={buttonClassName({ className: "mt-8" })}>
        Create VAEL
      </Link>
    </CityPage>
  );
}
