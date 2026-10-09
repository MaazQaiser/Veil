import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field, FormSection } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/controls";
import { TagField, splitTags } from "@/components/ui/tags";
import { Avatar } from "@/components/ui/avatar";
import { PortfolioEditor } from "@/components/vael/profileForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconBriefcase,
  IconCheck,
  IconChevronLeft,
  IconClock,
  IconDocument,
  IconHandshake,
  IconLock,
  IconSearch,
  IconUser,
} from "@/components/ui/icons";
import { SearchInput } from "@/components/ui/search";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { cn } from "@/lib/cn";
import { useCitySession } from "@/lib/citySession";
import { primaryDistricts } from "@/lib/districts";
import { DISTRICT_CARDS } from "@/lib/marketingDirectory";
import { profileCompletion } from "@/lib/providerJourney";
import { useVael } from "@/lib/vaelCore";
import { useConstruction } from "@/lib/constructionCore";
import { useTrucking } from "@/lib/truckingCore";
import { useResidential } from "@/lib/residentialCore";
import { useCommercial } from "@/lib/commercialCore";
import { useJoinedDistricts, useDistrictCards, siblingCompletion } from "@/components/mt/DistrictsRow";
import { addManualDistricts, getActiveDistrictId } from "@/lib/myDistricts";
import { districtProfileEditRoute, getOnboardingDraft } from "@/lib/onboarding";
import { capabilityOptions, disciplineOptions, certificationOptions, LOOKING_FOR_OPTIONS, M_T_OFFERS } from "@/lib/vaelStore";
import { CX_TRADES, CX_SKILLS, CX_OFFERS, CX_CREDENTIAL_TYPES, subscribeConstruction } from "@/lib/constructionStore";
import { TX_EQUIPMENT, TX_SKILLS, TX_OFFERS, TX_CREDENTIAL_TYPES, subscribeTrucking } from "@/lib/truckingStore";
import { RX_SERVICES, RX_SKILLS, RX_OFFERS, RX_CREDENTIAL_TYPES, subscribeResidential } from "@/lib/residentialStore";
import { CM_CAPABILITIES, CM_SKILLS, CM_OFFERS, CM_CREDENTIAL_TYPES, subscribeCommercial } from "@/lib/commercialStore";
import { subscribeVael } from "@/lib/vaelStore";

const MANAGE_ROUTE = "/media-technology/districts";
const SIBLING_PROFILE_DISTRICTS = new Set(["construction", "trucking", "residential", "commercial"]);

function districtProfileHref(districtId: string, handle: string) {
  if (SIBLING_PROFILE_DISTRICTS.has(districtId)) return districtProfileEditRoute(districtId, handle);
  return `${MANAGE_ROUTE}/${districtId}/edit`;
}

/** Longer, two-line blurbs for this card grid only — the shared `district.blurb` stays
 * short for the places that need a single line (marketing, onboarding). */
const DISTRICT_CARD_BLURB: Record<string, string> = {
  "media-technology": "Technology, design, media, and digital professionals — matched by real-time availability, not job posts.",
  construction: "Vael In if you are available for construction work. Vael Out if you need a contractor.",
  trucking: "Carriers, drivers, and freight capacity for regional and long-haul freight moves, matched on availability.",
  residential: "Home services for homeowner projects, from repairs and installs to renovations and everything between.",
  commercial: "Business services and commercial providers supporting local companies, offices, and facilities.",
};

/** Same backdrop the generic profile banner uses — one consistent look across the app. */
const DEFAULT_COVER_IMAGE = "/scenes/city-skyline-wide.jpg";

const EDIT_TABS = ["role", "skills", "experience", "capabilities", "lookingFor", "work", "credentials"] as const;

const EDIT_TAB_LABEL: Record<(typeof EDIT_TABS)[number], string> = {
  role: "Your Role",
  skills: "Skills & Expertise",
  experience: "Experience",
  capabilities: "Capabilities",
  lookingFor: "Looking For",
  work: "Work",
  credentials: "Credentials",
};

