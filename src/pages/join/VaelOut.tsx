import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { TagField, splitTags } from "@/components/ui/tags";
import { IconEdit } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useCitySession } from "@/lib/citySession";
import { clearDemoDraft, loadDemoDraft, saveDemoDraft, type DemoDraft } from "@/lib/demoJourney";
import {
  VAEL_OUT_STEPS,
  finishOnboarding,
  getOnboardingDraft,
  isVaelOutStep,
  patchOnboarding,
  vaelOutNext,
  vaelOutPath,
  type VaelOutStep,
} from "@/lib/onboarding";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import {
  M_T_CATEGORIES,
  M_T_DISCIPLINES,
  M_T_ENGAGEMENTS,
  M_T_TIMING,
  capabilityOptions,
  certificationOptions,
  type ProfileRecord,
} from "@/lib/vaelStore";
import { CardChips, JoinFooterBar, JoinHead } from "./JoinLayout";
import { useJoinProfile } from "./useJoinProfile";

const TIMELINES = ["Under a week", "1–4 weeks", "1–3 months", "3+ months", "Ongoing"];
const TEAM_SIZES = ["Just me", "2–5 people", "6–15 people", "16+ people"];
const EXPERIENCE_LEVELS = [
  { label: "Less than 1 year", years: 0 },
  { label: "1–3 Years", years: 2 },
  { label: "3–5 Years", years: 4 },
  { label: "5–10 Years", years: 7 },
  { label: "10+ Years", years: 10 },
];

function experienceBucket(years: number | undefined) {
  if (years === undefined) return "";
  if (years < 1) return "Less than 1 year";
  if (years <= 3) return "1–3 Years";
  if (years <= 5) return "3–5 Years";
  if (years <= 10) return "5–10 Years";
  return "10+ Years";
}

