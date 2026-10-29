import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { DocumentCard } from "@/components/vael";
import { useCitySession } from "@/lib/citySession";
import { cn } from "@/lib/cn";
import { useConstruction } from "@/lib/constructionCore";
import { CX_TRADES, subscribeConstruction, type ConstructionProfile } from "@/lib/constructionStore";
import { RX_PROJECT_CATEGORIES, getVaelance, saveVaelance, type CxProjectRole } from "@/lib/cxProjectStore";
import { addManualDistricts } from "@/lib/myDistricts";
import { DOC_TYPES } from "@/lib/vaelStore";
import { useVael } from "@/lib/vaelCore";
import { OPPORTUNITY_PATH } from "@/lib/cxRoutes";
import { JoinFooterBar, JoinHead } from "./JoinLayout";

export const JOIN_CONTRACTOR_PATH = "/join/contractor-exchange";

const KINDS = [
  { id: "general-contractor", title: "General contractor", body: "Manage whole projects from start to finish.", type: "individual", trade: "General" },
  { id: "skilled-trade", title: "Skilled trade", body: "Electrical, plumbing, HVAC, carpentry and other specialist work.", type: "individual", trade: "" },
  { id: "crew", title: "Crew or subcontractor", body: "A team that takes on parts of a project.", type: "company", trade: "" },
  { id: "company", title: "Company", body: "A construction or home-services business.", type: "company", trade: "" },
] as const;

const ROLES: { id: CxProjectRole; title: string; body: string }[] = [
  { id: "whole", title: "Whole project", body: "I can manage the complete project." },
  { id: "specialty", title: "Specialty", body: "I handle a specific part of the project." },
  { id: "either", title: "Either", body: "I can do either, depending on the project." },
];

const DOC_LABEL: Record<(typeof DOC_TYPES)[number], string> = {
  license: "License",
  insurance: "Insurance",
  capability: "Capability statement",
};

const STEPS = ["Profile type", "Your profile", "Your projects", "Documents"] as const;

const OPTION =
  "flex h-full w-full flex-col items-start rounded-lg border bg-surface px-5 py-4 text-left motion-safe:transition-colors motion-safe:duration-150 hover:border-[#EE8A4A] hover:bg-[#EE8A4A]/[0.06]";

