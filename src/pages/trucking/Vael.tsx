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
import { useTrucking } from "@/lib/truckingCore";
import {
  DEFAULT_DURATION_HOURS,
  hoursLeft,
  laneLabel,
  TX_AVAILABILITY,
  TX_CAPACITY,
  TX_EQUIPMENT,
  type TruckingListing,
} from "@/lib/truckingStore";
import type { VaelSide } from "@/lib/vaelStore";

const BASE = "/districts/trucking";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function TruckingVaelPage() {
  return (
    <RequireMember title="Trucking Vael">
      <VaelInner />
    </RequireMember>
  );
}

function VaelInner() {
  const { listing, latestListing, saveListing, clearListing, handle, vaelKind, ensureMine } = useTrucking();
  const [step, setStep] = useState<"intent" | "form" | "saving" | "saved" | "error">(listing ? "form" : "intent");
  const [error, setError] = useState("");
  const profile = ensureMine();

  const [form, setForm] = useState(() => ({
    side: (listing?.side || "in") as VaelSide,
    origin: listing?.origin || "",
    destination: listing?.destination || "",
    equipment: listing?.equipment || profile?.equipment || "Dry van",
    capacity: listing?.capacity || "Full",
    availability: listing?.availability || "This cycle",
    capabilities: listing?.capabilities.join(", ") || profile?.capabilities.join(", ") || "",
    experienceYears: String(listing?.experienceYears || 5),
    description: listing?.description || "",
    requirements: listing?.requirements || "",
    contact: listing?.contact || "",
    pickupNote: listing?.pickupNote || "",
    deliveryNote: listing?.deliveryNote || "",
  }));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const payload = useMemo(
    (): Omit<TruckingListing, "id" | "createdAt" | "expiresAt" | "plan"> => ({
      handle,
      side: form.side,
      origin: form.origin,
      destination: form.destination,
      equipment: form.equipment,
      capacity: form.capacity,
      availability: form.availability,
      capabilities: splitList(form.capabilities),
      experienceYears: Number(form.experienceYears) || 0,
      description: form.description,
      requirements: form.requirements,
      contact: form.contact,
      pickupNote: form.pickupNote,
      deliveryNote: form.deliveryNote,
    }),
    [form, handle],
  );

  function publish() {
    if (!form.origin || !form.destination || !form.description) {
      setError("Origin, destination, and a short description are required.");
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
        kicker="Trucking Exchange"
        title="Create VAEL"
        description="Vael In if you have transportation capacity. Vael Out if you need a load moved. Free Daily VAEL lasts 24 hours."
        crumbs={[
          { label: "Trucking", href: BASE },
          { label: "Vael" },
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
            {listing.side === "in" ? "You have transportation capacity available." : "You need transportation."}{" "}
            {laneLabel(listing.origin, listing.destination)}. Publishing again starts a new 24-hour window.
          </p>
        </div>
      ) : latestListing ? (
        <div className="mt-8">
          <VaelStatePanel kind="expired" />
          <p className="mt-4 text-body-sm text-muted">
            The previous 24-hour window has ended. Re-vael to appear on the Trucking Board again.
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
            Vael In — I have transportation capacity available
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              set("side", "out");
              setStep("form");
            }}
          >
            Vael Out — I need transportation
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
                Available
              </Button>
              <Button type="button" variant={form.side === "out" ? "primary" : "outline"} onClick={() => set("side", "out")}>
                Need
              </Button>
            </div>
            <p className="text-caption text-muted">
              {form.side === "in"
                ? "You will appear as having transportation capacity available."
                : "You will appear as needing transportation for a load."}
            </p>
          </section>

          <section className="space-y-5">
            <p className="vael-kicker">Route</p>
            <Field
              label="Origin"
              htmlFor="origin"
              required
              hint={form.side === "in" ? "Where capacity is available from." : "Where the load picks up."}
            >
              <Input id="origin" value={form.origin} onChange={(e) => set("origin", e.target.value)} />
            </Field>
            <Field
              label="Destination"
              htmlFor="destination"
              required
              hint={form.side === "in" ? "Where you can take capacity." : "Where the load needs to go."}
            >
              <Input id="destination" value={form.destination} onChange={(e) => set("destination", e.target.value)} />
            </Field>
          </section>

          <section className="space-y-5">
            <p className="vael-kicker">{form.side === "in" ? "Capacity" : "Load"}</p>
            <Field
              label={form.side === "in" ? "Capacity available" : "Load size needed"}
              htmlFor="capacity"
              hint="Qualitative. This kit does not collect legal weight limits."
            >
              <Select id="capacity" value={form.capacity} onChange={(e) => set("capacity", e.target.value)}>
                {TX_CAPACITY.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field
              label={form.side === "in" ? "What is available" : "What needs to move"}
              htmlFor="desc"
              required
            >
              <Textarea id="desc" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </section>

          <section className="space-y-5">
            <p className="vael-kicker">Capability</p>
            <Field
              label="Equipment"
              htmlFor="equip"
              hint="Kit starter categories, not a regulatory class list. Owner may replace."
            >
              <Select id="equip" value={form.equipment} onChange={(e) => set("equipment", e.target.value)}>
                {TX_EQUIPMENT.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
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
          </section>

          <section className="space-y-5">
            <p className="vael-kicker">Availability</p>
            <Field label="When" htmlFor="avail">
              <Select id="avail" value={form.availability} onChange={(e) => set("availability", e.target.value)}>
                {TX_AVAILABILITY.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Alert tone="warning" title="Timing notes are local only">
              Pickup and delivery notes are stored on this device. They are not scored and are not a dispatch clock.
              There is no live map.
            </Alert>
            <Field label="Pickup note" htmlFor="pickup" hint="Optional. Not scored.">
              <Input id="pickup" value={form.pickupNote} onChange={(e) => set("pickupNote", e.target.value)} />
            </Field>
            <Field label="Delivery note" htmlFor="delivery" hint="Optional. Not scored.">
              <Input id="delivery" value={form.deliveryNote} onChange={(e) => set("deliveryNote", e.target.value)} />
            </Field>
          </section>

          <section className="space-y-5">
            <p className="vael-kicker">Details</p>
            <Alert tone="info" title="What this kit does not collect">
              No DOT number, MC number, or license identifier. Those fields are not in the product architecture.
            </Alert>
            <Field label="Requirements" htmlFor="req">
              <Textarea id="req" value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
            </Field>
            <Field label="Contact (hidden until Handshake)" htmlFor="contact">
              <Input id="contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
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
              Saved. You are on the Trucking Board for 24 hours.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={step === "saving"}>
              {listing ? "Re-vael" : "Create a VAEL"}
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
