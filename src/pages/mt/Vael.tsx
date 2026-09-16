import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field, FormSection } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { TagField } from "@/components/ui/tags";
import { CityPage } from "@/components/city/CityShell";
import { JourneyProgress } from "@/components/city/setup";
import { VaelStatePanel } from "@/components/vael/visibility";
import { RequireMember } from "@/components/mt/RequireMember";
import { useVael } from "@/lib/vaelCore";
import {
  ALEX_VAEL_DEFAULTS,
  clearDemoDraft,
  DEMO_HANDLE,
  loadDemoDraft,
  saveDemoDraft,
} from "@/lib/demoJourney";
import {
  capabilityOptions,
  certificationOptions,
  DEFAULT_DURATION_HOURS,
  hoursLeft,
  M_T_BUDGET,
  M_T_CATEGORIES,
  M_T_DISCIPLINES,
  M_T_ENGAGEMENTS,
  M_T_TIMING,
  type VaelListing,
} from "@/lib/vaelStore";

export function VaelPage() {
  return (
    <RequireMember title="Set availability">
      <VaelInner />
    </RequireMember>
  );
}

export function ActiveVaelPage() {
  return (
    <RequireMember title="You're visible">
      <ActiveVaelInner />
    </RequireMember>
  );
}

export function PostOpportunityPage() {
  return <Navigate to="/media-technology/vael?side=out" replace />;
}

/**
 * Anyone who signed up gets neutral form scaffolding and nothing else — the rest
 * comes from their own profile. Only the walkthrough persona sees Alex Morgan's
 * seeded answers.
 */