function split(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Joining Contractor Exchange, one step at a time: who you are, your profile, the projects you take
 * on, then documents. Saving everything at the end makes it the member's active district.
 */
export function JoinContractorExchangePage() {
  const { session } = useCitySession();
  const navigate = useNavigate();
  const cx = useConstruction();
  const vael = useVael();
  const existing = getVaelance(session.handle);
  const start = cx.ensureMine();
  const mtName = vael.profile(session.handle)?.displayName;

  const [step, setStep] = useState(0);
  const [kind, setKind] = useState("");
  const [form, setForm] = useState<ConstructionProfile | null>(
    start ? { ...start, displayName: start.displayName === start.handle && mtName ? mtName : start.displayName } : null,
  );
  const [categories, setCategories] = useState<string[]>(existing?.projectCategories ?? []);
  const [role, setRole] = useState<CxProjectRole | "">(existing?.projectRole ?? "");
  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]>(DOC_TYPES[0]);
  const [error, setError] = useState("");
  const [, setTick] = useState(0);

  // The document list is read straight from the store, so refresh when a file is added.
  useEffect(() => subscribeConstruction(() => setTick((n) => n + 1)), []);

  if (!form) return null;
  const docs = cx.documents(form.handle);

  function set<K extends keyof ConstructionProfile>(key: K, value: ConstructionProfile[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setError("");
  }

  function chooseKind(id: string) {
    const chosen = KINDS.find((item) => item.id === id);
    if (!chosen) return;
    setKind(id);
    setForm((current) =>
      current ? { ...current, profileType: chosen.type, trade: current.trade || chosen.trade } : current,
    );
  }

  function back() {
    if (step === 0) navigate(OPPORTUNITY_PATH);
    else setStep(step - 1);
  }

  function next() {
    if (!form) return;
    if (step === 0 && !kind) return;
    if (step === 1) {
      if (!form.displayName.trim()) return setError("Enter the name you work under.");
      if (!form.trade) return setError("Choose your trade.");
      if (!form.serviceArea.trim()) return setError("Add the city or area you work in.");
    }
    if (step === 2) {
      if (categories.length === 0) return setError("Choose at least one type of work.");
      if (!role) return setError("Choose how you work.");
    }
    setError("");
    setStep(step + 1);
  }

  function join() {
    if (!form || !role) return;
    cx.writeProfile({ ...form, location: form.location || form.serviceArea });
    saveVaelance({
      handle: form.handle,
      projectCategories: categories as (typeof RX_PROJECT_CATEGORIES)[number][],
      projectRole: role,
    });
    addManualDistricts(session.handle, ["construction"]);
    navigate(OPPORTUNITY_PATH, { state: { joinedContractor: true } });
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="mb-6 text-center text-caption font-medium uppercase tracking-[0.14em] text-[#EE8A4A]">
        Contractor Exchange · Step {step + 1} of {STEPS.length}
      </p>

      {step === 0 ? (
        <>
          <JoinHead title="Select your profile type" lede="Tell Contractor Exchange who you are. You can change this anytime." center />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {KINDS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={kind === item.id}
                  onClick={() => chooseKind(item.id)}
                  className={cn(OPTION, kind === item.id ? "border-[#EE8A4A] bg-[#EE8A4A]/[0.08]" : "border-border")}
                >
                  <p className="text-body-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-caption text-muted">{item.body}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <JoinHead title="Your profile" lede="This is how homeowners see you once you are in the district." center />
          <div className="mt-8 space-y-5 rounded-lg border border-border bg-surface p-6 sm:p-7">
            <Field label="Display name" htmlFor="cj-name" required>
              <Input id="cj-name" value={form.displayName} onChange={(e) => set("displayName", e.target.value)} />
            </Field>
            <Field label="Headline" htmlFor="cj-headline" hint="One line, like “Kitchen and bath renovations”.">
              <Input id="cj-headline" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Trade" htmlFor="cj-trade" required>
                <Select id="cj-trade" value={form.trade} onChange={(e) => set("trade", e.target.value)}>
                  <option value="">Select</option>
                  {CX_TRADES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Specialization" htmlFor="cj-spec">
                <Input id="cj-spec" value={form.specialization} onChange={(e) => set("specialization", e.target.value)} />
              </Field>
            </div>
            <Field label="Service area" htmlFor="cj-area" required hint="The city or area you work in.">
              <Input id="cj-area" value={form.serviceArea} onChange={(e) => set("serviceArea", e.target.value)} />
            </Field>
            <Field label="About" htmlFor="cj-about">
              <Textarea id="cj-about" value={form.about} onChange={(e) => set("about", e.target.value)} />
            </Field>
            <Field label="Capabilities" htmlFor="cj-caps" hint="Separate with commas.">
              <Input id="cj-caps" value={form.capabilities.join(", ")} onChange={(e) => set("capabilities", split(e.target.value))} />
            </Field>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <JoinHead title="Your projects" lede="Tell us the work you take on, so the right opportunities come to you." center />
          <h2 className="mt-8 text-h4 font-medium text-foreground">What type of work do you do?</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {RX_PROJECT_CATEGORIES.map((category) => {
              const selected = categories.includes(category);
              return (
                <li key={category}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setCategories((prev) => (prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]));
                      setError("");
                    }}
                    className={cn(
                      "w-full rounded-lg border bg-surface px-4 py-3 text-left text-body-sm font-medium motion-safe:transition-colors hover:border-[#EE8A4A]",
                      selected ? "border-[#EE8A4A] bg-[#EE8A4A]/[0.08] text-foreground" : "border-border text-muted",
                    )}
                  >
                    {category}
                  </button>
                </li>
              );
            })}
          </ul>
          <h2 className="mt-8 text-h4 font-medium text-foreground">How do you work?</h2>
          <ul className="mt-3 space-y-3">
            {ROLES.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={role === item.id}
                  onClick={() => {
                    setRole(item.id);
                    setError("");
                  }}
                  className={cn(OPTION, role === item.id ? "border-[#EE8A4A] bg-[#EE8A4A]/[0.08]" : "border-border")}
                >
                  <p className="text-body-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-caption text-muted">{item.body}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <JoinHead title="Documents" lede="Add a license, insurance or a capability statement. You can skip this and add them later." center />
          <div className="mt-8 space-y-4 rounded-lg border border-border bg-surface p-6 sm:p-7">
            {docs.length > 0 ? (
              <ul className="space-y-3">
                {docs.map((doc) => (
                  <li key={doc.id}>
                    <DocumentCard title={doc.title} type={doc.type} status={doc.publicFlag ? "public" : "uploaded"} />
                  </li>
                ))}
              </ul>
            ) : null}
            <Field label="Document type" htmlFor="cj-doc-type">
              <Select id="cj-doc-type" value={docType} onChange={(e) => setDocType(e.target.value as (typeof DOC_TYPES)[number])}>
                {DOC_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {DOC_LABEL[item]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Add a document" htmlFor="cj-doc-file" hint="Stays on this device. Only shared after a Handshake.">
              <input
                id="cj-doc-file"
                type="file"
                className="block w-full text-body-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-[#EE8A4A] file:px-4 file:py-2 file:text-body-sm file:font-medium file:text-[#0B0C0C]"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file || !form) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    cx.uploadDocument({
                      handle: form.handle,
                      type: docType,
                      title: file.name,
                      publicFlag: false,
                      dataUrl: String(reader.result),
                    });
                  };
                  reader.readAsDataURL(file);
                  event.target.value = "";
                }}
              />
            </Field>
          </div>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-center text-body-sm text-destructive">
          {error}
        </p>
      ) : null}

      <JoinFooterBar>
        <Button type="button" variant="ghost" onClick={back}>
          Back
        </Button>
        {last ? (
          <Button type="button" size="lg" className="rounded-lg px-10" onClick={join}>
            Join Contractor Exchange
          </Button>
        ) : (
          <Button type="button" size="lg" className="rounded-lg px-10" disabled={step === 0 && !kind} onClick={next}>
            Continue
          </Button>
        )}
      </JoinFooterBar>
    </div>
  );
}