function startDateFor(label: "Today" | "Tomorrow" | "Next Monday") {
  const date = new Date();
  if (label === "Tomorrow") date.setDate(date.getDate() + 1);
  if (label === "Next Monday") date.setDate(date.getDate() + (((8 - date.getDay()) % 7) || 7));
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Why "The work" is not complete yet, or "" when it is. */
function needProblem(form: ProfileRecord, category: string) {
  if (!form.headline.trim()) return "Add a title for the work.";
  if (!form.disciplines[0]) return "Choose the discipline you need.";
  if (!category) return "Choose the type of work.";
  if (form.bio.trim().length < 20) return "Describe the work in at least 20 characters.";
  return "";
}

/** Why "When & where" is not complete yet, or "" when it is. */
function whenWhereProblem(form: ProfileRecord, engagement: string, timeline: string, budget: string) {
  if (!engagement) return "Choose the engagement type.";
  if (!form.workPreference) return "Choose remote, onsite or hybrid.";
  if (!form.location.trim()) return "Add the location of the work.";
  if (!timeline) return "Choose a timeline.";
  if (!budget.trim()) return "Add a budget, rate or pay.";
  return "";
}

function FormCard({ children }: { children: ReactNode }) {
  return <div className="space-y-5 rounded-lg border border-border bg-surface p-6 sm:p-7">{children}</div>;
}

function NextHint({ children }: { children: ReactNode }) {
  return <p className="text-body-sm italic text-quiet">{children}</p>;
}

export function VaelOutStepPage() {
  const { step: raw } = useParams();
  const { session } = useCitySession();
  const draft = getOnboardingDraft(session.handle);
  const reached = draft?.outStep && isVaelOutStep(draft.outStep) ? draft.outStep : "need";
  const step = raw && isVaelOutStep(raw) ? raw : null;
  if (!step || VAEL_OUT_STEPS.indexOf(step) > VAEL_OUT_STEPS.indexOf(reached)) {
    return <Navigate to={vaelOutPath(reached)} replace />;
  }
  return <VaelOutForm step={step} />;
}

function VaelOutForm({ step }: { step: VaelOutStep }) {
  const { session, vael, form, set, persist } = useJoinProfile();
  const { setVael } = useCitySession();
  const navigate = useNavigate();
  const saved = loadDemoDraft(session.handle);
  const [category, setCategory] = useState(saved?.category ?? "");
  const [certifications, setCertifications] = useState(saved?.certifications ?? "");
  const [timing, setTiming] = useState(saved?.timing ?? "");
  const [timeline, setTimeline] = useState(saved?.timeline && TIMELINES.includes(saved.timeline) ? saved.timeline : "");
  const [engagement, setEngagement] = useState(saved?.engagement ?? "");
  const [budgetText, setBudgetText] = useState(saved?.budgetProxy ?? "");
  const [preferredSkills, setPreferredSkills] = useState<string[]>(saved?.preferredSkills ?? []);
  const [neededToday, setNeededToday] = useState<boolean | null>(saved?.neededToday ?? null);
  const [startDate, setStartDate] = useState(saved?.startDate ?? "");
  const [teamSize, setTeamSize] = useState(saved?.teamSize ?? "");
  const [deliverables, setDeliverables] = useState<string[]>(saved?.deliverables ?? []);
  const [deliverableInput, setDeliverableInput] = useState("");
  const [samplesWanted, setSamplesWanted] = useState(saved?.samplesWanted ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function apply(patch: Partial<ProfileRecord>) {
    const next = { ...form, ...patch };
    (Object.keys(patch) as Array<keyof ProfileRecord>).forEach((key) => {
      set(key, next[key]);
    });
    return next;
  }

  function remember(next: ProfileRecord, extras: Partial<DemoDraft> = {}) {
    persist(next);
    const remote = next.workPreference ?? saved?.remoteOnsite ?? "remote";
    saveDemoDraft(
      {
        side: "out",
        category: extras.category ?? category,
        discipline: next.disciplines[0] ?? "",
        skills: (next.skills ?? []).join(", "),
        tools: (next.tools ?? []).join(", "),
        certifications: extras.certifications ?? certifications,
        location: next.location,
        remoteOnsite: remote,
        timing: extras.timing ?? timing,
        experienceYears: next.experienceYears != null ? String(next.experienceYears) : "",
        engagement: extras.engagement ?? engagement,
        budgetProxy: extras.budgetProxy ?? budgetText,
        description: next.bio,
        requirements: next.credentials,
        contact: "",
        timeline: extras.timeline ?? timeline,
        preferredSkills: extras.preferredSkills ?? preferredSkills,
        neededToday: extras.neededToday ?? neededToday ?? undefined,
        startDate: extras.startDate ?? startDate,
        teamSize: extras.teamSize ?? teamSize,
        deliverables: extras.deliverables ?? deliverables,
        samplesWanted: extras.samplesWanted ?? samplesWanted,
      },
      session.handle,
    );
  }

  function go(from: VaelOutStep, next: ProfileRecord = form) {
    remember(next);
    const draft = getOnboardingDraft(session.handle);
    const reached = draft?.outStep && isVaelOutStep(draft.outStep) ? draft.outStep : "need";
    if (VAEL_OUT_STEPS.indexOf(reached) >= VAEL_OUT_STEPS.indexOf("review") && from !== "review") {
      navigate(vaelOutPath("review"));
      return;
    }
    const following = vaelOutNext(from);
    if (following === "submitted") return;
    patchOnboarding(session.handle, { intent: "out", outStep: following });
    navigate(vaelOutPath(following));
  }

  function onNeed(event: FormEvent) {
    event.preventDefault();
    const problem = needProblem(form, category);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    go(
      "need",
      apply({
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        disciplines: [form.disciplines[0]],
      }),
    );
  }

  function onWho(event: FormEvent) {
    event.preventDefault();
    setError("");
    // Credentials and certifications are one list here, kept in both places for matching.
    go("who", apply({ skills: form.skills, tools: form.tools ?? [], credentials: form.credentials, experienceYears: form.experienceYears }));
  }

  function onLocation(event: FormEvent) {
    event.preventDefault();
    const problem = whenWhereProblem(form, engagement, timeline, budgetText);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    go("location", apply({ location: form.location.trim(), workPreference: form.workPreference }));
  }

  function onExtras(event: FormEvent) {
    event.preventDefault();
    setError("");
    go("extras");
  }

  function addDeliverable() {
    const value = deliverableInput.trim().slice(0, 80);
    if (!value || deliverables.length >= 10 || deliverables.includes(value)) return;
    setDeliverables([...deliverables, value]);
    setDeliverableInput("");
  }

  function onSubmit() {
    const profile = apply({
      headline: form.headline.trim(),
      bio: form.bio.trim(),
      location: form.location.trim(),
      disciplines: form.disciplines[0] ? [form.disciplines[0]] : [],
    });
    if (needProblem(profile, category)) {
      patchOnboarding(session.handle, { intent: "out", outStep: "need" });
      navigate(vaelOutPath("need"));
      return;
    }
    if (whenWhereProblem(profile, engagement, timeline, budgetText)) {
      patchOnboarding(session.handle, { intent: "out", outStep: "location" });
      navigate(vaelOutPath("location"));
      return;
    }
    setSaving(true);
    try {
      remember(profile);
      vael.saveListing({
        handle: session.handle,
        side: "out",
        category,
        discipline: profile.disciplines[0],
        skills: profile.skills,
        tools: profile.tools ?? [],
        certifications: splitTags(certifications),
        location: profile.location,
        remoteOnsite: profile.workPreference || "remote",
        timing: timing || M_T_TIMING[0],
        experienceYears: profile.experienceYears ?? 0,
        engagement,
        budgetProxy: budgetText.trim(),
        description: profile.bio,
        requirements: profile.credentials,
        contact: "",
        timeline,
        preferredSkills,
        neededToday: neededToday ?? false,
        startDate,
        teamSize,
        deliverables,
        samplesWanted: samplesWanted.trim(),
      });
      setVael("out");
      clearDemoDraft(session.handle);
      finishOnboarding(session.handle);
      patchOnboarding(session.handle, { intent: "out", outStep: "submitted" });
      try {
        sessionStorage.setItem("vael_show_welcome", "1");
      } catch {
        /* ignore */
      }
      navigate(PRODUCT_HOME, { replace: true });
    } catch {
      setSaving(false);
      setError("The VAEL could not be stored on this device.");
    }
  }

  const descriptionLeft = Math.max(0, 20 - form.bio.trim().length);

  return (
    <div className="mx-auto w-full max-w-2xl">
      {step === "need" ? (
        <StepForm title="The work" lede="Name what you need and describe the work." error={error} onSubmit={onNeed}>
          <FormCard>
            <Field label="Title" htmlFor="headline" required>
              <Input
                id="headline"
                placeholder="e.g. Lead video editor for a docuseries"
                value={form.headline}
                onChange={(event) => set("headline", event.target.value)}
              />
            </Field>
            <Field label="Discipline needed" htmlFor="discipline" required>
              <Select
                id="discipline"
                value={form.disciplines[0] ?? ""}
                onChange={(event) => set("disciplines", event.target.value ? [event.target.value] : [])}
              >
                <option value="">Choose a discipline</option>
                {M_T_DISCIPLINES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Type of work" htmlFor="category" required hint="The kind of person or studio you need.">
              <Select id="category" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Select…</option>
                {M_T_CATEGORIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field
              label="Description"
              htmlFor="about"
              required
              hint={descriptionLeft > 0 ? `At least 20 characters — ${descriptionLeft} to go.` : `${form.bio.trim().length} characters`}
            >
              <Textarea
                id="about"
                rows={6}
                placeholder="Scope, goals, and what a good outcome looks like…"
                value={form.bio}
                onChange={(event) => set("bio", event.target.value)}
              />
            </Field>
            <NextHint>Next: the skills, tools and credentials you need</NextHint>
          </FormCard>
        </StepForm>
      ) : null}

      {step === "who" ? (
        <StepForm
          title="Skills, tools & credentials"
          lede="Used to score matches on the board — leave anything blank if you have no preference."
          error={error}
          onSubmit={onWho}
        >
          <FormCard>
            <TagField
              id="skills"
              label="Required skills"
              values={form.skills}
              options={capabilityOptions("skills")}
              placeholder="Search or add a skill"
              onChange={(next) => set("skills", next)}
            />
            <TagField
              id="preferred-skills"
              label="Preferred skills (nice to have)"
              values={preferredSkills}
              options={capabilityOptions("skills")}
              placeholder="Search or add a skill"
              onChange={setPreferredSkills}
            />
            <TagField
              id="tools"
              label="Tools, platforms & software"
              values={form.tools ?? []}
              options={capabilityOptions("tools")}
              placeholder="Search or add a tool"
              onChange={(next) => set("tools", next)}
            />
            <TagField
              id="credentials"
              label="Credentials"
              values={splitTags(form.credentials)}
              options={certificationOptions()}
              placeholder="Search or add a credential"
              onChange={(next) => {
                set("credentials", next.join(", "));
                setCertifications(next.join(", "));
              }}
            />
            <Field label="Experience level (optional)" htmlFor="exp-level">
              <Select
                id="exp-level"
                value={experienceBucket(form.experienceYears)}
                onChange={(event) => set("experienceYears", EXPERIENCE_LEVELS.find((item) => item.label === event.target.value)?.years)}
              >
                <option value="">Any</option>
                {EXPERIENCE_LEVELS.map((item) => (
                  <option key={item.label}>{item.label}</option>
                ))}
              </Select>
            </Field>
            <NextHint>Next: when and where, and what it pays</NextHint>
          </FormCard>
        </StepForm>
      ) : null}

      {step === "location" ? (
        <StepForm title="When & where" lede="Where and when the work happens, and what it pays." error={error} onSubmit={onLocation}>
          <FormCard>
            <Field label="Engagement type" htmlFor="eng" required>
              <Select id="eng" value={engagement} onChange={(event) => setEngagement(event.target.value)}>
                <option value="">Select…</option>
                {M_T_ENGAGEMENTS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Remote / onsite / hybrid" htmlFor="remote" required>
              <Select
                id="remote"
                value={form.workPreference ?? ""}
                onChange={(event) => set("workPreference", (event.target.value || undefined) as ProfileRecord["workPreference"])}
              >
                <option value="">Select…</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </Select>
            </Field>
            <Field label="Location" htmlFor="location" required>
              <Input
                id="location"
                placeholder="City or area"
                value={form.location}
                onChange={(event) => set("location", event.target.value)}
              />
            </Field>
            <div>
              <p className="text-label font-medium text-foreground">Needed today?</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {([true, false] as const).map((value) => (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={neededToday === value}
                    onClick={() => setNeededToday(value)}
                    className={cn(
                      "h-12 border bg-transparent text-body-sm font-medium motion-safe:transition-colors",
                      neededToday === value ? "border-[#EE8A4A] bg-[#EE8A4A]/[0.1] text-foreground" : "border-border text-muted hover:border-[#EE8A4A]/50",
                    )}
                  >
                    {value ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Start date" htmlFor="start" hint="Optional when it's needed today.">
              <Input id="start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              <div className="mt-2 flex flex-wrap gap-2">
                {(["Today", "Tomorrow", "Next Monday"] as const).map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStartDate(startDateFor(label))}
                    className="h-9 rounded-full border border-border px-4 text-caption text-muted motion-safe:transition-colors hover:border-[#EE8A4A]/50 hover:text-foreground"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Availability needed" htmlFor="timing" hint="Optional. Used to score matches.">
              <Select id="timing" value={timing} onChange={(event) => setTiming(event.target.value)}>
                <option value="">Select…</option>
                {M_T_TIMING.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Timeline" htmlFor="timeline" required hint="How long the work runs, or how soon it has to move.">
              <Select id="timeline" value={timeline} onChange={(event) => setTimeline(event.target.value)}>
                <option value="">Select…</option>
                {TIMELINES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Budget, rate or pay" htmlFor="budget" required>
              <Input
                id="budget"
                placeholder="e.g. $5,000 project, or $75–100/hr"
                value={budgetText}
                onChange={(event) => setBudgetText(event.target.value)}
              />
            </Field>
            <NextHint>Next: a few optional extras</NextHint>
          </FormCard>
        </StepForm>
      ) : null}

      {step === "extras" ? (
        <StepForm title="Extras" lede="All optional — add what helps the right people say yes." error={error} onSubmit={onExtras}>
          <FormCard>
            <Field label="Team size" htmlFor="team">
              <Select id="team" value={teamSize} onChange={(event) => setTeamSize(event.target.value)}>
                <option value="">Select…</option>
                {TEAM_SIZES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Deliverables" htmlFor="deliverable" hint={`${deliverables.length} of 10 · up to 80 characters each`}>
              <div className="flex gap-3">
                <Input
                  id="deliverable"
                  placeholder="Type one and press Enter"
                  maxLength={80}
                  value={deliverableInput}
                  onChange={(event) => setDeliverableInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addDeliverable();
                    }
                  }}
                />
                <Button type="button" variant="outline" className="shrink-0 rounded-full px-5" onClick={addDeliverable}>
                  Add
                </Button>
              </div>
              {deliverables.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {deliverables.map((item) => (
                    <li key={item} className="inline-flex items-center gap-2 rounded-full bg-[#EE8A4A]/15 px-3 py-1 text-caption text-[#F2BA8B]">
                      {item}
                      <button
                        type="button"
                        aria-label={`Remove ${item}`}
                        onClick={() => setDeliverables(deliverables.filter((entry) => entry !== item))}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Field>
            <Field label="Work samples or references wanted" htmlFor="samples">
              <Textarea
                id="samples"
                rows={4}
                placeholder="What should people show you before you talk?"
                value={samplesWanted}
                onChange={(event) => setSamplesWanted(event.target.value)}
              />
            </Field>
            <NextHint>Next: review and post</NextHint>
          </FormCard>
        </StepForm>
      ) : null}

      {step === "review" ? (
        <Review
          form={form}
          category={category}
          timing={timing}
          timeline={timeline}
          engagement={engagement}
          budget={budgetText}
          preferredSkills={preferredSkills}
          neededToday={neededToday}
          startDate={startDate}
          teamSize={teamSize}
          deliverables={deliverables}
          samplesWanted={samplesWanted}
          error={error}
          saving={saving}
          onSubmit={onSubmit}
        />
      ) : null}
    </div>
  );
}

function StepForm({
  title,
  lede,
  error,
  onSubmit,
  children,
}: {
  title: string;
  lede: string;
  error: string;
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <>
      <JoinHead title={title} lede={lede} center />
      <form className="mt-10 space-y-5" onSubmit={onSubmit} noValidate>
        {children}
        {error ? (
          <p role="alert" className="text-label text-destructive">
            {error}
          </p>
        ) : null}
        <JoinFooterBar>
          <Button type="submit" size="lg" className="rounded-lg px-10">
            Continue
          </Button>
        </JoinFooterBar>
      </form>
    </>
  );
}

function workLabel(value: string | undefined) {
  if (value === "onsite") return "On-site";
  if (value === "hybrid") return "Hybrid";
  if (value === "remote") return "Remote";
  return "Not added yet.";
}

function Review({
  form,
  category,
  timing,
  timeline,
  engagement,
  budget,
  preferredSkills,
  neededToday,
  startDate,
  teamSize,
  deliverables,
  samplesWanted,
  error,
  saving,
  onSubmit,
}: {
  form: ProfileRecord;
  category: string;
  timing: string;
  timeline: string;
  engagement: string;
  budget: string;
  preferredSkills: string[];
  neededToday: boolean | null;
  startDate: string;
  teamSize: string;
  deliverables: string[];
  samplesWanted: string;
  error: string;
  saving: boolean;
  onSubmit: () => void;
}) {
  const credentials = splitTags(form.credentials);
  const firstName = form.displayName.split(" ")[0] || form.displayName;

  return (
    <>
      <JoinHead title={`Ready to post, ${firstName}!`} lede="This is the request matches will see. You can change any section before you Vael Out." center />

      <div className="mt-8 space-y-4">
        <SectionCard title="The work" editTo={vaelOutPath("need")} editLabel="Edit the work">
          <ReviewRow label="Title" value={form.headline} />
          <ReviewRow label="Discipline needed" value={form.disciplines[0] ?? ""} />
          <ReviewRow label="Type of work" value={category} />
          <div className="border-t border-border-subtle pt-3">
            <p className="text-body-sm text-muted">Description</p>
            <p className="mt-1.5 text-body-sm leading-relaxed text-foreground">{form.bio || "Not added yet."}</p>
          </div>
        </SectionCard>
        <SectionCard title="Skills, tools & credentials" editTo={vaelOutPath("who")} editLabel="Edit skills, tools and credentials">
          <ChipRow label="Required skills" items={form.skills} />
          <ChipRow label="Preferred skills" items={preferredSkills} />
          <ChipRow label="Tools, platforms & software" items={form.tools ?? []} />
          <ChipRow label="Credentials" items={credentials} />
          <ReviewRow label="Experience level" value={experienceBucket(form.experienceYears)} />
        </SectionCard>
        <SectionCard title="When & where" editTo={vaelOutPath("location")} editLabel="Edit when and where">
          <ReviewRow label="Engagement type" value={engagement} />
          <ReviewRow label="Remote / onsite / hybrid" value={workLabel(form.workPreference)} />
          <ReviewRow label="Location" value={form.location} />
          <ReviewRow label="Needed today" value={neededToday === null ? "" : neededToday ? "Yes" : "No"} />
          <ReviewRow label="Start date" value={startDate} />
          <ReviewRow label="Availability needed" value={timing} />
          <ReviewRow label="Timeline" value={timeline} />
          <ReviewRow label="Budget, rate or pay" value={budget} />
        </SectionCard>
        <SectionCard title="Extras" editTo={vaelOutPath("extras")} editLabel="Edit extras">
          <ReviewRow label="Team size" value={teamSize} />
          <ChipRow label="Deliverables" items={deliverables} />
          <ReviewRow label="Work samples wanted" value={samplesWanted} />
        </SectionCard>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-label text-destructive">
          {error}
        </p>
      ) : null}

      <JoinFooterBar>
        <Button type="button" size="lg" className="rounded-lg px-10" loading={saving} onClick={onSubmit}>
          Vael Out
        </Button>
      </JoinFooterBar>
    </>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return <ReviewRow label={label} value="" />;
  return (
    <div className="border-t border-border-subtle py-3 first:border-t-0 first:pt-0">
      <p className="mb-2 text-body-sm text-muted">{label}</p>
      <CardChips items={items} />
    </div>
  );
}

function SectionCard({
  title,
  editTo,
  editLabel,
  children,
}: {
  title: string;
  editTo: string;
  editLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body font-medium text-foreground">{title}</p>
        <Link
          to={editTo}
          aria-label={editLabel}
          title={editLabel}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#EE8A4A]/40 text-[#F2BA8B] motion-safe:transition-colors motion-safe:duration-150 hover:bg-[#EE8A4A]/15"
        >
          <IconEdit className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border-subtle py-3 first:border-t-0 first:pt-0">
      <p className="text-body-sm text-muted">{label}</p>
      <p className="max-w-[60%] text-right text-body-sm text-foreground">{value || "Not added yet."}</p>
    </div>
  );
}
