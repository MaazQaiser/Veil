import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { CityPage } from "@/components/city/CityShell";
import { VeilStatePanel } from "@/components/vael/visibility";
import { RequireMember } from "@/components/mt/RequireMember";
import { useConstruction } from "@/lib/constructionCore";
import {
  CX_AVAILABILITY,
  CX_JOB_TYPES,
  CX_TRADES,
  DEFAULT_DURATION_HOURS,
  hoursLeft,
  type ConstructionListing,
} from "@/lib/constructionStore";
import type { VaelSide } from "@/lib/vaelStore";

const BASE = "/districts/contractor";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ConstructionVeilPage() {
  return (
    <RequireMember title="Construction Veil">
      <VeilInner />
    </RequireMember>
  );
}

function VeilInner() {
  const { listing, latestListing, saveListing, clearListing, handle, veilKind, ensureMine } = useConstruction();
  const [step, setStep] = useState<"intent" | "form" | "saving" | "saved" | "error">(listing ? "form" : "intent");
  const [error, setError] = useState("");
  const profile = ensureMine();

  const [form, setForm] = useState(() => ({
    side: (listing?.side ?? "in") as VaelSide,
    trade: listing?.trade || profile?.trade || "Electrical",
    jobType: listing?.jobType ?? "Renovation",
    capabilities: listing?.capabilities.join(", ") || profile?.capabilities.join(", ") || "",
    serviceArea: listing?.serviceArea || profile?.serviceArea || "",
    availability: listing?.availability ?? "This cycle",
    experienceYears: String(listing?.experienceYears ?? 5),
    credentials: listing?.credentials.join(", ") ?? profile?.credentials.join(", ") ?? "",
    insuranceNoted: listing?.insuranceNoted ?? false,
    description: listing?.description ?? "",
    requirements: listing?.requirements ?? "",
    contact: listing?.contact ?? "",
    timeline: listing?.timeline ?? "This cycle",
    scopeNote: listing?.scopeNote ?? "",
  }));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const payload = useMemo(
    (): Omit<ConstructionListing, "id" | "createdAt" | "expiresAt" | "plan"> => ({
      handle,
      side: form.side,
      trade: form.trade,
      jobType: form.jobType,
      capabilities: splitList(form.capabilities),
      serviceArea: form.serviceArea,
      availability: form.availability,
      experienceYears: Number(form.experienceYears) || 0,
      credentials: splitList(form.credentials),
      insuranceNoted: form.insuranceNoted,
      description: form.description,
      requirements: form.requirements,
      contact: form.contact,
      timeline: form.timeline,
      scopeNote: form.scopeNote,
    }),
    [form, handle],
  );

  function publish() {
    if (!form.trade || !form.serviceArea || !form.description) {
      setError("Trade, service area, and a short description are required.");
      setStep("error");
      return;
    }
    setStep("saving");
    try {
      saveListing(payload);
      setError("");
      setStep("saved");
    } catch {
      setError("The VAEL could not be stored on this device.");
      setStep("error");
    }
  }

  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Construction Exchange"
        title="Create VAEL"
        description="Veil In if you are available for construction work. Veil Out if you need construction capability. Free Daily VAEL lasts 24 hours."
        crumbs={[
          { label: "Construction", href: BASE },
          { label: "Veil" },
        ]}
      />

      {listing && (veilKind === "in" || veilKind === "out" || veilKind === "expiring") ? (
        <div className="mt-8">
          <VeilStatePanel
            kind={veilKind === "expiring" ? "expiring" : listing.side}
            hoursLeft={hoursLeft(listing.expiresAt)}
            side={listing.side}
          />
          <p className="mt-4 text-body-sm text-muted">
            {listing.side === "in" ? "You are available for construction work." : "You need construction capability."}{" "}
            {listing.trade} · {listing.serviceArea}. Publishing again starts a new 24-hour window.
          </p>
        </div>
      ) : latestListing ? (
        <div className="mt-8">
          <VeilStatePanel kind="expired" />
          <p className="mt-4 text-body-sm text-muted">
            The previous 24-hour window has ended. Re-veil to appear on the Construction Board again.
          </p>
        </div>
      ) : null}

      {step === "intent" ? (
        <div className="mt-8 grid gap-3">
          <Button
            onClick={() => {
              set("side", "in");
              setStep("form");
            }}
          >
            Veil In — I am available for construction work
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              set("side", "out");
              setStep("form");
            }}
          >
            Veil Out — I need construction capability
          </Button>
        </div>
      ) : null}

      {step !== "intent" ? (
        <form
          className="mt-8 max-w-narrow space-y-10"
          onSubmit={(event) => {
            event.preventDefault();
            publish();
          }}
        >
          <section className="space-y-5">
            <p className="vael-kicker">Intent</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={form.side === "in" ? "primary" : "outline"} onClick={() => set("side", "in")}>
                Veil In
              </Button>
              <Button type="button" variant={form.side === "out" ? "primary" : "outline"} onClick={() => set("side", "out")}>
                Veil Out
              </Button>
            </div>
            <p className="text-caption text-muted">
              {form.side === "in"
                ? "You will appear as available for construction work."
                : "You will appear as needing construction capability."}
            </p>
          </section>

          <section className="space-y-5">
            <p className="vael-kicker">Construction fields</p>
            <Field label="Trade" htmlFor="trade" required hint="Kit starter list. Owner may replace (Blueprint 2.6).">
              <Select id="trade" value={form.trade} onChange={(e) => set("trade", e.target.value)}>
                {CX_TRADES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field
              label={form.side === "in" ? "Job type you can take" : "Job type needed"}
              htmlFor="job"
            >
              <Select id="job" value={form.jobType} onChange={(e) => set("jobType", e.target.value)}>
                {CX_JOB_TYPES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Capabilities" htmlFor="caps" hint="Comma-separated. Your labels only.">
              <Input id="caps" value={form.capabilities} onChange={(e) => set("capabilities", e.target.value)} />
            </Field>
            <Field
              label="Licenses / credential labels"
              htmlFor="creds"
              hint="Do not invent a license number. Labels only — this kit does not validate licenses."
            >
              <Input id="creds" value={form.credentials} onChange={(e) => set("credentials", e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-body-sm" htmlFor="ins">
              <input
                id="ins"
                type="checkbox"
                checked={form.insuranceNoted}
                onChange={(e) => set("insuranceNoted", e.target.checked)}
              />
              Insurance document is listed on this device
            </label>
          </section>

          <section className="space-y-5">
            <p className="vael-kicker">Place and timing</p>
            <Field label="Service area" htmlFor="area" required>
              <Input id="area" value={form.serviceArea} onChange={(e) => set("serviceArea", e.target.value)} />
            </Field>
            <Field label="Availability" htmlFor="avail">
              <Select id="avail" value={form.availability} onChange={(e) => set("availability", e.target.value)}>
                {CX_AVAILABILITY.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Experience (years)" htmlFor="exp">
              <Input
                id="exp"
                inputMode="numeric"
                value={form.experienceYears}
                onChange={(e) => set("experienceYears", e.target.value)}
              />
            </Field>
          </section>

          <section className="space-y-5">
            <p className="vael-kicker">Details</p>
            <Alert tone="warning" title="Local-only fields">
              Description, requirements, contact, timeline, and scope note are stored on this device. They are not a
              shared Construction database.
            </Alert>
            <Field
              label={form.side === "in" ? "What is available" : "What is needed"}
              htmlFor="desc"
              required
            >
              <Textarea id="desc" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Requirements" htmlFor="req">
              <Textarea id="req" value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
            </Field>
            <Field label="Contact (hidden until Handshake)" htmlFor="contact">
              <Input id="contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
            </Field>
            <Field label="Timeline" htmlFor="timeline">
              <Input id="timeline" value={form.timeline} onChange={(e) => set("timeline", e.target.value)} />
            </Field>
            <Field
              label="Scope note"
              htmlFor="scope"
              hint="Optional. Not scored. Not a payment system."
            >
              <Input id="scope" value={form.scopeNote} onChange={(e) => set("scopeNote", e.target.value)} />
            </Field>
            <p className="text-caption text-muted">
              Visibility duration: {DEFAULT_DURATION_HOURS} hours. Same VAEL expiry as the rest of the City.
            </p>
          </section>

          {error ? (
            <p role="alert" className="text-caption text-destructive">
              {error}
            </p>
          ) : null}
          {step === "saved" ? (
            <p role="status" className="text-caption text-success">
              Saved. You are on the Construction Board for 24 hours.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={step === "saving"}>
              {listing ? "Re-veil" : "Create a VAEL"}
            </Button>
            {listing ? (
              <Button type="button" variant="ghost" onClick={clearListing}>
                End visibility
              </Button>
            ) : null}
            <Link to={`${BASE}/board`} className={buttonClassName({ variant: "outline" })}>
              View Matches
            </Link>
          </div>
        </form>
      ) : null}
    </CityPage>
  );
}
