import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { DocumentCard, ProfileCard } from "@/components/vael";
import { ProfileCompleteness, ProfileDocumentsSection, ProfileTrustPanel, TrustSummary } from "@/components/vael/trust";
import { EquipmentBadge } from "@/components/trucking/TruckingCards";
import { CityPage } from "@/components/city/CityShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCitySession } from "@/lib/citySession";
import { useTrucking } from "@/lib/truckingCore";
import { TX_EQUIPMENT, type TruckingProfile } from "@/lib/truckingStore";
import { DOC_TYPES } from "@/lib/vaelStore";

const BASE = "/districts/trucking";

function split(value: string | string[]) {
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function TruckingProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { session, signIn } = useCitySession();
  const tx = useTrucking();
  const handle = username ?? "";
  const mine = session.signedIn && session.handle === handle;
  const profile = tx.profile(handle);
  const docs = tx.documents(handle);
  const connection = session.signedIn ? tx.openWith(session.handle, handle) : undefined;
  const revealed = mine || connection?.status === "connected";
  const signedIn = session.signedIn;
  const showDistrict = signedIn;

  if (!profile) {
    return (
      <CityPage>
        <PageHeader title="Trucking profile" kicker="Trucking Exchange" />
        <EmptyState
          title="No Trucking profile on this device"
          description={`@${handle} is not in local Trucking data.`}
          action={
            <Link to={BASE} className={buttonClassName({ variant: "outline" })}>
              Return to Trucking
            </Link>
          }
        />
      </CityPage>
    );
  }

  return (
    <CityPage>
      <PageHeader
        kicker="Trucking profile"
        title={profile.displayName}
        description={`@${profile.handle} · ${profile.profileType}`}
        crumbs={[
          { label: "Trucking", href: BASE },
          { label: `@${profile.handle}` },
        ]}
        primaryAction={
          mine ? (
            <Link to={`${BASE}/profile/${handle}/edit`} className={buttonClassName()}>
              Edit profile
            </Link>
          ) : signedIn && handle !== session.handle && connection?.status !== "connected" ? (
            <Button
              onClick={() => {
                const record = tx.handshake({
                  fromHandle: session.handle,
                  toHandle: handle,
                  source: "handshake",
                });
                navigate(`${BASE}/connections/${record.id}`);
              }}
            >
              Request Handshake
            </Button>
          ) : connection?.status === "connected" ? (
            <Link to={`${BASE}/connections/${connection.id}`} className={buttonClassName()}>
              Open Conversation
            </Link>
          ) : !signedIn ? (
            <Button onClick={() => signIn("member")}>Continue locally</Button>
          ) : null
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <TrustSummary note="Unverified is the only honest state. Trucking does not invent DOT, MC, or license verification." />
        {profile.equipment ? <EquipmentBadge equipment={profile.equipment} /> : null}
        {profile.sample ? <span className="text-caption text-muted">Sample on this device</span> : null}
      </div>
      <ProfileCompleteness
        values={[
          profile.displayName,
          profile.headline,
          profile.about,
          profile.equipment,
          profile.serviceLanes,
          profile.experience,
          profile.credentials,
        ]}
      />

      <Alert tone="info" title="What others can see" className="mt-6">
        Handle and display name stay public. Equipment, service lanes, rates, and history follow the same City rule:
        visible after you continue locally. Rates and history stay closed to a counterpart until Handshake.
      </Alert>

      <div className="mt-8">
        <ProfileCard
          name={profile.displayName}
          handle={profile.handle}
          headline={profile.headline || "No headline yet"}
        />
      </div>

      <Tabs defaultValue="about" className="mt-8">
        <TabsList>
          <TabsTrigger value="about">Identity</TabsTrigger>
          <TabsTrigger value="lanes">Lanes</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
          <TabsTrigger value="trust">Trust</TabsTrigger>
        </TabsList>
        <TabsContent value="about">
          {!showDistrict ? (
            <p className="text-body-sm text-muted">Continue locally to see Trucking profile details.</p>
          ) : (
            <dl className="space-y-4 text-body-sm">
              <Section label="Identity" body={`${profile.displayName} · @${profile.handle} · ${profile.profileType}`} />
              <Section label="About" body={profile.about || "Not written yet."} />
              <Section label="Equipment" body={profile.equipment || "Not listed."} />
              <Section label="Experience" body={profile.experience || "Not listed."} />
              <Section
                label="Credential labels"
                body={profile.credentials.join(", ") || "None listed. This kit does not collect DOT or MC numbers."}
              />
              <Section label="Rates" body={revealed ? profile.rates || "Not listed." : "Opens after a Handshake."} />
            </dl>
          )}
        </TabsContent>
        <TabsContent value="lanes">
          {!showDistrict ? (
            <p className="text-body-sm text-muted">Sign in to see service lanes.</p>
          ) : (
            <dl className="space-y-4 text-body-sm">
              <Section label="Service lanes" body={profile.serviceLanes || "None listed."} />
              <Section label="Capabilities" body={profile.capabilities.join(", ") || "None listed."} />
              <Section
                label="History"
                body={
                  revealed
                    ? profile.history.map((item) => item.label).join(", ") || "None listed."
                    : "Opens after a Handshake."
                }
              />
            </dl>
          )}
        </TabsContent>
        <TabsContent value="docs">
          <ProfileDocumentsSection
            docs={docs}
            mine={mine}
            revealed={revealed}
            emptyDescription="License, insurance, and capability statements live here. Types are City-generic — not trucking-specific regulatory files."
          />
        </TabsContent>
        <TabsContent value="trust">
          <ProfileTrustPanel
            values={[
              profile.displayName,
              profile.headline,
              profile.about,
              profile.equipment,
              profile.serviceLanes,
              profile.experience,
              profile.credentials,
            ]}
            districtNote="Reputation is not modeled. Unverified is the only honest state. Trucking does not invent DOT, MC, or license verification."
          />
        </TabsContent>
      </Tabs>
    </CityPage>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <dt className="vael-kicker">{label}</dt>
      <dd className="mt-1">{body}</dd>
    </div>
  );
}

export function TruckingProfileEditPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { session } = useCitySession();
  const tx = useTrucking();
  const [status, setStatus] = useState<"default" | "editing" | "saving" | "saved" | "error">("editing");
  const [error, setError] = useState("");
  const mine = tx.ensureMine();
  const [form, setForm] = useState<TruckingProfile | null>(mine ?? null);

  if (!session.signedIn || session.handle !== username || !form) {
    return (
      <CityPage>
        <EmptyState
          title="You can only edit your own Trucking profile on this device"
          description="Continue locally as this handle to edit."
          action={
            <Link to="/account" className={buttonClassName({ variant: "outline" })}>
              Account
            </Link>
          }
        />
      </CityPage>
    );
  }

  function set<K extends keyof TruckingProfile>(key: K, value: TruckingProfile[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setStatus("editing");
  }

  function save() {
    if (!form) return;
    if (!form.displayName) {
      setError("Display name is required.");
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      tx.writeProfile(form);
      setError("");
      setStatus("saved");
    } catch {
      setError("Could not save on this device.");
      setStatus("error");
    }
  }

  const docs = tx.documents(form.handle);

  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Trucking profile"
        title="Edit profile"
        crumbs={[
          { label: `@${form.handle}`, href: `${BASE}/profile/${form.handle}` },
          { label: "Edit" },
        ]}
      />
      <form
        className="mt-8 max-w-narrow space-y-12"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <section className="space-y-5">
          <p className="vael-kicker">Identity</p>
          <Field label="Display name" htmlFor="dn" required>
            <Input id="dn" value={form.displayName} onChange={(e) => set("displayName", e.target.value)} />
          </Field>
          <Field label="Profile type" htmlFor="pt">
            <Select
              id="pt"
              value={form.profileType}
              onChange={(e) => set("profileType", e.target.value as TruckingProfile["profileType"])}
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </Select>
          </Field>
          <Field label="Headline" htmlFor="hl">
            <Input id="hl" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
          </Field>
        </section>
        <section className="space-y-5">
          <p className="vael-kicker">Company / individual</p>
          <Field label="About" htmlFor="about">
            <Textarea id="about" value={form.about} onChange={(e) => set("about", e.target.value)} />
          </Field>
          <Field label="Rates" htmlFor="rates" hint="Shown after Handshake.">
            <Input id="rates" value={form.rates} onChange={(e) => set("rates", e.target.value)} />
          </Field>
        </section>
        <section className="space-y-5">
          <p className="vael-kicker">Equipment and lanes</p>
          <Field label="Equipment" htmlFor="equip">
            <Select id="equip" value={form.equipment} onChange={(e) => set("equipment", e.target.value)}>
              <option value="">Select</option>
              {TX_EQUIPMENT.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field
            label="Service lanes"
            htmlFor="lanes"
            hint="Text lanes, e.g. Atlanta → Savannah. There is no map in this kit."
          >
            <Input id="lanes" value={form.serviceLanes} onChange={(e) => set("serviceLanes", e.target.value)} />
          </Field>
          <Field label="Capabilities" htmlFor="caps" hint="Comma-separated.">
            <Input
              id="caps"
              value={form.capabilities.join(", ")}
              onChange={(e) => set("capabilities", split(e.target.value))}
            />
          </Field>
        </section>
        <section className="space-y-5">
          <p className="vael-kicker">Experience and credentials</p>
          <Field label="Experience" htmlFor="exp">
            <Textarea id="exp" value={form.experience} onChange={(e) => set("experience", e.target.value)} />
          </Field>
          <Field
            label="Credential labels"
            htmlFor="cred"
            hint="Your labels only. Do not enter a DOT or MC number — those fields are not supported."
          >
            <Input
              id="cred"
              value={form.credentials.join(", ")}
              onChange={(e) => set("credentials", split(e.target.value))}
            />
          </Field>
        </section>
        <section className="space-y-5">
          <p className="vael-kicker">History</p>
          <Field label="History label" htmlFor="hlab" hint="Shown after Handshake.">
            <Input
              id="hlab"
              value={form.history[0]?.label ?? ""}
              onChange={(e) => set("history", [{ label: e.target.value, url: form.history[0]?.url ?? "" }])}
            />
          </Field>
          <Field label="History URL" htmlFor="hurl">
            <Input
              id="hurl"
              value={form.history[0]?.url ?? ""}
              onChange={(e) => set("history", [{ label: form.history[0]?.label ?? "Link", url: e.target.value }])}
            />
          </Field>
        </section>
        <section className="space-y-5">
          <p className="vael-kicker">Documents</p>
          <p className="text-caption text-muted">
            License, insurance, capability statement — local preview. NOT YET CONNECTED to cloud storage. Types are
            City-generic.
          </p>
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              title={doc.title}
              type={doc.type}
              status={doc.publicFlag ? "public" : "uploaded"}
            />
          ))}
          <label className="block text-caption">
            Add document
            <input
              className="mt-2 block"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  tx.uploadDocument({
                    handle: form.handle,
                    type: DOC_TYPES[0],
                    title: file.name,
                    publicFlag: false,
                    dataUrl: String(reader.result),
                  });
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </section>
        {error ? (
          <p role="alert" className="text-caption text-destructive">
            {error}
          </p>
        ) : null}
        {status === "saved" ? (
          <p role="status" className="text-caption">
            Saved on this device.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={status === "saving"}>
            Save profile
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(`${BASE}/profile/${form.handle}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </CityPage>
  );
}