const BLANK_VAEL_DEFAULTS: typeof ALEX_VAEL_DEFAULTS = {
  side: "in",
  category: "",
  discipline: "",
  skills: "",
  tools: "",
  certifications: "",
  location: "",
  remoteOnsite: "remote",
  timing: M_T_TIMING[0],
  experienceYears: "",
  engagement: M_T_ENGAGEMENTS[0],
  budgetProxy: M_T_BUDGET[0],
  description: "",
  requirements: "",
  contact: "",
  timeline: M_T_TIMING[0],
};

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function VaelInner() {
  const { listing, saveListing, handle, ensureMine } = useVael();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const creating = params.get("create") === "1";
  const requestedSide = params.get("side") === "out" ? "out" : params.get("side") === "in" ? "in" : undefined;
  /** Creating with an explicit side different from the active listing switches sides instead of just viewing status. */
  const switchingSide = Boolean(listing && creating && requestedSide && requestedSide !== listing.side);

  if (listing && !switchingSide) {
    return <Navigate to="/media-technology/vael/active" replace />;
  }

  const profile = ensureMine();
  const draft = loadDemoDraft(handle);
  const fallback = handle === DEMO_HANDLE ? ALEX_VAEL_DEFAULTS : BLANK_VAEL_DEFAULTS;
  /** Opens on the form — success moves to /vael/active. */
  const [step, setStep] = useState<"form" | "saving" | "error">("form");
  const [error, setError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  /** Kept out of `step` so a validation error cannot expand unrelated optional fields. */
  const [showMore, setShowMore] = useState(false);
  const initialSide = requestedSide ?? listing?.side ?? "in";

  const [form, setForm] = useState(() => ({
    side: initialSide,
    category: listing?.category ?? draft?.category ?? fallback.category,
    discipline: listing?.discipline ?? draft?.discipline ?? profile?.disciplines[0] ?? fallback.discipline,
    skills: listing?.skills.join(", ") ?? draft?.skills ?? profile?.skills.join(", ") ?? fallback.skills,
    tools: listing?.tools.join(", ") ?? draft?.tools ?? profile?.tools.join(", ") ?? fallback.tools,
    certifications:
      listing?.certifications.join(", ") ?? draft?.certifications ?? profile?.credentials ?? fallback.certifications,
    location: listing?.location ?? draft?.location ?? profile?.location ?? fallback.location,
    remoteOnsite:
      listing?.remoteOnsite ?? draft?.remoteOnsite ?? profile?.workPreference ?? fallback.remoteOnsite,
    timing: listing?.timing ?? draft?.timing ?? fallback.timing,
    experienceYears: String(
      listing?.experienceYears ?? draft?.experienceYears ?? profile?.experienceYears ?? fallback.experienceYears,
    ),
    engagement: listing?.engagement ?? draft?.engagement ?? fallback.engagement,
    budgetProxy: listing?.budgetProxy ?? draft?.budgetProxy ?? fallback.budgetProxy,
    description:
      listing?.description ??
      draft?.description ??
      (profile?.headline ? `${profile.headline} available this cycle.` : fallback.description),
    requirements: listing?.requirements ?? draft?.requirements ?? fallback.requirements,
    contact: listing?.contact ?? draft?.contact ?? "",
    timeline: listing?.timeline ?? draft?.timeline ?? fallback.timeline,
  }));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  /** `in` is a Provider becoming available. `out` is someone saying they need a person. */
  const available = form.side === "in";
  const skillOptions = capabilityOptions("skills");
  const toolOptions = capabilityOptions("tools");
  const certOptions = certificationOptions();

  const payload = useMemo(
    (): Omit<VaelListing, "id" | "createdAt" | "expiresAt" | "plan"> => ({
      handle,
      side: form.side,
      category: form.category,
      discipline: form.discipline,
      skills: splitList(form.skills),
      tools: splitList(form.tools),
      certifications: splitList(form.certifications),
      location: form.location,
      remoteOnsite: form.remoteOnsite as VaelListing["remoteOnsite"],
      timing: form.timing,
      experienceYears: Number(form.experienceYears) || 0,
      engagement: form.engagement,
      budgetProxy: form.budgetProxy,
      description: form.description,
      requirements: form.requirements,
      contact: form.contact,
      timeline: form.timeline,
    }),
    [form, handle],
  );

  function publish() {
    const missing = !form.discipline
      ? "Choose a discipline so VAEL knows where you fit."
      : splitList(form.skills).length === 0
        ? "Add at least one capability to become visible to relevant matches."
        : !form.location
          ? "Add the location you work from."
          : !form.description.trim()
            ? available
              ? "Add one line about what you are available for."
              : "Add one line about what you need."
            : "";
    if (missing) {
      setError(missing);
      setStep("error");
      return;
    }
    setStep("saving");
    try {
      saveListing(payload);
      clearDemoDraft(handle);
      setError("");
      navigate("/media-technology/vael/active");
    } catch {
      setError("The VAEL could not be stored on this device.");
      setStep("error");
    }
  }

  return (
    <CityPage width="narrow">
      <JourneyProgress step="Vael In" />
      <PageHeader
        kicker="Media & Technology"
        title={available ? "Set your availability" : "Say what you need"}
        description={
          available
            ? "Let the City know you’re available for relevant opportunities."
            : "Tell the City what you are looking for this cycle."
        }
        crumbs={[
          { label: "Media & Technology", href: "/media-technology" },
          { label: "Availability" },
        ]}
      />

      <form
        className="mt-10 max-w-narrow space-y-12"
        onSubmit={(event) => {
          event.preventDefault();
          publish();
        }}
      >
        <FormSection
          title={available ? "Your availability" : "What you need"}
          note={
            available
              ? "These come from your profile. Adjust anything that isn’t right for this cycle."
              : "Describe the capability you are looking for."
          }
        >
          <Field label="Discipline" htmlFor="discipline" required>
            <Select id="discipline" value={form.discipline} onChange={(e) => set("discipline", e.target.value)}>
              {/* Without this the select would render the first discipline while holding no value. */}
              <option value="">Choose a discipline</option>
              {M_T_DISCIPLINES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <TagField
            id="skills"
            label="Skills"
            values={splitList(form.skills)}
            options={skillOptions}
            placeholder="Search or add a skill"
            onChange={(next) => set("skills", next.join(", "))}
          />
          <TagField
            id="tools"
            label="Tools"
            values={splitList(form.tools)}
            options={toolOptions}
            placeholder="Search or add a tool"
            onChange={(next) => set("tools", next.join(", "))}
          />
          <TagField
            id="certs"
            label="Certifications"
            hint="Optional."
            values={splitList(form.certifications)}
            options={certOptions}
            placeholder="Search or add a certification"
            onChange={(next) => set("certifications", next.join(", "))}
          />
          <Field
            label={available ? "What you’re available for" : "What you need"}
            htmlFor="desc"
            required
            hint="One line. Matches see this."
          >
            <Textarea id="desc" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </FormSection>

        <FormSection title="Work preference">
          <Field label="Work preference" htmlFor="remote">
            <Select
              id="remote"
              value={form.remoteOnsite}
              onChange={(e) => set("remoteOnsite", e.target.value as "remote" | "onsite" | "hybrid")}
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </Select>
          </Field>
          <Field label="Location" htmlFor="location" required>
            <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
        </FormSection>

        <FormSection title={available ? "When are you available?" : "When do you need someone?"}>
          <Field label="Timing" htmlFor="timing">
            <Select id="timing" value={form.timing} onChange={(e) => set("timing", e.target.value)}>
              {M_T_TIMING.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Experience (years)" htmlFor="exp" hint="Carried over from your profile.">
            <Input
              id="exp"
              inputMode="numeric"
              value={form.experienceYears}
              onChange={(e) => set("experienceYears", e.target.value)}
            />
          </Field>
        </FormSection>

        {showMore ? (
          <FormSection title="More detail" note="Optional. Helps VAEL place you more precisely.">
            <Field label="Category" htmlFor="category">
              <Select id="category" value={form.category} onChange={(e) => set("category", e.target.value)}>
                <option value="">Not specified</option>
                {M_T_CATEGORIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Engagement" htmlFor="eng">
              <Select id="eng" value={form.engagement} onChange={(e) => set("engagement", e.target.value)}>
                {M_T_ENGAGEMENTS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Budget proxy" htmlFor="budget">
              <Select id="budget" value={form.budgetProxy} onChange={(e) => set("budgetProxy", e.target.value)}>
                {M_T_BUDGET.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
          </FormSection>
        ) : null}

        <section className="rounded-2xl border border-border bg-surface-muted px-6 py-6">
          <p className="vael-kicker">You’ll be visible for</p>
          <p className="mt-2 vael-h3">{DEFAULT_DURATION_HOURS} hours</p>
          <p className="mt-2 text-body-sm text-muted">
            After that your VAEL ends and you stop appearing to matches. You can Vael In again any time.
          </p>
          <p className="vael-kicker mt-6">Matching will consider</p>
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-body-sm text-muted">
            {["Your capabilities", "Work preference", "Location", "Experience", "Availability"].map((item, index) => (
              <li key={item}>
                {index > 0 ? (
                  <span className="mr-3 text-quiet" aria-hidden>
                    ·
                  </span>
                ) : null}
                {item}
              </li>
            ))}
          </ul>
        </section>

        <Alert tone="info" title="Stored on this device">
          This VAEL stays in this browser for {DEFAULT_DURATION_HOURS} hours. It is not sent to a live market.
        </Alert>

        {error ? (
          <p role="alert" className="text-label text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" loading={step === "saving"}>
            {available ? "Vael In" : "Vael Out"}
          </Button>
          {!showMore ? (
            <Button type="button" variant="ghost" onClick={() => setShowMore(true)}>
              More detail
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              saveDemoDraft(form, handle);
              setDraftSaved(true);
            }}
          >
            Save for later
          </Button>
        </div>
        {draftSaved ? <p className="text-label text-muted">Saved on this device. Not published.</p> : null}
      </form>
    </CityPage>
  );
}

function ActiveVaelInner() {
  const { listing, vaelKind, clearListing } = useVael();
  const navigate = useNavigate();

  if (!listing) {
    return <Navigate to="/media-technology/vael?create=1" replace />;
  }

  const hours = hoursLeft(listing.expiresAt);

  return (
    <CityPage width="narrow">
      <JourneyProgress step="Matches" />
      <PageHeader
        kicker="Media & Technology"
        title="You’re visible"
        description={
          listing.side === "out"
            ? "The City can see that you need someone."
            : "Relevant matches can now see your availability."
        }
        crumbs={[
          { label: "Media & Technology", href: "/media-technology" },
          { label: "Availability" },
        ]}
      />
      <div className="mt-8 space-y-6">
        <VaelStatePanel
          kind={vaelKind === "expiring" ? "expiring" : listing.side === "out" ? "out" : "in"}
          hoursLeft={hours}
          side={listing.side}
        />
        <p className="text-body">
          {[listing.category || listing.discipline, "Media & Technology"].filter(Boolean).join(" · ")}
        </p>
        <p className="text-body text-muted">{hours} hours remaining on this device.</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/media-technology/board" className={buttonClassName({ size: "lg" })}>
          View matches
        </Link>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            clearListing();
            navigate("/media-technology/vael?create=1");
          }}
        >
          End availability
        </Button>
      </div>
    </CityPage>
  );
}
