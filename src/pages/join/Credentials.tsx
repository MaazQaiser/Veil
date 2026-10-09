import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { TagField, splitTags } from "@/components/ui/tags";
import { IconBriefcase, IconCheck, IconClock, IconDocument, IconLock, IconMapPin } from "@/components/ui/icons";
import { DocumentCard } from "@/components/vael";
import { loadDemoDraft, saveDemoDraft, type DemoDraft } from "@/lib/demoJourney";
import { completeOnboardingStep, finishOnboarding } from "@/lib/onboarding";
import { DOC_TYPE_LABELS } from "@/lib/profileFields";
import { cn } from "@/lib/cn";
import {
  capabilityOptions,
  certificationOptions,
  DOC_TYPES,
  M_T_CATEGORIES,
  M_T_ENGAGEMENTS,
  M_T_TIMING,
  type ProfileDocument,
  type ProfileRecord,
} from "@/lib/vaelStore";
import { useNavigate } from "react-router-dom";
import { useCitySession } from "@/lib/citySession";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { JoinFieldCard, JoinFooterBar, JoinHead } from "./JoinLayout";
import { useJoinProfile } from "./useJoinProfile";

type DocType = ProfileDocument["type"];

export function JoinCredentialsPage() {
  const { session, vael, intent, form, set, persist } = useJoinProfile();
  const { setVael } = useCitySession();
  const navigate = useNavigate();
  const [docType, setDocType] = useState<DocType>("license");
  const docs = vael.documents(session.handle);
  const hiring = intent === "out";

  if (intent === "in") {
    return <VaelInCapabilityPage />;
  }

  function goNext(event?: { preventDefault?: () => void }) {
    event?.preventDefault?.();
    try {
      persist();
    } catch {
      /* still leave this optional step */
    }
    completeOnboardingStep(session.handle, "Credentials");
    finishOnboarding(session.handle);
    try {
      sessionStorage.setItem("vael_show_welcome", "1");
    } catch {
      /* ignore */
    }
    navigate(PRODUCT_HOME, { replace: true });

    window.setTimeout(() => {
      try {
        const profile = vael.profile(session.handle);
        if (!profile) return;
        const side = hiring ? "out" : "in";
        const discipline =
          profile.disciplines[0] ||
          profile.headline ||
          (profile.profileType === "business" ? "Business" : "Professional");
        vael.saveListing({
          handle: session.handle,
          side,
          category: discipline,
          discipline,
          skills: profile.skills ?? [],
          tools: profile.tools ?? [],
          certifications: String(profile.credentials ?? "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          location: profile.location || "",
          remoteOnsite: profile.workPreference || "remote",
          timing: "This cycle",
          experienceYears: profile.experienceYears ?? 0,
          engagement: "Project",
          budgetProxy: "To discuss",
          description:
            profile.bio ||
            (side === "out"
              ? `${profile.displayName} is looking to hire this cycle.`
              : `${profile.displayName} is available this cycle.`),
          requirements: "",
          contact: "",
          timeline: "This cycle",
        });
        setVael(side);
      } catch {
        /* visibility can be set from the dashboard if this publish fails */
      }
    }, 0);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <JoinHead
        title={hiring ? "What are you looking for?" : "Add your credentials"}
        lede={
          hiring
            ? "Optional detail. Nothing here is required to continue."
            : "Optional proof. Nothing here is required to continue, and nothing is verified by VAEL."
        }
        center
      />
      <form className="mt-10 space-y-5" onSubmit={goNext} noValidate>
        {hiring ? (
          <JoinFieldCard icon={<IconLock />} title="Requirements" hint="Skills or certifications the person you hire should have. Optional.">
            <TagField
              id="requirements"
              label="Add requirements"
              values={splitTags(form.credentials)}
              options={capabilityOptions("skills")}
              placeholder="Search or add a requirement"
              onChange={(next) => set("credentials", next.join(", "))}
            />
          </JoinFieldCard>
        ) : (
          <JoinFieldCard icon={<IconLock />} title="Certifications" hint="Optional. Listed on this device — not verified by VAEL.">
            <TagField
              id="certs"
              label="Add certifications"
              values={splitTags(form.credentials)}
              options={certificationOptions()}
              placeholder="Search or add a certification"
              onChange={(next) => set("credentials", next.join(", "))}
            />
          </JoinFieldCard>
        )}

        <JoinFieldCard
          icon={<IconDocument />}
          title="Documents"
          hint={
            hiring
              ? "Job brief, scope of work, or a spec — held on this device."
              : "License, insurance, or a capability statement. Held on this device."
          }
        >
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
            {docs.length > 0 ? (
              <ul className="mt-2 space-y-3">
                {docs.map((doc) => (
                  <li key={doc.id}>
                    <DocumentCard title={doc.title} type={doc.type} status={doc.publicFlag ? "public" : "uploaded"} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </JoinFieldCard>

        <JoinFooterBar>
          <Button type="button" size="lg" className="rounded-lg px-10" onClick={goNext}>
            Continue
          </Button>
        </JoinFooterBar>
      </form>
    </div>
  );
}

const PARTICIPATION = [
  { id: "whole", label: "Whole project", body: "I can take the project as a whole." },
  { id: "specialty", label: "Specialty", body: "I handle a specific part of the project." },
] as const;

function availabilityTimeline(today: boolean, now: boolean) {
  return [today ? "today" : "", now ? "now" : ""].filter(Boolean).join(",");
}

function readAvailability(timeline: string | undefined) {
  const value = timeline ?? "";
  return { today: value.includes("today"), now: value.includes("now") };
}

/** VAEL IN only. Saves the profile and an unpublished availability draft. Does not go visible. */
function SquareCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 text-body text-foreground">
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border bg-transparent",
          "peer-focus-visible:shadow-[0_0_0_3px_rgba(222,124,64,0.35)]",
          checked ? "border-accent bg-accent text-[#1A1410]" : "border-foreground/40 text-transparent",
        )}
      >
        <IconCheck className="h-3.5 w-3.5" />
      </span>
      {label}
    </label>
  );
}

function VaelInCapabilityPage() {
  const { session, vael, form, persist } = useJoinProfile();
  const navigate = useNavigate();
  const business = form.profileType === "business" || form.profileType === "studio";
  const draft = loadDemoDraft(session.handle);
  const savedAvailability = readAvailability(draft?.timeline);
  const [categories, setCategories] = useState<string[]>(form.offers ?? []);
  const [participation, setParticipation] = useState(
    form.specialization === "Specialty" ? "specialty" : form.specialization === "Whole project" ? "whole" : "",
  );
  const [tools, setTools] = useState<string[]>(form.tools);
  const [certs, setCerts] = useState<string[]>(splitTags(form.credentials));
  const [gear, setGear] = useState(draft?.requirements ?? "");
  const [workPreference, setWorkPreference] = useState<ProfileRecord["workPreference"]>(
    form.workPreference ?? draft?.remoteOnsite ?? "remote",
  );
  const [serviceArea, setServiceArea] = useState(draft?.location || form.location);
  const [timing, setTiming] = useState(draft?.timing || M_T_TIMING[0]);
  const [employment, setEmployment] = useState(draft?.engagement || M_T_ENGAGEMENTS[0]);
  const [availableToday, setAvailableToday] = useState(savedAvailability.today);
  const [availableNow, setAvailableNow] = useState(savedAvailability.now);
  const [docType, setDocType] = useState<ProfileDocument["type"]>("license");
  const docs = vael.documents(session.handle);

  function onContinue(event?: { preventDefault?: () => void }) {
    event?.preventDefault?.();
    const next = {
      ...form,
      offers: categories,
      tools,
      credentials: certs.join(", "),
      workPreference,
      specialization: participation === "whole" ? "Whole project" : participation === "specialty" ? "Specialty" : "",
    };
    persist(next);
    const availability: DemoDraft = {
      side: "in",
      category: categories[0] ?? "",
      discipline: form.disciplines[0] ?? "",
      skills: form.skills.join(", "),
      tools: tools.join(", "),
      certifications: certs.join(", "),
      location: serviceArea.trim() || form.location,
      remoteOnsite: workPreference || "remote",
      timing,
      experienceYears: String(form.experienceYears ?? ""),
      engagement: employment,
      budgetProxy: "To discuss",
      description: form.bio,
      requirements: gear.trim(),
      contact: "",
      timeline: availabilityTimeline(availableToday, availableNow),
    };
    saveDemoDraft(availability, session.handle);
    completeOnboardingStep(session.handle, "Credentials");
    navigate("/join/preview");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <JoinHead
        title={business ? "What this business can do" : "What you can do"}
        lede="This stays on your account. You review it before anyone can see that you are available."
        center
      />
      <form className="mt-10 space-y-5" onSubmit={onContinue} noValidate>
        <JoinFieldCard icon={<IconBriefcase />} title="Employment type">
          <Field label="Employment type" htmlFor="employment">
            <Select id="employment" value={employment} onChange={(event) => setEmployment(event.target.value)}>
              {M_T_ENGAGEMENTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
        </JoinFieldCard>

        <JoinFieldCard icon={<IconBriefcase />} title="Project categories" hint="Types of work you take on.">
          <TagField
            id="categories"
            label="Project categories"
            values={categories}
            options={[...M_T_CATEGORIES]}
            placeholder="Search or add a category"
            onChange={setCategories}
          />
        </JoinFieldCard>

        <JoinFieldCard icon={<IconBriefcase />} title="How you take part">
          <div className="grid gap-3 sm:grid-cols-2">
            {PARTICIPATION.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setParticipation(item.id)}
                className={cn(
                  "flex h-full flex-col rounded-lg border bg-surface px-4 py-4 text-left motion-safe:transition-colors motion-safe:duration-150",
                  "hover:border-[#DE7C40] hover:bg-[#DE7C40]/[0.06]",
                  participation === item.id ? "border-foreground" : "border-border",
                )}
              >
                <p className="text-body font-medium text-foreground">{item.label}</p>
                <p className="mt-1 text-body-sm text-muted">{item.body}</p>
              </button>
            ))}
          </div>
        </JoinFieldCard>

        <JoinFieldCard icon={<IconLock />} title="Certifications" hint="Optional. Listed on this device — not verified by VAEL.">
          <TagField
            id="certs"
            label="Certifications"
            values={certs}
            options={certificationOptions()}
            placeholder="Search or add a certification"
            onChange={setCerts}
          />
        </JoinFieldCard>

        <JoinFieldCard icon={<IconDocument />} title="Tools and tech stack">
          <TagField
            id="tools"
            label="Tools and tech stack"
            values={tools}
            options={capabilityOptions("tools")}
            placeholder="Search or add a tool"
            onChange={setTools}
          />
        </JoinFieldCard>

        <JoinFieldCard
          icon={<IconDocument />}
          title={business ? "Workstation" : "Own gear"}
          hint={business ? "Equipment or a workstation the company provides." : "Gear or a workstation you bring."}
        >
          <Field label={business ? "Workstation" : "Own gear"} htmlFor="gear">
            <Textarea id="gear" value={gear} onChange={(event) => setGear(event.target.value)} />
          </Field>
        </JoinFieldCard>

        <JoinFieldCard icon={<IconMapPin />} title="Working preference">
          <Field label="Remote, on-site, or hybrid" htmlFor="pref">
            <Select
              id="pref"
              value={workPreference ?? "remote"}
              onChange={(event) => setWorkPreference(event.target.value as ProfileRecord["workPreference"])}
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </Select>
          </Field>
          <Field label="Service area" htmlFor="area" hint="Where you can work. Your base location stays on the previous step.">
            <Input id="area" value={serviceArea} onChange={(event) => setServiceArea(event.target.value)} />
          </Field>
          <Field label="Availability needed" htmlFor="timing">
            <Select id="timing" value={timing} onChange={(event) => setTiming(event.target.value)}>
              {M_T_TIMING.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
        </JoinFieldCard>

        <JoinFieldCard icon={<IconClock />} title="Current availability">
          <div className="space-y-3">
            <SquareCheck label="Available today" checked={availableToday} onChange={setAvailableToday} />
            <SquareCheck label="Available right now" checked={availableNow} onChange={setAvailableNow} />
          </div>
        </JoinFieldCard>

        <JoinFieldCard icon={<IconDocument />} title="Documents" hint="License, insurance, or a capability statement. Held on this device.">
          <div className="flex flex-col gap-3">
            <Field label="Document type" htmlFor="doc-type-in">
              <Select id="doc-type-in" value={docType} onChange={(event) => setDocType(event.target.value as ProfileDocument["type"])}>
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
            {docs.length > 0 ? (
              <ul className="mt-2 space-y-3">
                {docs.map((doc) => (
                  <li key={doc.id}>
                    <DocumentCard title={doc.title} type={doc.type} status={doc.publicFlag ? "public" : "uploaded"} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </JoinFieldCard>

        <JoinFooterBar>
          <Button type="button" size="lg" className="rounded-lg px-10" onClick={onContinue}>
            Review profile
          </Button>
        </JoinFooterBar>
      </form>
    </div>
  );
}
