import { useState, type ComponentType, type SVGProps } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState } from "@/components/ui/feedback";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import { MarketingHome } from "@/pages/city/Marketing";
import { useCitySession } from "@/lib/citySession";
import { cn } from "@/lib/cn";
import { IconBriefcase, IconSearch, IconUser } from "@/components/ui/icons";
import { CONTRACTOR_OPPS_PATH, NEED_PATH } from "@/lib/cxRoutes";
import { routeForGoVisibleEntry, type GoVisibleEntry } from "@/lib/goVisible";

export function HomePage() {
  return <MarketingHome />;
}

export function SearchPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <CityPage>
      <PageHeader
        kicker="City"
        title="Search"
        description="Find people, listings, and districts. Search does not call a live index in this shell, and Community posts are not searched here."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Search" },
        ]}
      />
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        <label htmlFor="city-search" className="vael-kicker">
          Query
        </label>
        <input
          id="city-search"
          name="q"
          type="search"
          className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-2 text-caption text-muted">Submit stays on this page. No invented results.</p>
        <Button type="submit" className="mt-4" variant="outline">
          Search this City
        </Button>
      </form>
      {submitted ? (
        <div className="mt-8">
          <EmptyState
            title="No search index in this shell"
            description="Results will appear when a live search index exists. Nothing is invented here."
            action={
              <Link to="/districts" className={buttonClassName({ variant: "outline" })}>
                View districts
              </Link>
            }
          />
        </div>
      ) : null}
    </CityPage>
  );
}

const GO_VISIBLE_OPTIONS: {
  id: GoVisibleEntry;
  label: string;
  title: string;
  body: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  {
    id: "in",
    label: "VAEL IN",
    title: "I'm available for work.",
    body: "I offer my skills, services, or availability to be matched.",
    icon: IconUser,
  },
  {
    id: "out",
    label: "VAEL OUT",
    title: "I'm looking for someone.",
    body: "I need someone available for a role or opportunity.",
    icon: IconBriefcase,
  },
  {
    id: "opportunities",
    label: "Opportunities",
    title: "Find opportunities.",
    body: "Post work that needs doing, or take on work that's already posted.",
    icon: IconSearch,
  },
];

const OPPORTUNITY_OPTIONS: {
  id: "create" | "avail";
  label: string;
  title: string;
  body: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  {
    id: "create",
    label: "Create",
    title: "Create an opportunity.",
    body: "Post work for your home or your business.",
    icon: IconBriefcase,
  },
  {
    id: "avail",
    label: "Avail",
    title: "Avail an opportunity.",
    body: "See work you can take on.",
    icon: IconSearch,
  },
];

function EntryCard({
  label,
  title,
  body,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string;
  title: string;
  body: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex h-full w-full flex-col items-start rounded-lg border bg-transparent px-6 py-6 text-left",
        "motion-safe:transition-all motion-safe:duration-200",
        "hover:-translate-y-1 hover:border-[#DE7C40] hover:bg-[#DE7C40]/[0.08] hover:shadow-[0_16px_40px_rgba(222,124,64,0.12)]",
        selected ? "border-[#DE7C40] bg-[#DE7C40]/[0.08]" : "border-white/20",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border text-[#F2BA8B]",
          "motion-safe:transition-colors motion-safe:duration-200",
          "group-hover:border-[#DE7C40] group-hover:bg-[#DE7C40]/15 group-hover:text-[#DE7C40]",
          selected ? "border-[#DE7C40] bg-[#DE7C40]/15 text-[#DE7C40]" : "border-white/20",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-5 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[#F2BA8B]">{label}</span>
      <h2 className="mt-3 text-h4 font-medium text-foreground">{title}</h2>
      <p className="mt-2 text-body-sm leading-relaxed text-muted">{body}</p>
    </button>
  );
}

/** Entry choices. Full screen, same shell as sign-in. Not a popup and not option boxes. */
export function GoVisiblePage() {
  const { session } = useCitySession();
  const navigate = useNavigate();
  const location = useLocation();
  const [choice, setChoice] = useState<GoVisibleEntry | "">("");
  const [opportunityIntent, setOpportunityIntent] = useState<"create" | "avail" | "">("");
  const [onOpportunityStep, setOnOpportunityStep] = useState(
    () => (location.state as { opportunityStep?: boolean } | null)?.opportunityStep === true,
  );

  function onNext() {
    if (onOpportunityStep) {
      if (opportunityIntent === "create") {
        navigate(NEED_PATH, { state: { from: "go-visible" } });
      } else if (opportunityIntent === "avail") {
        navigate(CONTRACTOR_OPPS_PATH);
      }
      return;
    }
    if (!choice) return;
    if (choice === "opportunities") {
      setOnOpportunityStep(true);
      return;
    }
    if (!session.signedIn) {
      navigate(`${JOIN_ROUTE}?entry=${choice}`);
      return;
    }
    navigate(routeForGoVisibleEntry(session.handle, choice));
  }

  return (
    <div
      data-surface="site-dark"
      className="join-flow wizard-flow relative isolate flex flex-1 flex-col overflow-hidden bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-12%] h-[42rem] w-[42rem] rounded-full bg-[#DE7C40]/20 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-15%] right-[6%] h-[30rem] w-[30rem] rounded-full bg-[#DE7C40]/10 blur-[120px]"
      />
      <div className="site-container relative pt-10 md:pt-14">
        <header className="mx-auto max-w-xl text-center">
          <p className="site-eyebrow">Let's get you to the right place</p>
          <h1 className="mt-5 font-sans text-[clamp(1.875rem,3.4vw,2.75rem)] font-medium leading-[1.15] tracking-[-0.025em] text-foreground">
            {onOpportunityStep ? "Create or avail an opportunity?" : "What are you here to do?"}
          </h1>
          {onOpportunityStep ? (
            <div className="mt-3 space-y-1 font-sans text-[1.0625rem] leading-[1.55] text-muted">
              <p>Create one for your home or your business.</p>
              <p>Or avail one that's already posted.</p>
            </div>
          ) : (
            <p className="mt-3 font-sans text-[1.0625rem] leading-[1.55] text-muted">
              This just helps us skip the steps that don't apply to you.
            </p>
          )}
        </header>
      </div>
      <div className="site-container relative flex flex-1 items-center py-10">
        {onOpportunityStep ? (
          <ul className="mx-auto grid w-full max-w-3xl gap-4 md:grid-cols-2 md:gap-5">
            {OPPORTUNITY_OPTIONS.map((option) => (
              <li key={option.id}>
                <EntryCard
                  {...option}
                  selected={opportunityIntent === option.id}
                  onClick={() => setOpportunityIntent(option.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid w-full gap-4 md:grid-cols-3 md:gap-5">
            {GO_VISIBLE_OPTIONS.map((option) => (
              <li key={option.id}>
                <EntryCard {...option} selected={choice === option.id} onClick={() => setChoice(option.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="site-container relative flex items-center justify-between gap-4 pb-8">
        {onOpportunityStep ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-lg px-8"
            onClick={() => {
              setOnOpportunityStep(false);
              setOpportunityIntent("");
            }}
          >
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="button"
          className="rounded-lg px-8"
          disabled={onOpportunityStep ? !opportunityIntent : !choice}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
