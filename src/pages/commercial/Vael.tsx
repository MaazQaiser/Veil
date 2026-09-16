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
import { useCommercial } from "@/lib/commercialCore";
import {
  CM_CAPABILITIES,
  CM_TIMING,
  DEFAULT_DURATION_HOURS,
  hoursLeft,
  type CommercialListing,
} from "@/lib/commercialStore";
import type { VaelSide } from "@/lib/vaelStore";

const BASE = "/districts/commercial";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CommercialVaelPage() {
  return (
    <RequireMember title="Commercial Need">
      <VaelInner />
    </RequireMember>
  );
}

function VaelInner() {
  const { listing, latestListing, saveListing, clearListing, handle, vaelKind, ensureMine } = useCommercial();
  const profile = ensureMine();
  const [step, setStep] = useState<"intent" | "need" | "place" | "details">(listing ? "need" : "intent");
  const [status, setStatus] = useState<"default" | "saving" | "saved" | "error">("default");
  const [error, setError] = useState("");

  const [form, setForm] = useState(() => ({
    side: (listing?.side || "out") as VaelSide,
    capability: listing?.capability || profile?.capability || "Facilities",
    context: listing?.context || "",
    area: listing?.area || profile?.area || "",
    availability: listing?.availability || "This cycle",
    capabilities: listing?.capabilities.join(", ") || profile?.capabilities.join(", ") || "",
    experienceYears: String(listing?.experienceYears || 0),
    credentials: listing?.credentials.join(", ") || "",
    description: listing?.description || "",
    requirements: listing?.requirements || "",
    contact: listing?.contact || "",
    scopeNote: listing?.scopeNote || "",
  }));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const payload = useMemo(
    (): Omit<CommercialListing, "id" | "createdAt" | "expiresAt" | "plan"> => ({
      handle,
      side: form.side,
      capability: form.capability,
      context: form.context,
      area: form.area,
      availability: form.availability,
      capabilities: splitList(form.capabilities),
      experienceYears: Number(form.experienceYears) || 0,
      credentials: splitList(form.credentials),
      description: form.description,
      requirements: form.requirements,
      contact: form.contact,
      scopeNote: form.scopeNote,
    }),
    [form, handle],
  );

  function publish() {
    if (!form.capability || !form.area || !form.description) {
      setError("Capability, area, and a short description are required.");
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
        kicker="Commercial"
        title={isNeed ? "Create a Need" : "List availability"}
        description={
          isNeed
            ? "Say what capability you need, where, and when. Free Daily VAEL lasts 24 hours."
            : "You will appear as a company or provider who can fulfill a commercial need. Free Daily VAEL lasts 24 hours."
        }
        crumbs={[
          { label: "Commercial", href: BASE },
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
            {listing.side === "out" ? "You have an active commercial need." : "You are listed as available."}{" "}
            {listing.capability} · {listing.area}. Publishing again starts a new 24-hour window.
          </p>
        </div>
      ) : latestListing ? (
        <div className="mt-8">
          <VaelStatePanel kind="expired" />
          <p className="mt-4 text-body-sm text-muted">
            The previous 24-hour window has ended. Publish again to appear on the Commercial Board.
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
            I need a business capability
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              set("side", "in");
              setStep("need");
            }}
          >
            I can fulfill a commercial need
          </Button>
        </div>
      ) : (
        <form
          className="mt-8 max-w-narrow space-y-10"
          onSubmit={(event) => {
            event.preventDefault();
            if (step === "need") {
              if (!form.capability || !form.description) {
                setError("Choose a capability and write a short description.");
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
              <p className="vael-kicker">{isNeed ? "What do we need?" : "What can you fulfill?"}</p>
              <Field
                label="Capability"
                htmlFor="capability"
                required
                hint="Kit starter list. Owner may replace this taxonomy. Not Residential home services."
              >
                <Select id="capability" value={form.capability} onChange={(e) => set("capability", e.target.value)}>
                  {CM_CAPABILITIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field
                label={isNeed ? "What is this for?" : "What work do you take on?"}
                htmlFor="context"
                hint="Business or project context. Stored on this device. Shown on matches. Not a scored column of its own."
              >
                <Input id="context" value={form.context} onChange={(e) => set("context", e.target.value)} />
              </Field>
              <Field label={isNeed ? "Describe the need" : "Describe what is available"} htmlFor="desc" required>
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
              <Field label="When is this needed?" htmlFor="when">
                <Select id="when" value={form.availability} onChange={(e) => set("availability", e.target.value)}>
                  {CM_TIMING.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
            </section>
          ) : null}

          {step === "details" ? (
            <section className="space-y-5">
              <p className="vael-kicker">Requirements</p>
              <Alert tone="info" title="Keep this concise">
                Requirements are used in match ranking when both sides list them. Extra scope is stored locally and is
                not scored.
              </Alert>
              <Field label="Requirements" htmlFor="req">
                <Textarea id="req" value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
              </Field>
              <Field label="Additional scope" htmlFor="scope" hint="Optional. Not scored. Not a procurement field.">
                <Input id="scope" value={form.scopeNote} onChange={(e) => set("scopeNote", e.target.value)} />
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
                  {listing ? "Update need" : isNeed ? "Create a Need" : "Create a VAEL"}
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
