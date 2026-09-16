import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { CityPage } from "@/components/city/CityShell";
import { VaelStatePanel } from "@/components/vael/visibility";
import { RequireMember } from "@/components/mt/RequireMember";
import { useResidential } from "@/lib/residentialCore";
import {
  DEFAULT_DURATION_HOURS,
  hoursLeft,
  RX_SERVICES,
  RX_TIMING,
  type ResidentialListing,
} from "@/lib/residentialStore";
import type { VaelSide } from "@/lib/vaelStore";

const BASE = "/districts/residential";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ResidentialVaelPage() {
  return (
    <RequireMember title="Residential Need">
      <VaelInner />
    </RequireMember>
  );
}

function VaelInner() {
  const { listing, latestListing, saveListing, clearListing, handle, vaelKind, ensureMine } = useResidential();
  const profile = ensureMine();
  const [step, setStep] = useState<"intent" | "need" | "place" | "details">(listing ? "need" : "intent");
  const [status, setStatus] = useState<"default" | "saving" | "saved" | "error">("default");
  const [error, setError] = useState("");

  const [form, setForm] = useState(() => ({
    side: (listing?.side || "out") as VaelSide,
    service: listing?.service || profile?.service || "General home repair",
    area: listing?.area || profile?.area || "",
    postalCode: listing?.postalCode || "",
    availability: listing?.availability || "This cycle",
    capabilities: listing?.capabilities.join(", ") || profile?.capabilities.join(", ") || "",
    experienceYears: String(listing?.experienceYears || 0),
    credentials: listing?.credentials.join(", ") || "",
    description: listing?.description || "",
    requirements: listing?.requirements || "",
    contact: listing?.contact || "",
    extraNote: listing?.extraNote || "",
  }));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const payload = useMemo(
    (): Omit<ResidentialListing, "id" | "createdAt" | "expiresAt" | "plan"> => ({
      handle,
      side: form.side,
      service: form.service,
      area: form.area,
      postalCode: form.postalCode,
      availability: form.availability,
      capabilities: splitList(form.capabilities),
      experienceYears: Number(form.experienceYears) || 0,
      credentials: splitList(form.credentials),
      description: form.description,
      requirements: form.requirements,
      contact: form.contact,
      extraNote: form.extraNote,
    }),
    [form, handle],
  );

  function publish() {
    if (!form.service || !form.area || !form.description) {
      setError("Service, area, and a short description are required.");
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      saveListing(payload);
      setError("");
      setStatus("saved");
    } catch {
      setError("The need could not be stored on this device.");
      setStatus("error");
    }
  }

  const isNeed = form.side === "out";
  const stepNumber = step === "need" ? 1 : step === "place" ? 2 : step === "details" ? 3 : 0;

  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Residential"
        title={isNeed ? "Post a Need" : "I'm available"}
        description={
          isNeed
            ? "Say what you need, where, and when. Free Daily VAEL lasts 24 hours."
            : "You will appear as available for home work. Free Daily VAEL lasts 24 hours."
        }
        crumbs={[
          { label: "Residential", href: BASE },
          { label: isNeed ? "Need" : "Vael" },
        ]}
      />

      {listing && (vaelKind === "in" || vaelKind === "out" || vaelKind === "expiring") ? (
        <div className="mt-8">
          <VaelStatePanel
            kind={vaelKind === "expiring" ? "expiring" : listing.side}
            hoursLeft={hoursLeft(listing.expiresAt)}
            side={listing.side}
          />
          <p className="mt-4 text-body-sm text-muted">
            {listing.side === "out" ? "You have an active need." : "You are listed as available."} {listing.service} ·{" "}
            {listing.area}. Publishing again starts a new 24-hour window.
          </p>
        </div>
      ) : latestListing ? (
        <div className="mt-8">
          <VaelStatePanel kind="expired" />
          <p className="mt-4 text-body-sm text-muted">
            The previous 24-hour window has ended. Publish again to appear on the Residential Board.
          </p>
        </div>
      ) : null}

      {step === "intent" ? (
        <div className="mt-8 grid gap-3">
          <Button
            onClick={() => {
              set("side", "out");
              setStep("need");
            }}
          >
            I need someone
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              set("side", "in");
              setStep("need");
            }}
          >
            I am available for home work
          </Button>
        </div>
      ) : (
        <form
          className="mt-8 max-w-narrow space-y-10"
          onSubmit={(event) => {
            event.preventDefault();
            if (step === "need") {
              if (!form.service || !form.description) {
                setError("Choose a service and write a short description.");
                setStatus("error");
                return;
              }
              setError("");
              setStatus("default");
              setStep("place");
              return;
            }
            if (step === "place") {
              if (!form.area) {
                setError("Area is required. There is no map in this kit.");
                setStatus("error");
                return;
              }
              setError("");
              setStatus("default");
              setStep("details");
              return;
            }
            publish();
          }}
        >
          <p className="text-caption text-muted">Step {stepNumber} of 3</p>

          {step === "need" ? (
            <section className="space-y-5">
              <p className="vael-kicker">{isNeed ? "What do you need?" : "What can you help with?"}</p>
              <Field label="Service" htmlFor="service" required hint="Kit starter list. Owner may replace this taxonomy.">
                <Select id="service" value={form.service} onChange={(e) => set("service", e.target.value)}>
                  {RX_SERVICES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label={isNeed ? "Tell us a bit more" : "What is available"} htmlFor="desc" required>
                <Textarea id="desc" value={form.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </section>
          ) : null}

          {step === "place" ? (
            <section className="space-y-5">
              <p className="vael-kicker">Where and when</p>
              <Field
                label="City or area"
                htmlFor="area"
                required
                hint="Text only. There is no map and no location service."
              >
                <Input id="area" value={form.area} onChange={(e) => set("area", e.target.value)} />
              </Field>
              <Field
                label="Postal code (optional)"
                htmlFor="zip"
                hint="Stored on this device. Not geocoded. Scored only if both sides list one."
              >
                <Input id="zip" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
              </Field>
              <Field label="When do you need this?" htmlFor="when">
                <Select id="when" value={form.availability} onChange={(e) => set("availability", e.target.value)}>
                  {RX_TIMING.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
            </section>
          ) : null}

          {step === "details" ? (
            <section className="space-y-5">
              <p className="vael-kicker">Anything else?</p>
              <Alert tone="info" title="Optional">
                Requirements and extra notes stay on this device. They are not a schedule or a quote.
              </Alert>
              <Field label="Requirements" htmlFor="req">
                <Textarea id="req" value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
              </Field>
              <Field label="Extra note" htmlFor="extra" hint="Optional. Not scored.">
                <Input id="extra" value={form.extraNote} onChange={(e) => set("extraNote", e.target.value)} />
              </Field>
              <Field label="Contact (hidden until Handshake)" htmlFor="contact">
                <Input id="contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
              </Field>
              {!isNeed ? (
                <>
                  <Field label="Capability labels" htmlFor="caps" hint="Comma-separated. Your labels only.">
                    <Input id="caps" value={form.capabilities} onChange={(e) => set("capabilities", e.target.value)} />
                  </Field>
                  <Field label="Experience (years)" htmlFor="exp">
                    <Input
                      id="exp"
                      inputMode="numeric"
                      value={form.experienceYears}
                      onChange={(e) => set("experienceYears", e.target.value)}
                    />
                  </Field>
                </>
              ) : null}
              <p className="text-caption text-muted">
                Visibility duration: {DEFAULT_DURATION_HOURS} hours. Same VAEL expiry as the rest of the City.
              </p>
            </section>
          ) : null}

          {error ? (
            <p role="alert" className="text-caption text-destructive">
              {error}
            </p>
          ) : null}
          {status === "saved" ? (
            <p role="status" className="text-caption text-success">
              Saved. You can find matches for 24 hours.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {step === "need" ? <Button type="submit">Continue</Button> : null}
            {step === "place" ? (
              <>
                <Button type="button" variant="ghost" onClick={() => setStep("need")}>
                  Back
                </Button>
                <Button type="submit">Continue</Button>
              </>
            ) : null}
            {step === "details" ? (
              <>
                <Button type="button" variant="ghost" onClick={() => setStep("place")}>
                  Back
                </Button>
                <Button type="submit" loading={status === "saving"}>
                  {listing ? "Update need" : isNeed ? "Post a Need" : "Create a VAEL"}
                </Button>
              </>
            ) : null}
            {listing ? (
              <Button type="button" variant="ghost" onClick={clearListing}>
                End this request
              </Button>
            ) : null}
            <Link to={`${BASE}/board`} className={buttonClassName({ variant: "outline" })}>
              Find Matches
            </Link>
          </div>
        </form>
      )}
    </CityPage>
  );
}
