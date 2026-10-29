import { useState, type ComponentType, type SVGProps } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/controls";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState } from "@/components/ui/feedback";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import { MarketingHome } from "@/pages/city/Marketing";
import { FindYourWay } from "@/components/marketing/FindYourWay";
import { useCitySession } from "@/lib/citySession";
import { cn } from "@/lib/cn";
import { IconBriefcase, IconCheck, IconSearch, IconUser } from "@/components/ui/icons";
import { CONTRACTOR_OPPS_PATH, NEED_PATH } from "@/lib/cxRoutes";
import { districts } from "@/lib/districts";
import { disciplinesFor, saveGoVisibleInfo } from "@/lib/disciplines";
import { setActiveDistrict } from "@/lib/myDistricts";
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

/** Plain list. Each intent lands in an existing flow via `entry`. No two mean the same thing. */
const GO_VISIBLE_DISTRICTS: { id: string; name: string; status: string; live: boolean }[] = districts.map((district) => ({
  id: district.id,
  name: district.name,
  status: district.status === "live" ? "Live" : district.status === "soon" ? "Coming soon" : "Early access",
  live: district.status === "live",
}));

const GO_VISIBLE_OPTIONS: { id: string; label: string; entry: GoVisibleEntry }[] = [
  { id: "work", label: "I am available for work", entry: "in" },
  { id: "hiring", label: "I am hiring", entry: "out" },
  { id: "project", label: "I have a project or opportunity", entry: "opportunities" },
  { id: "networking", label: "I am open to networking", entry: "in" },
  { id: "equipment-have", label: "I have equipment available", entry: "in" },
  { id: "equipment-need", label: "I need equipment", entry: "out" },
  { id: "freight-seek", label: "I am seeking freight or transportation", entry: "out" },
  { id: "freight-offer", label: "I am available to transport", entry: "in" },
  { id: "funding", label: "I am looking for funding", entry: "out" },
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
        "hover:-translate-y-1 hover:border-[#EE8A4A] hover:bg-[#EE8A4A]/[0.08] hover:shadow-[0_16px_40px_rgba(222,124,64,0.12)]",
        selected ? "border-[#EE8A4A] bg-[#EE8A4A]/[0.08]" : "border-white/20",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border text-[#F2BA8B]",
          "motion-safe:transition-colors motion-safe:duration-200",
          "group-hover:border-[#EE8A4A] group-hover:bg-[#EE8A4A]/15 group-hover:text-[#EE8A4A]",
          selected ? "border-[#EE8A4A] bg-[#EE8A4A]/15 text-[#EE8A4A]" : "border-white/20",
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

/** Dashboards open Go Visible with this state to run the opportunity and district steps directly. */
function isStepsEntry(state: unknown) {
  const entryState = state as { opportunityStep?: boolean; districtStep?: boolean } | null;
  return Boolean(entryState?.opportunityStep || entryState?.districtStep);
}

const GO_VISIBLE_CHOICES: {
  entry: GoVisibleEntry;
  name: string;
  line: string;
  body: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  {
    entry: "in",
    name: "Vael In",
    line: "I'm available for work.",
    body: "Offer your skills, services or availability and get matched with the right people.",
    icon: IconUser,
  },
  {
    entry: "out",
    name: "Vael Out",
    line: "I'm looking for someone.",
    body: "Tell us the role or opportunity you need filled and see who is available now.",
    icon: IconBriefcase,
  },
  {
    entry: "opportunities",
    name: "Opportunities",
    line: "Find or post work.",
    body: "Post work that needs doing, or take on work that's already posted.",
    icon: IconSearch,
  },
];

/** Go Visible: three choices. Picking one goes straight to creating an account. */
function GoVisibleChoose() {
  const { session } = useCitySession();
  const navigate = useNavigate();

  function choose(entry: GoVisibleEntry) {
    if (!session.signedIn) {
      navigate(`${JOIN_ROUTE}?entry=${entry}`);
      return;
    }
    navigate(routeForGoVisibleEntry(session.handle, entry));
  }

  return (
    <div
      data-surface="site-dark"
      className="join-flow wizard-flow relative isolate flex flex-1 flex-col overflow-clip bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-12%] h-[42rem] w-[42rem] rounded-full bg-[#EE8A4A]/20 blur-[130px]"
      />
      <div className="site-container relative pb-16 pt-12 md:pt-20">
        <header className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="site-eyebrow">Go Visible</p>
          <h1 className="mt-5 font-sans text-[clamp(1.875rem,3.4vw,2.75rem)] font-medium leading-[1.15] tracking-[-0.025em] text-foreground">
            Become visible
            <br />
            in the city of VAEL
          </h1>
          <p className="mt-3 font-sans text-[1.0625rem] leading-[1.55] text-muted">
            Choose how you want to use VAEL. You'll create your account next.
          </p>
        </header>

        <ul className="mx-auto mt-12 grid w-full max-w-5xl gap-4 md:grid-cols-3 md:gap-5">
          {GO_VISIBLE_CHOICES.map((choice) => (
            <li key={choice.entry}>
              <button
                type="button"
                onClick={() => choose(choice.entry)}
                className={cn(
                  "group flex h-full w-full flex-col items-start rounded-xl border border-white/15 bg-surface p-6 text-left",
                  "motion-safe:transition-all motion-safe:duration-200",
                  "hover:-translate-y-0.5 hover:border-[#EE8A4A] hover:bg-[#EE8A4A]/[0.06]",
                )}
              >
                <choice.icon className="h-6 w-6 text-[#EE8A4A]" />
                <h2 className="mt-6 text-h4 font-medium text-foreground">{choice.name}</h2>
                <p className="mt-1 text-body-sm font-medium text-foreground">{choice.line}</p>
                <p className="mt-2 text-body-sm leading-relaxed text-muted">{choice.body}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <FindYourWay />
    </div>
  );
}

export function GoVisiblePage() {
  const location = useLocation();
  if (isStepsEntry(location.state)) return <GoVisibleSteps />;
  return <GoVisibleChoose />;
}

/** The older step-by-step flow, still used by the opportunity buttons on the dashboards. */
function GoVisibleSteps() {
  const { session } = useCitySession();
  const navigate = useNavigate();
  const location = useLocation();
  const [choiceId, setChoiceId] = useState("");
  const [choice, setChoice] = useState<GoVisibleEntry | "">("");
  const entryState = location.state as {
    opportunityStep?: boolean;
    districtStep?: boolean;
    opportunityIntent?: "create" | "avail";
  } | null;
  const [opportunityIntent, setOpportunityIntent] = useState<"create" | "avail" | "">(
    () => (entryState?.districtStep ? entryState.opportunityIntent ?? "" : ""),
  );
  const [onOpportunityStep, setOnOpportunityStep] = useState(() => entryState?.opportunityStep === true);
  const [onDistrictStep, setOnDistrictStep] = useState(
    () => entryState?.districtStep === true && Boolean(entryState.opportunityIntent),
  );
  const [districtIds, setDistrictIds] = useState<string[]>([]);
  const [onInfoStep, setOnInfoStep] = useState(false);
  const [discipline, setDiscipline] = useState("");
  const [location_, setLocation] = useState("");
  const leadDistrictId = districtIds.find((id) => GO_VISIBLE_DISTRICTS.find((d) => d.id === id)?.live) ?? districtIds[0] ?? "";
  const disciplineOptions = disciplinesFor(leadDistrictId);

  function onNext() {
    if (onInfoStep) {
      if (!discipline || (choice !== "in" && choice !== "out")) return;
      saveGoVisibleInfo({ discipline, location: location_.trim(), districtIds });
      if (!session.signedIn) navigate(`${JOIN_ROUTE}?entry=${choice}`);
      else navigate(routeForGoVisibleEntry(session.handle, choice));
      return;
    }
    if (onDistrictStep) {
      if (districtIds.length === 0) return;
      // The first pick leads the flow that follows; the rest travel along.
      const districtId = districtIds.find((id) => GO_VISIBLE_DISTRICTS.find((d) => d.id === id)?.live) ?? districtIds[0];
      if (session.signedIn) setActiveDistrict(session.handle, districtId);
      if (!opportunityIntent) {
        if (choice !== "in" && choice !== "out") return;
        setDiscipline("");
        setOnInfoStep(true);
        return;
      }
      const state = { from: "go-visible", districtId, districtIds, opportunityIntent };
      navigate(opportunityIntent === "create" ? NEED_PATH : CONTRACTOR_OPPS_PATH, { state });
      return;
    }
    if (onOpportunityStep) {
      if (opportunityIntent) setOnDistrictStep(true);
      return;
    }
    if (!choice) return;
    if (choice === "opportunities") {
      setOnOpportunityStep(true);
      return;
    }
    setOnDistrictStep(true);
  }

  return (
    <div
      data-surface="site-dark"
      className="join-flow wizard-flow relative isolate flex flex-1 flex-col overflow-clip bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-12%] h-[42rem] w-[42rem] rounded-full bg-[#EE8A4A]/20 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-15%] right-[6%] h-[30rem] w-[30rem] rounded-full bg-[#EE8A4A]/10 blur-[120px]"
      />
      <div className="site-container relative pt-10 md:pt-14">
        <header className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="site-eyebrow">Go Visible</p>
          <h1 className="mt-5 font-sans text-[clamp(1.875rem,3.4vw,2.75rem)] font-medium leading-[1.15] tracking-[-0.025em] text-foreground">
            {onInfoStep
              ? "Add your minimum information"
              : onDistrictStep
              ? "Choose your district"
              : onOpportunityStep
                ? "Create or avail an opportunity?"
                : <>
                    Become visible
                    <br />
                    in the city of VAEL
                  </>}
          </h1>
          <ol className="order-last mt-6 flex flex-wrap items-center justify-center gap-2 text-body-sm" aria-label="Go Visible steps">
            {["Intent", "District", "Details"].map((label, index) => {
              const current = onInfoStep ? 2 : onDistrictStep ? 1 : 0;
              return (
                <li key={label} className="flex items-center gap-2">
                  <span
                    aria-current={index === current ? "step" : undefined}
                    className={cn(
                      "rounded-full border px-4 py-1.5",
                      index === current
                        ? "border-[#EE8A4A] text-[#EE8A4A]"
                        : index < current
                          ? "border-white/15 text-foreground"
                          : "border-white/10 text-muted",
                    )}
                  >
                    {index + 1}. {label}
                  </span>
                  {index < 2 ? <span aria-hidden className="text-muted">→</span> : null}
                </li>
              );
            })}
          </ol>
          {onInfoStep ? (
            <p className="mt-3 font-sans text-[1.0625rem] leading-[1.55] text-muted">
              Just two quick details. Next, you'll sign in or create your account.
            </p>
          ) : onDistrictStep ? (
            <p className="mt-3 font-sans text-[1.0625rem] leading-[1.55] text-muted">
              Pick the district. We'll ask for the rest of the details next.
            </p>
          ) : onOpportunityStep ? (
            <div className="mt-3 space-y-1 font-sans text-[1.0625rem] leading-[1.55] text-muted">
              <p>Create one for your home or your business.</p>
              <p>Or avail one that's already posted.</p>
            </div>
          ) : (
            <p className="mt-3 font-sans text-[1.0625rem] leading-[1.55] text-muted">
              Choose what you need, confirm a district, and go.
            </p>
          )}
        </header>
      </div>
      <div className="site-container relative flex flex-1 items-start pb-10 pt-8">
        {onInfoStep ? (
          <div className="mx-auto w-full max-w-xl space-y-5">
            <Field label={choice === "out" ? "Discipline you need" : "Your discipline"} htmlFor="gv-discipline" required>
              <Select id="gv-discipline" value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                <option value="">Select a discipline</option>
                {disciplineOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Location (optional)" htmlFor="gv-location">
              <Input
                id="gv-location"
                value={location_}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, state"
                autoComplete="address-level2"
              />
            </Field>
          </div>
        ) : onDistrictStep ? (
          <ul className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-3">
            {GO_VISIBLE_DISTRICTS.map((district) => {
              const checked = districtIds.includes(district.id);
              return (
                <li key={district.id}>
                  <label
                    className={cn(
                      "flex h-full cursor-pointer items-center gap-4 rounded-xl border bg-surface px-5 py-5",
                      "motion-safe:transition-colors motion-safe:duration-150 hover:border-[#EE8A4A]",
                      checked ? "border-[#EE8A4A] bg-[#EE8A4A]/[0.08]" : "border-white/20",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setDistrictIds((prev) =>
                          prev.includes(district.id) ? prev.filter((id) => id !== district.id) : [...prev, district.id],
                        )
                      }
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border",
                        "peer-focus-visible:shadow-[0_0_0_3px_rgba(222,124,64,0.35)]",
                        checked ? "border-[#EE8A4A] bg-[#EE8A4A] text-[#1A1410]" : "border-white/25 text-transparent",
                      )}
                    >
                      <IconCheck className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-body font-medium text-foreground">{district.name}</span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[0.75rem] font-medium uppercase tracking-[0.08em]",
                          district.live ? "text-emerald-400" : "text-muted",
                        )}
                      >
                        {district.status}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : onOpportunityStep ? (
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
          <ul className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-3">
            {GO_VISIBLE_OPTIONS.map((option) => {
              const selected = choiceId === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setChoiceId(option.id);
                      setChoice(option.entry);
                    }}
                    aria-pressed={selected}
                    className={cn(
                      "flex h-full w-full items-center gap-4 rounded-xl border bg-surface px-5 py-5 text-left text-body font-medium text-foreground",
                      "motion-safe:transition-colors motion-safe:duration-150 hover:border-[#EE8A4A] hover:bg-[#EE8A4A]/[0.08]",
                      selected ? "border-[#EE8A4A] bg-[#EE8A4A]/[0.08]" : "border-white/20",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border",
                        selected ? "border-[#EE8A4A] bg-[#EE8A4A] text-[#1A1410]" : "border-white/25 text-transparent",
                      )}
                    >
                      <IconCheck className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">{option.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="sticky bottom-0 z-10 border-t border-white/10 bg-background/95 backdrop-blur">
        <div className="site-container flex items-center justify-between gap-4 py-4">
        {onOpportunityStep || onDistrictStep || onInfoStep ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-full px-10"
            onClick={() => {
              if (onInfoStep) {
                setOnInfoStep(false);
                return;
              }
              if (onDistrictStep) {
                setOnDistrictStep(false);
                setDistrictIds([]);
                return;
              }
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
          className="rounded-full px-10"
          disabled={onInfoStep ? !discipline : onDistrictStep ? districtIds.length === 0 : onOpportunityStep ? !opportunityIntent : !choice}
          onClick={onNext}
        >
          Next
        </Button>
        </div>
      </div>
    </div>
  );
}
