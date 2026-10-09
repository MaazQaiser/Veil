import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { RequireMember } from "@/components/mt/RequireMember";
import { useVael } from "@/lib/vaelCore";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { ALEX_VAEL_DEFAULTS, clearDemoDraft, DEMO_HANDLE, loadDemoDraft } from "@/lib/demoJourney";
import { DEFAULT_DURATION_HOURS, M_T_BUDGET, M_T_ENGAGEMENTS, M_T_TIMING, type VaelListing } from "@/lib/vaelStore";

export function VaelPage() {
  return (
    <RequireMember title="Set availability">
      <VaelInner />
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
  /** An active listing can be reopened on the same side. A different side switches the signal. */
  const managingIn = Boolean(creating && requestedSide === "in" && listing?.side === "in");
  const managingOut = Boolean(creating && requestedSide === "out" && listing?.side === "out");

  if (listing && !switchingSide && !managingIn && !managingOut) {
    return <Navigate to={PRODUCT_HOME} replace />;
  }

  const profile = ensureMine();
  const draft = loadDemoDraft(handle);
  const fallback = handle === DEMO_HANDLE ? ALEX_VAEL_DEFAULTS : BLANK_VAEL_DEFAULTS;
  /** Opens on the form — success moves back to the dashboard. */
  const [step, setStep] = useState<"form" | "saving" | "error">("form");
  const [error, setError] = useState("");
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

  /** `in` is a Provider becoming available. `out` is someone saying they need a person. */
  const available = form.side === "in";

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
    setStep("saving");
    try {
      saveListing(payload);
      clearDemoDraft(handle);
      setError("");
      navigate(PRODUCT_HOME);
    } catch {
      setError("The VAEL could not be stored on this device.");
      setStep("error");
    }
  }

  return (
    <DashboardShell>
      <form
        className="max-w-xl space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          publish();
        }}
      >
        <section className="rounded-2xl border border-border bg-white px-6 py-6 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="text-caption font-medium uppercase tracking-[0.1em] text-[#C99A28] dark:text-accent">
            You’ll be visible for
          </p>
          <p className="mt-2 font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
            {DEFAULT_DURATION_HOURS} hours
          </p>
          <p className="mt-2 text-body-sm text-muted">
            After that your VAEL ends and you stop appearing to matches. You can {available ? "Vael In" : "Vael Out"}{" "}
            again any time.
          </p>
        </section>

        {error ? (
          <p role="alert" className="text-label text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" loading={step === "saving"}>
          {available ? "Vael In" : "Vael Out"}
        </Button>
      </form>
    </DashboardShell>
  );
}
