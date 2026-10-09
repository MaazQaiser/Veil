import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { TagField, splitTags } from "@/components/ui/tags";
import {
  IconBriefcase,
  IconClock,
  IconDocument,
  IconEdit,
  IconGrid,
  IconImage,
  IconLock,
  IconMapPin,
  IconUser,
} from "@/components/ui/icons";
import { DocumentCard } from "@/components/vael";
import { PortfolioEditor, ProfilePhotoField } from "@/components/vael/profileForm";
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
import { DOC_TYPE_LABELS } from "@/lib/profileFields";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import {
  DOC_TYPES,
  M_T_BUDGET,
  M_T_CATEGORIES,
  M_T_DISCIPLINES,
  M_T_ENGAGEMENTS,
  M_T_TIMING,
  capabilityOptions,
  certificationOptions,
  type ProfileDocument,
  type ProfileRecord,
} from "@/lib/vaelStore";
import { CardChips, JoinFieldCard, JoinFooterBar, JoinHead } from "./JoinLayout";
import { useJoinProfile } from "./useJoinProfile";

type DocType = ProfileDocument["type"];

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
  const [timing, setTiming] = useState(saved?.timing || M_T_TIMING[0]);
  const [engagement, setEngagement] = useState(saved?.engagement || M_T_ENGAGEMENTS[0]);
  const [budgetProxy, setBudgetProxy] = useState(saved?.budgetProxy || M_T_BUDGET[0]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [docType, setDocType] = useState<DocType>("license");

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
    const when = extras.timing ?? timing;
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
        timing: when,
        experienceYears: next.experienceYears != null ? String(next.experienceYears) : "",
        engagement: extras.engagement ?? engagement,
        budgetProxy: extras.budgetProxy ?? budgetProxy,
        description: next.bio,
        requirements: next.credentials,
        contact: "",
        timeline: when,
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
    if (!form.headline.trim()) {
      setError("Say what you're hiring for.");
      return;
    }
    if (!form.bio.trim()) {
      setError("Add one line about what you need.");
      return;
    }
    if (form.profileType === "business" && !form.displayName.trim()) {
      setError("Add your organization's name.");
      return;
    }
    setError("");
    go(
      "need",
      apply({
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        profileType: form.profileType,
        displayName: form.displayName.trim(),
      }),
    );
  }

  function onWho(event: FormEvent) {
    event.preventDefault();
    const discipline = form.disciplines[0] ?? "";
    if (!discipline) {
      setError("Choose a discipline so VAEL knows where you fit.");
      return;
    }
    if (form.skills.length === 0) {
      setError("Add at least one capability to become visible to relevant matches.");
      return;
    }
    setError("");
    go("who", apply({ disciplines: [discipline], skills: form.skills }));
  }

  function onLocation(event: FormEvent) {
    event.preventDefault();
    if (!form.location.trim()) {
      setError("Add the location you work from.");
      return;
    }
    setError("");
    go(
      "location",
      apply({
        location: form.location.trim(),
        workPreference: form.workPreference ?? "remote",
      }),
    );
  }

  function onRequirements(event: FormEvent) {
    event.preventDefault();
    setError("");
    go("requirements", apply({ credentials: form.credentials }));
  }

  function onTiming(event: FormEvent) {
    event.preventDefault();
    setError("");
    go("timing", apply({ experienceYears: form.experienceYears }));
  }

  function onDetails(event: FormEvent) {
    event.preventDefault();
    setError("");
    go("details", apply({ tools: form.tools ?? [], portfolio: form.portfolio }));
  }

  function onSubmit() {
    const profile = apply({
      headline: form.headline.trim(),
      bio: form.bio.trim(),
      location: form.location.trim(),
      workPreference: form.workPreference ?? "remote",
      disciplines: form.disciplines[0] ? [form.disciplines[0]] : [],
    });
    if (!profile.headline || !profile.bio) {
      patchOnboarding(session.handle, { intent: "out", outStep: "need" });
      navigate(vaelOutPath("need"));
      return;
    }
    if (!profile.disciplines[0] || profile.skills.length === 0) {
      patchOnboarding(session.handle, { intent: "out", outStep: "who" });
      navigate(vaelOutPath("who"));
      return;
    }
    if (!profile.location.trim()) {
      patchOnboarding(session.handle, { intent: "out", outStep: "location" });
      navigate(vaelOutPath("location"));
      return;
    }
    setSaving(true);
    try {
      remember(profile);
      const draft = loadDemoDraft(session.handle);
      vael.saveListing({
        handle: session.handle,
        side: "out",
        category: draft?.category || profile.disciplines[0],
        discipline: profile.disciplines[0],
        skills: profile.skills,
        tools: profile.tools ?? [],
        certifications: splitTags(draft?.certifications ?? ""),
        location: profile.location,
        remoteOnsite: profile.workPreference || "remote",
        timing: draft?.timing || M_T_TIMING[0],
        experienceYears: profile.experienceYears ?? 0,
        engagement: draft?.engagement || M_T_ENGAGEMENTS[0],
        budgetProxy: draft?.budgetProxy || M_T_BUDGET[0],
        description: profile.bio,
        requirements: profile.credentials,
        contact: "",
        timeline: draft?.timing || M_T_TIMING[0],
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

  return (
    <div className="mx-auto w-full max-w-2xl">
      {step === "need" ? (
        <StepForm
          title="What I need"
          lede="Say what you're hiring for, then describe the work."
          error={error}
          onSubmit={onNeed}
        >
          <JoinFieldCard icon={<IconUser />} title="Who's hiring?" hint="Individual or on behalf of an organization.">
            <Field label="Who's hiring?" htmlFor="profileType">
              <Select
                id="profileType"
                value={form.profileType === "studio" ? "business" : form.profileType}
                onChange={(event) => set("profileType", event.target.value as ProfileRecord["profileType"])}
              >
                <option value="individual">Individual</option>
                <option value="business">Organization</option>
              </Select>
            </Field>
            {form.profileType === "business" ? (
              <Field label="Organization name" htmlFor="orgName" required className="mt-4">
                <Input
                  id="orgName"
                  placeholder="Acme Studios"
                  value={form.displayName}
                  onChange={(event) => set("displayName", event.target.value)}
                />
              </Field>
            ) : null}
          </JoinFieldCard>
          <JoinFieldCard icon={<IconBriefcase />} title="What are you hiring for?" badge="Required" hint="The role or need, in a few words.">
            <Field label="What are you hiring for?" htmlFor="headline" required>
              <Input
                id="headline"
                placeholder="Creative Director"
                value={form.headline}
                onChange={(event) => set("headline", event.target.value)}
              />
            </Field>
          </JoinFieldCard>
          <JoinFieldCard
            icon={<IconDocument />}
            title="Describe what you need"
            badge="Required"
            hint="One line. Matches see this."
          >
            <Field label="Describe what you need" htmlFor="about" required>
              <Textarea id="about" rows={3} value={form.bio} onChange={(event) => set("bio", event.target.value)} />
            </Field>
          </JoinFieldCard>
        </StepForm>
      ) : null}

      {step === "who" ? (
        <StepForm
          title="Who I’m looking for"
          lede="Describe the capability you are looking for."
          error={error}
          onSubmit={onWho}
        >
          <JoinFieldCard icon={<IconUser />} title="Discipline" badge="Required">
            <Field label="Discipline" htmlFor="discipline" required>
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
          </JoinFieldCard>
          <JoinFieldCard icon={<IconBriefcase />} title="Category" hint="Optional. The kind of person or studio.">
            <Field label="Category" htmlFor="category">
              <Select id="category" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Not specified</option>
                {M_T_CATEGORIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
          </JoinFieldCard>
          <JoinFieldCard icon={<IconGrid />} title="Skills" badge="Required">
            <TagField
              id="skills"
              label="Skills"
              values={form.skills}
              options={capabilityOptions("skills")}
              placeholder="Search or add a skill"
              onChange={(next) => set("skills", next)}
            />
          </JoinFieldCard>
        </StepForm>
      ) : null}

      {step === "location" ? (
        <StepForm title="Location" lede="Where the work is based, or where you need someone." error={error} onSubmit={onLocation}>
          <JoinFieldCard icon={<IconMapPin />} title="Work preference">
            <Field label="Work preference" htmlFor="remote">
              <Select
                id="remote"
                value={form.workPreference ?? "remote"}
                onChange={(event) => set("workPreference", event.target.value as ProfileRecord["workPreference"])}
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </Select>
            </Field>
          </JoinFieldCard>
          <JoinFieldCard icon={<IconMapPin />} title="Location" badge="Required">
            <Field label="Location" htmlFor="location" required>
              <Input id="location" value={form.location} onChange={(event) => set("location", event.target.value)} />
            </Field>
          </JoinFieldCard>
        </StepForm>
      ) : null}

      {step === "requirements" ? (
        <StepForm
          title="Requirements"
          lede="Skills or certifications the person you hire should have. Optional."
          error={error}
          onSubmit={onRequirements}
        >
          <JoinFieldCard icon={<IconLock />} title="Requirements" hint="Optional.">
            <TagField
              id="requirements"
              label="Add requirements"
              values={splitTags(form.credentials)}
              options={capabilityOptions("skills")}
              placeholder="Search or add a requirement"
              onChange={(next) => set("credentials", next.join(", "))}
            />
          </JoinFieldCard>
          <JoinFieldCard icon={<IconLock />} title="Certifications" hint="Optional.">
            <TagField
              id="certs"
              label="Certifications"
              values={splitTags(certifications)}
              options={certificationOptions()}
              placeholder="Search or add a certification"
              onChange={(next) => setCertifications(next.join(", "))}
            />
          </JoinFieldCard>
        </StepForm>
      ) : null}

      {step === "timing" ? (
        <StepForm title="Timing / availability" lede="When do you need someone?" error={error} onSubmit={onTiming}>
          <JoinFieldCard icon={<IconClock />} title="Timing">
            <Field label="Timing" htmlFor="timing">
              <Select id="timing" value={timing} onChange={(event) => setTiming(event.target.value)}>
                {M_T_TIMING.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
          </JoinFieldCard>
          <JoinFieldCard icon={<IconClock />} title="Experience (years)" hint="Carried over from your profile.">
            <Field label="Experience (years)" htmlFor="exp">
              <Input
                id="exp"
                inputMode="numeric"
                value={form.experienceYears ?? ""}
                onChange={(event) =>
                  set("experienceYears", event.target.value === "" ? undefined : Number(event.target.value))
                }
              />
            </Field>
          </JoinFieldCard>
        </StepForm>
      ) : null}

      {step === "details" ? (
        <StepForm
          title="Additional details"
          lede="Optional. Helps VAEL place you more precisely."
          error={error}
          onSubmit={onDetails}
        >
          <JoinFieldCard icon={<IconGrid />} title="Tools">
            <TagField
              id="tools"
              label="Tools"
              values={form.tools ?? []}
              options={capabilityOptions("tools")}
              placeholder="Search or add a tool"
              onChange={(next) => set("tools", next)}
            />
          </JoinFieldCard>
          <JoinFieldCard icon={<IconBriefcase />} title="Engagement">
            <Field label="Engagement" htmlFor="eng">
              <Select id="eng" value={engagement} onChange={(event) => setEngagement(event.target.value)}>
                {M_T_ENGAGEMENTS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
          </JoinFieldCard>
          <JoinFieldCard icon={<IconBriefcase />} title="Budget proxy">
            <Field label="Budget proxy" htmlFor="budget">
              <Select id="budget" value={budgetProxy} onChange={(event) => setBudgetProxy(event.target.value)}>
                {M_T_BUDGET.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
          </JoinFieldCard>
          <JoinFieldCard icon={<IconDocument />} title="Links" hint="Company website, job post, or a brief. Optional.">
            <PortfolioEditor items={form.portfolio} onChange={(next) => set("portfolio", next)} />
          </JoinFieldCard>
          <JoinFieldCard icon={<IconDocument />} title="Documents" hint="Job brief, scope of work, or a spec — held on this device.">
            <div className="flex flex-col gap-3">
              <Field label="Document type" htmlFor="doc-type">
                <Select id="doc-type" value={docType} onChange={(event) => setDocType(event.target.value as DocType)}>
                  {DOC_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {DOC_TYPE_LABELS[type]}
                    </option>
                  ))}
                </Select>
              </Field>
              <input
                aria-label="Add document"
                type="file"
                className="block text-body-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    vael.uploadDocument({
                      handle: session.handle,
                      type: docType,
                      title: file.name,
                      publicFlag: false,
                      dataUrl: String(reader.result),
                    });
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {vael.documents(session.handle).length > 0 ? (
                <ul className="mt-2 space-y-3">
                  {vael.documents(session.handle).map((doc) => (
                    <li key={doc.id}>
                      <DocumentCard title={doc.title} type={doc.type} status={doc.publicFlag ? "public" : "uploaded"} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </JoinFieldCard>
          <JoinFieldCard icon={<IconImage />} title="Photo" hint="The same picture on your profile.">
            <ProfilePhotoField
              name={form.displayName}
              src={form.avatarUrl}
              coverSrc={form.coverUrl}
              onChange={(dataUrl) => {
                const next = apply({ avatarUrl: dataUrl });
                persist(next);
              }}
              onCoverChange={(dataUrl) => {
                const next = apply({ coverUrl: dataUrl });
                persist(next);
              }}
            />
          </JoinFieldCard>
        </StepForm>
      ) : null}

      {step === "review" ? (
        <Review
          form={form}
          category={category}
          certifications={certifications}
          timing={timing}
          engagement={engagement}
          budgetProxy={budgetProxy}
          documents={vael.documents(session.handle)}
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
  certifications,
  timing,
  engagement,
  budgetProxy,
  documents,
  error,
  saving,
  onSubmit,
}: {
  form: ProfileRecord;
  category: string;
  certifications: string;
  timing: string;
  engagement: string;
  budgetProxy: string;
  documents: ProfileDocument[];
  error: string;
  saving: boolean;
  onSubmit: () => void;
}) {
  const certs = splitTags(certifications);
  const requirements = splitTags(form.credentials);
  const links = (form.portfolio ?? []).filter((item) => item.url);
  const firstName = form.displayName.split(" ")[0] || form.displayName;

  return (
    <>
      <JoinHead title="Review" lede="Edit any section below, then post when you're ready." center />
      <div className="mt-8 rounded-lg border border-[#DE7C40]/25 bg-[#141414] p-6 sm:p-7">
        <h2 className="text-h4 font-medium text-white">Ready to post, {firstName}!</h2>
        <p className="mt-2 max-w-md text-body-sm text-white/70">
          This is the request matches will see. You can change any section before you Vael Out.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <SectionCard title="What I need" editTo={vaelOutPath("need")} editLabel="Edit what I need">
          <ReviewRow label="Hiring as" value={form.profileType === "business" ? "Organization" : "Individual"} />
          {form.profileType === "business" ? (
            <ReviewRow label="Organization name" value={form.displayName} />
          ) : null}
          <ReviewRow label="Hiring for" value={form.headline} />
          <div className="border-t border-border-subtle pt-3">
            <p className="text-body-sm text-muted">Description</p>
            <p className="mt-1.5 text-body-sm leading-relaxed text-foreground">{form.bio || "Not added yet."}</p>
          </div>
        </SectionCard>
        <SectionCard title="Who I’m looking for" editTo={vaelOutPath("who")} editLabel="Edit who I’m looking for">
          <ReviewRow label="Discipline" value={form.disciplines[0] ?? ""} />
          <ReviewRow label="Category" value={category} />
          {form.skills.length > 0 ? (
            <div className="mt-3">
              <CardChips items={form.skills} />
            </div>
          ) : (
            <ReviewRow label="Skills" value="" />
          )}
        </SectionCard>
        <SectionCard title="Location" editTo={vaelOutPath("location")} editLabel="Edit location">
          <ReviewRow label="Work preference" value={workLabel(form.workPreference)} />
          <ReviewRow label="Location" value={form.location} />
        </SectionCard>
        <SectionCard title="Requirements" editTo={vaelOutPath("requirements")} editLabel="Edit requirements">
          {requirements.length > 0 ? <CardChips items={requirements} /> : <p className="text-body-sm text-quiet">Not added yet.</p>}
          {certs.length > 0 ? (
            <div className="mt-3">
              <p className="mb-2 text-body-sm text-muted">Certifications</p>
              <CardChips items={certs} />
            </div>
          ) : null}
        </SectionCard>
        <SectionCard title="Timing / availability" editTo={vaelOutPath("timing")} editLabel="Edit timing">
          <ReviewRow label="Timing" value={timing} />
          <ReviewRow
            label="Experience (years)"
            value={form.experienceYears != null && form.experienceYears !== 0 ? String(form.experienceYears) : ""}
          />
        </SectionCard>
        <SectionCard title="Additional details" editTo={vaelOutPath("details")} editLabel="Edit additional details">
          {(form.tools ?? []).length > 0 ? (
            <div className="mb-3">
              <p className="mb-2 text-body-sm text-muted">Tools</p>
              <CardChips items={form.tools} />
            </div>
          ) : null}
          <ReviewRow label="Engagement" value={engagement} />
          <ReviewRow label="Budget proxy" value={budgetProxy} />
          {links.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-body-sm">
              {links.map((item) => (
                <li key={item.url}>
                  <span className="text-foreground">{item.label || item.url}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {documents.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <DocumentCard title={doc.title} type={doc.type} status={doc.publicFlag ? "public" : "uploaded"} />
                </li>
              ))}
            </ul>
          ) : null}
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
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#DE7C40]/40 text-[#F2BA8B] motion-safe:transition-colors motion-safe:duration-150 hover:bg-[#DE7C40]/15"
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