function BackToDistricts() {
  return (
    <Link to={MANAGE_ROUTE} className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground">
      <IconChevronLeft className="h-3.5 w-3.5" />
      Back to Districts
    </Link>
  );
}

/* ------------------------------------------------------------------ 01/02 Districts page */

export function DistrictsPage() {
  const { session } = useCitySession();
  const vael = useVael();
  const handle = session.handle;
  const mine = vael.profile(handle);
  const docs = vael.documents(handle);
  const cards = useDistrictCards(handle, mine, docs);
  const percentByDistrict = new Map(cards.map((row) => [row.district.id, row.percent]));
  const activeByDistrict = new Map(cards.map((row) => [row.district.id, row.isActive]));
  const visitedByDistrict = new Map(cards.map((row) => [row.district.id, row.hasVisited]));
  const homeDistrictId = getOnboardingDraft(handle)?.districtId || "media-technology";
  const vaelIn = getOnboardingDraft(handle)?.intent !== "out";

  const [query, setQuery] = useState("");

  const visibleDistricts = primaryDistricts.filter((district) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${district.name} ${district.blurb}`.toLowerCase().includes(q);
  });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
            Districts
          </h1>
          <p className="mt-1 text-body-sm text-muted">
            {vaelIn
              ? "You are live in one district. Switch when you want to become live in another."
              : "Explore the Districts across VAEL and manage the ones you belong to."}
          </p>
        </div>
        <SearchInput
          label="Search districts"
          placeholder="Search districts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="sm:w-64"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleDistricts.map((district) => {
          const percent = percentByDistrict.get(district.id) ?? 0;
          const isActive = Boolean(activeByDistrict.get(district.id));
          const hasVisited = Boolean(visitedByDistrict.get(district.id));
          const isHome = district.id === homeDistrictId;
          const image = DISTRICT_CARDS.find((card) => card.id === district.id)?.image;
          return (
            <div
              key={district.id}
              className={cn(
                "flex flex-col gap-4 rounded-2xl border bg-surface p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-8px_rgba(17,17,17,0.14)]",
                "dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.2),0_16px_36px_-12px_rgba(0,0,0,0.4)]",
                isActive ? "border-accent/50" : "border-border",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-surface-muted">
                  {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
                </span>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="truncate vael-h4">{district.name}</p>
                  {isActive ? (
                    <Badge tone="live">{vaelIn ? "Live" : "Current"}</Badge>
                  ) : (
                    <Badge tone={percent === 100 ? "live" : percent > 0 ? "gold" : "outline"}>
                      {percent}% complete
                    </Badge>
                  )}
                  {isHome && !isActive ? <Badge tone="outline">Home</Badge> : null}
                </div>
              </div>
              <p className="line-clamp-2 text-body-sm text-muted">
                {DISTRICT_CARD_BLURB[district.id] ?? district.blurb}
              </p>
              <div className="mt-auto flex items-end justify-between gap-3 border-t border-border-subtle pt-4">
                {isActive ? (
                  <>
                    <p className="text-caption text-muted">
                      {vaelIn ? "You're live in this district" : "You're in this district"}
                    </p>
                    <Link
                      to={district.id === "construction" ? "/districts/contractor" : `${MANAGE_ROUTE}/${district.id}/edit`}
                      className="shrink-0 text-body-sm font-medium text-[#C99A28] underline underline-offset-4 hover:text-foreground dark:text-accent"
                    >
                      {district.id === "construction" ? "Open exchange →" : "View district →"}
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-caption text-muted">
                      {percent}% complete · you&rsquo;re not in this district yet
                    </p>
                    <Link
                      to={`${MANAGE_ROUTE}/${district.id}`}
                      className={buttonClassName({ size: "sm", className: "shrink-0 whitespace-nowrap" })}
                    >
                      {vaelIn ? "Switch district" : hasVisited ? "Join again" : "Join District"}
                    </Link>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {visibleDistricts.length === 0 ? (
          <p className="col-span-full py-10 text-center text-body-sm text-muted">No districts match "{query}".</p>
        ) : null}
      </div>
    </DashboardShell>
  );
}

/* ------------------------------------------------------------------ per-district bundle */

/**
 * Everything the Overview and Edit pages need, normalized to one shape per District.
 *
 * Each district's Core provider only re-renders itself on writes (its `useMemo`
 * value doesn't depend on the write tick), so a write here doesn't reliably cascade
 * down to this hook's callers. Subscribe locally, the same way `useCxProjects` does
 * for the Opportunity store, so edits to role/skills/experience show up immediately
 * instead of only after an unrelated re-render (e.g. switching tabs) or a reload.
 */
function useDistrictBundle(districtId: string | undefined, handle: string) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const unsubs = [
      subscribeVael(bump),
      subscribeConstruction(bump),
      subscribeTrucking(bump),
      subscribeResidential(bump),
      subscribeCommercial(bump),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const vael = useVael();
  const construction = useConstruction();
  const trucking = useTrucking();
  const residential = useResidential();
  const commercial = useCommercial();

  if (districtId === "media-technology") {
    const profile = vael.ensureMine();
    const docs = vael.documents(handle);
    return profile && {
      district: primaryDistricts.find((d) => d.id === "media-technology")!,
      percent: profileCompletion(profile, docs, vael.latestListing?.side ?? "in").percent,
      role: profile.disciplines,
      roleOptions: disciplineOptions(),
      specialization: profile.specialization ?? "",
      skillFields: [
        { label: "Skills", values: profile.skills, options: capabilityOptions("skills"), onChange: (next: string[]) => vael.writeProfile({ ...profile, skills: next }) },
        { label: "Tools / technologies", values: profile.tools, options: capabilityOptions("tools"), onChange: (next: string[]) => vael.writeProfile({ ...profile, tools: next }) },
      ],
      experienceYears: profile.experienceYears,
      experienceSummary: profile.experience,
      offers: profile.offers ?? [],
      offerOptions: M_T_OFFERS,
      lookingFor: profile.lookingFor ?? [],
      credentials: splitTags(profile.credentials),
      credentialOptions: certificationOptions(),
      work: profile.portfolio,
      availableNow: vael.vaelKind === "in",
      isSample: profile.sample,
      set: (patch: Record<string, unknown>) => vael.writeProfile({ ...profile, ...patch }),
      setCredentials: (next: string[]) => vael.writeProfile({ ...profile, credentials: next.join(", ") }),
      setWork: (next: { label: string; url: string; note?: string }[]) => vael.writeProfile({ ...profile, portfolio: next }),
      docsCount: docs.length,
    };
  }

  if (districtId === "construction") {
    const profile = construction.ensureMine();
    return profile && {
      district: primaryDistricts.find((d) => d.id === "construction")!,
      percent: siblingCompletion({ displayName: profile.displayName, headline: profile.headline, about: profile.about, capabilities: profile.capabilities, experience: profile.experience }) ?? 0,
      role: profile.trade ? [profile.trade] : [],
      roleOptions: [...CX_TRADES],
      specialization: profile.specialization ?? "",
      skillFields: [{ label: "Skills & expertise", values: profile.capabilities, options: CX_SKILLS, onChange: (next: string[]) => construction.writeProfile({ ...profile, capabilities: next }) }],
      experienceYears: undefined,
      experienceSummary: profile.experience,
      offers: profile.offers ?? [],
      offerOptions: CX_OFFERS,
      lookingFor: profile.lookingFor ?? [],
      credentials: profile.credentials,
      credentialOptions: CX_CREDENTIAL_TYPES,
      work: profile.portfolio,
      availableNow: construction.vaelKind === "in",
      isSample: profile.sample,
      set: (patch: Record<string, unknown>) => construction.writeProfile({ ...profile, ...patch }),
      setCredentials: (next: string[]) => construction.writeProfile({ ...profile, credentials: next }),
      setWork: (next: { label: string; url: string; note?: string }[]) => construction.writeProfile({ ...profile, portfolio: next }),
      docsCount: 0,
    };
  }

  if (districtId === "trucking") {
    const profile = trucking.ensureMine();
    return profile && {
      district: primaryDistricts.find((d) => d.id === "trucking")!,
      percent: siblingCompletion({ displayName: profile.displayName, headline: profile.headline, about: profile.about, capabilities: profile.capabilities, experience: profile.experience }) ?? 0,
      role: profile.equipment ? [profile.equipment] : [],
      roleOptions: [...TX_EQUIPMENT],
      specialization: profile.specialization ?? "",
      skillFields: [{ label: "Skills & expertise", values: profile.capabilities, options: TX_SKILLS, onChange: (next: string[]) => trucking.writeProfile({ ...profile, capabilities: next }) }],
      experienceYears: undefined,
      experienceSummary: profile.experience,
      offers: profile.offers ?? [],
      offerOptions: TX_OFFERS,
      lookingFor: profile.lookingFor ?? [],
      credentials: profile.credentials,
      credentialOptions: TX_CREDENTIAL_TYPES,
      work: profile.history,
      availableNow: trucking.vaelKind === "in",
      isSample: profile.sample,
      set: (patch: Record<string, unknown>) => trucking.writeProfile({ ...profile, ...patch }),
      setCredentials: (next: string[]) => trucking.writeProfile({ ...profile, credentials: next }),
      setWork: (next: { label: string; url: string; note?: string }[]) => trucking.writeProfile({ ...profile, history: next }),
      docsCount: 0,
    };
  }

  if (districtId === "residential") {
    const profile = residential.ensureMine();
    return profile && {
      district: primaryDistricts.find((d) => d.id === "residential")!,
      percent: siblingCompletion({ displayName: profile.displayName, headline: profile.headline, about: profile.about, capabilities: profile.capabilities, experience: profile.experience }) ?? 0,
      role: profile.service ? [profile.service] : [],
      roleOptions: [...RX_SERVICES],
      specialization: profile.specialization ?? "",
      skillFields: [{ label: "Skills & expertise", values: profile.capabilities, options: RX_SKILLS, onChange: (next: string[]) => residential.writeProfile({ ...profile, capabilities: next }) }],
      experienceYears: undefined,
      experienceSummary: profile.experience,
      offers: profile.offers ?? [],
      offerOptions: RX_OFFERS,
      lookingFor: profile.lookingFor ?? [],
      credentials: profile.credentials,
      credentialOptions: RX_CREDENTIAL_TYPES,
      work: profile.history,
      availableNow: residential.vaelKind === "in",
      isSample: profile.sample,
      set: (patch: Record<string, unknown>) => residential.writeProfile({ ...profile, ...patch }),
      setCredentials: (next: string[]) => residential.writeProfile({ ...profile, credentials: next }),
      setWork: (next: { label: string; url: string; note?: string }[]) => residential.writeProfile({ ...profile, history: next }),
      docsCount: 0,
    };
  }

  if (districtId === "commercial") {
    const profile = commercial.ensureMine();
    return profile && {
      district: primaryDistricts.find((d) => d.id === "commercial")!,
      percent: siblingCompletion({ displayName: profile.displayName, headline: profile.headline, about: profile.about, capabilities: profile.capabilities, experience: profile.experience }) ?? 0,
      role: profile.capability ? [profile.capability] : [],
      roleOptions: [...CM_CAPABILITIES],
      specialization: profile.specialization ?? "",
      skillFields: [{ label: "Skills & expertise", values: profile.capabilities, options: CM_SKILLS, onChange: (next: string[]) => commercial.writeProfile({ ...profile, capabilities: next }) }],
      experienceYears: undefined,
      experienceSummary: profile.experience,
      offers: profile.offers ?? [],
      offerOptions: CM_OFFERS,
      lookingFor: profile.lookingFor ?? [],
      credentials: profile.credentials,
      credentialOptions: CM_CREDENTIAL_TYPES,
      work: profile.history,
      availableNow: commercial.vaelKind === "in",
      isSample: profile.sample,
      set: (patch: Record<string, unknown>) => commercial.writeProfile({ ...profile, ...patch }),
      setCredentials: (next: string[]) => commercial.writeProfile({ ...profile, credentials: next }),
      setWork: (next: { label: string; url: string; note?: string }[]) => commercial.writeProfile({ ...profile, history: next }),
      docsCount: 0,
    };
  }

  return undefined;
}

/* ------------------------------------------------------------------ 03/04 District overview */

export function DistrictOverviewPage() {
  const { districtId } = useParams();
  const { session } = useCitySession();
  const vael = useVael();
  const handle = session.handle;
  const bundle = useDistrictBundle(districtId, handle);
  const joined = useJoinedDistricts(handle, vael.profile(handle), vael.documents(handle));
  const cards = useDistrictCards(handle, vael.profile(handle), vael.documents(handle));

  if (!session.signedIn) {
    return <Navigate to={JOIN_ROUTE} replace />;
  }

  const district = primaryDistricts.find((d) => d.id === districtId);
  if (!district || !bundle) {
    return (
      <CityPage className="-mt-4 sm:-mt-6">
        <BackToDistricts />
        <div className="mt-8">
          <EmptyState title="District not found" />
        </div>
      </CityPage>
    );
  }

  const isMember = joined.some((row) => row.district.id === districtId);
  const currentDistrictName = cards.find((row) => row.isActive && row.district.id !== district.id)?.district.name;

  return (
    <CityPage width="narrow" className="-mt-4 sm:-mt-6">
      <BackToDistricts />
      <div className="mt-4">
        <PageHeader title={district.name} description={district.blurb} />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        {isMember ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-body font-medium text-foreground">Your District</p>
              <Badge tone={bundle.percent === 100 ? "live" : "outline"}>{bundle.percent}% complete</Badge>
            </div>
            <div className="mt-5">
              <Link
                to={districtProfileHref(district.id, handle)}
                className={buttonClassName()}
              >
                {bundle.percent <= 20 ? "Complete District Profile" : "Edit District Profile"} →
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-body text-muted">You're not part of this District yet.</p>
            {currentDistrictName ? (
              <p className="mt-2 text-body-sm text-muted">
                Currently live in {currentDistrictName}. Continuing will make {district.name} your active district
                instead.
              </p>
            ) : null}
            <div className="mt-5">
              <Link to={districtProfileHref(district.id, handle)} className={buttonClassName()}>
                Complete District Profile →
              </Link>
            </div>
          </>
        )}
      </div>
    </CityPage>
  );
}

/* ------------------------------------------------------------------ 05-16 Edit District Profile */

export function EditDistrictProfilePage() {
  const { districtId } = useParams();
  const { session } = useCitySession();
  const handle = session.handle;
  const bundle = useDistrictBundle(districtId, handle);
  const [step, setStep] = useState<"form" | "saved">("form");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof EDIT_TABS)[number]>("role");

  if (!session.signedIn) {
    return <Navigate to={JOIN_ROUTE} replace />;
  }

  const district = primaryDistricts.find((d) => d.id === districtId);
  if (!district || !bundle) {
    return (
      <CityPage className="-mt-4 sm:-mt-6">
        <BackToDistricts />
        <div className="mt-8">
          <EmptyState title="District not found" />
        </div>
      </CityPage>
    );
  }

  const districtProfile = bundle;

  function save() {
    const vaelIn = getOnboardingDraft(handle)?.intent !== "out";
    const becomingLive = vaelIn && getActiveDistrictId(handle) !== district!.id;
    if (becomingLive && districtId !== "media-technology") {
      const missing: { label: string; tab: (typeof EDIT_TABS)[number] }[] = [];
      if (districtProfile.role.length === 0) missing.push({ label: "your role", tab: "role" });
      if (!districtProfile.skillFields.some((field) => field.values.length > 0)) {
        missing.push({ label: "your skills", tab: "skills" });
      }
      if (!districtProfile.experienceSummary?.trim()) missing.push({ label: "your experience", tab: "experience" });
      if (missing.length > 0) {
        setTab(missing[0]!.tab);
        setError(
          `Add ${missing.map((item) => item.label).join(", ")} on the ${missing.map((item) => EDIT_TAB_LABEL[item.tab]).join(", ")} tab${missing.length > 1 ? "s" : ""} before you go live.`,
        );
        return;
      }
    }
    addManualDistricts(handle, [district!.id]);
    setError("");
    setStep("saved");
  }

  if (step === "saved") {
    const vaelIn = getOnboardingDraft(handle)?.intent !== "out";
    return (
      <CityPage width="narrow" className="-mt-4 sm:-mt-6">
        <div className="mt-16 flex flex-col items-center gap-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-muted text-success">
            <IconCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="vael-h3">{vaelIn ? "You're live" : "District Profile Updated"}</p>
            <p className="mt-2 text-body-sm text-muted">
              {vaelIn
                ? `You're now live in ${district.name}. Only this district is active.`
                : `Your ${district.name} profile has been updated.`}
            </p>
          </div>
          {district.id === "construction" ? (
            <Link to="/districts/contractor" className={buttonClassName()}>
              Open Contractor Exchange →
            </Link>
          ) : (
            <Link to={vaelIn ? MANAGE_ROUTE : `${MANAGE_ROUTE}/${district.id}`} className={buttonClassName()}>
              {vaelIn ? "Back to Districts" : "Back to District"}
            </Link>
          )}
        </div>
      </CityPage>
    );
  }


  return (
    <CityPage className="-mt-4 sm:-mt-6">
      <BackToDistricts />
      <div className="mt-4">
        <PageHeader
          title="Edit District Profile"
          description="Add information specific to this District to improve your matches."
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border shadow-[0_1px_2px_rgba(11,12,12,0.04),0_18px_36px_-10px_rgba(11,12,12,0.12)] md:rounded-2xl">
        <div className="relative isolate h-24 overflow-hidden bg-surface-muted md:h-32">
          <img src={DEFAULT_COVER_IMAGE} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="bg-white px-6 pb-5 pt-4 md:px-8 dark:bg-white/[0.04]">
          <Avatar
            name={handle}
            size="xl"
            className="-mt-9 shrink-0 bg-white ring-4 ring-white shadow-[0_8px_24px_rgba(11,12,12,0.12)] dark:bg-white/10 dark:ring-[#0B0C0C] md:-mt-10"
          />
          <div className="mt-3 min-w-0">
            <p className="truncate text-h4 font-medium tracking-tight text-foreground">{district.name}</p>
            <p className="mt-0.5 truncate text-body-sm text-muted">@{handle}</p>
            <span className="mt-3 inline-flex items-center rounded-full bg-[#FFC555]/15 px-2.5 py-1 text-caption font-semibold text-[#C99A28] dark:bg-accent/15 dark:text-accent">
              {bundle.percent}% complete
            </span>
          </div>
        </div>
      </div>

      <form
        className="mt-10"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Tabs value={tab} onValueChange={(next) => setTab(next as (typeof EDIT_TABS)[number])} defaultValue="role">
          <TabsList>
            <TabsTrigger value="role" className="flex items-center gap-1.5">
              <IconUser className="h-3.5 w-3.5" />
              Your Role
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-1.5">
              <IconHandshake className="h-3.5 w-3.5" />
              Skills & Expertise
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-1.5">
              <IconClock className="h-3.5 w-3.5" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="capabilities" className="flex items-center gap-1.5">
              <IconBriefcase className="h-3.5 w-3.5" />
              Capabilities
            </TabsTrigger>
            <TabsTrigger value="lookingFor" className="flex items-center gap-1.5">
              <IconSearch className="h-3.5 w-3.5" />
              Looking For
            </TabsTrigger>
            <TabsTrigger value="work" className="flex items-center gap-1.5">
              <IconDocument className="h-3.5 w-3.5" />
              Work
            </TabsTrigger>
            <TabsTrigger value="credentials" className="flex items-center gap-1.5">
              <IconLock className="h-3.5 w-3.5" />
              Credentials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="role" className="mt-8 max-w-narrow">
            <FormSection title="Your Role" note="What do you do in this District?">
              <TagField
                id="role"
                label="Role / profession"
                values={bundle.role}
                options={bundle.roleOptions}
                placeholder="Search or add a role"
                onChange={(next) => bundle.set({ [roleFieldFor(districtId!)]: districtId === "media-technology" ? next : (next.slice(-1)[0] ?? "") })}
              />
              <Field label="Specialization" htmlFor="spec">
                <Input id="spec" value={bundle.specialization} onChange={(e) => bundle.set({ specialization: e.target.value })} />
              </Field>
            </FormSection>
          </TabsContent>

          <TabsContent value="skills" className="mt-8 max-w-narrow">
            <FormSection title="Skills & Expertise" note="What skills do you bring to this District?">
              {bundle.skillFields.map((field) => (
                <TagField
                  key={field.label}
                  id={field.label}
                  label={field.label}
                  values={field.values}
                  options={field.options}
                  placeholder="Search or add"
                  onChange={field.onChange}
                />
              ))}
            </FormSection>
          </TabsContent>

          <TabsContent value="experience" className="mt-8 max-w-narrow">
            <FormSection title="Experience" note="Tell us about your experience in this District.">
              {bundle.experienceYears !== undefined || districtId === "media-technology" ? (
                <Field label="Years of experience" htmlFor="years">
                  <Input
                    id="years"
                    type="number"
                    min={0}
                    max={60}
                    inputMode="numeric"
                    value={bundle.experienceYears ?? ""}
                    onChange={(e) => bundle.set({ experienceYears: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                </Field>
              ) : null}
              <Field label="Experience summary" htmlFor="expsum">
                <Textarea id="expsum" value={bundle.experienceSummary} onChange={(e) => bundle.set({ experience: e.target.value })} />
              </Field>
            </FormSection>
          </TabsContent>

          <TabsContent value="capabilities" className="mt-8 max-w-narrow">
            <FormSection title="Capabilities" note="What can you offer in this District?">
              <TagField
                id="offers"
                label="What you offer"
                values={bundle.offers}
                options={bundle.offerOptions}
                placeholder="Search or add"
                onChange={(next) => bundle.set({ offers: next })}
              />
            </FormSection>
          </TabsContent>

          <TabsContent value="lookingFor" className="mt-8 max-w-narrow">
            <FormSection title="Looking For" note="What are you looking for in this District?">
              <TagField
                id="lookingFor"
                label="Looking for"
                values={bundle.lookingFor}
                options={LOOKING_FOR_OPTIONS}
                placeholder="Search or add"
                onChange={(next) => bundle.set({ lookingFor: next })}
              />
            </FormSection>
          </TabsContent>

          <TabsContent value="work" className="mt-8 max-w-narrow">
            <FormSection title="Work / Portfolio" note="Show work relevant to this District.">
              <PortfolioEditor items={bundle.work} onChange={bundle.setWork} />
            </FormSection>
          </TabsContent>

          <TabsContent value="credentials" className="mt-8 max-w-narrow">
            <FormSection title="Credentials" note="Optional. Add credentials relevant to this District.">
              <TagField
                id="creds"
                label="Credentials"
                hint="Labels only — not verified."
                values={bundle.credentials}
                options={bundle.credentialOptions}
                placeholder="Search or add"
                onChange={bundle.setCredentials}
              />
            </FormSection>
          </TabsContent>
        </Tabs>

        <div className="mt-10 max-w-narrow space-y-6">
          {error ? (
            <p role="alert" className="text-caption text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" className="rounded-full">
              Save
            </Button>
          </div>
        </div>
      </form>
    </CityPage>
  );
}

function roleFieldFor(districtId: string) {
  return (
    {
      "media-technology": "disciplines",
      construction: "trade",
      trucking: "equipment",
      residential: "service",
      commercial: "capability",
    } as Record<string, string>
  )[districtId];
}
