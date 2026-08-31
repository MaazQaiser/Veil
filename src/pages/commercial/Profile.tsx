import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { DocumentCard, ProfileCard } from "@/components/vael";
import { ProfileCompleteness, ProfileDocumentsSection, ProfileTrustPanel, TrustSummary } from "@/components/vael/trust";
import { CommercialCapabilityBadge } from "@/components/commercial/CommercialCards";
import { CityPage } from "@/components/city/CityShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCitySession } from "@/lib/citySession";
import { useCommercial } from "@/lib/commercialCore";
import { CM_CAPABILITIES, type CommercialProfile } from "@/lib/commercialStore";
import { DOC_TYPES } from "@/lib/vaelStore";

const BASE = "/districts/commercial";

function split(value: string | string[]) {
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CommercialProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { session, signIn } = useCitySession();
  const cm = useCommercial();
  const handle = username ?? "";
  const mine = session.signedIn && session.handle === handle;
  const profile = cm.profile(handle);
  const docs = cm.documents(handle);
  const connection = session.signedIn ? cm.openWith(session.handle, handle) : undefined;
  const revealed = mine || connection?.status === "connected";
  const signedIn = session.signedIn;
  const showDistrict = signedIn;

  if (!profile) {
    return (
      <CityPage>
        <PageHeader title="Commercial profile" kicker="Commercial" />
        <EmptyState
          title="No Commercial profile on this device"
          description={`@${handle} is not in local Commercial data.`}
          action={
            <Link to={BASE} className={buttonClassName({ variant: "outline" })}>
              Return to Commercial
            </Link>
          }
        />
      </CityPage>
    );
  }

  return (
    <CityPage>
      <PageHeader
        kicker="Company / provider"
        title={profile.displayName}
        description={`@${profile.handle} · ${profile.profileType === "company" ? "Company" : "Individual"}`}
        crumbs={[
          { label: "Commercial", href: BASE },
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
                const record = cm.handshake({
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
        <TrustSummary note="Unverified is the only honest state. Commercial does not invent company verification." />
        {profile.capability ? <CommercialCapabilityBadge capability={profile.capability} /> : null}
        {profile.sample ? <span className="text-caption text-muted">Sample on this device</span> : null}
      </div>
      <ProfileCompleteness
        values={[
          profile.displayName,
          profile.headline,
          profile.about,
          profile.capability,
          profile.area,
          profile.experience,
          profile.credentials,
        ]}
      />

      <Alert tone="info" title="What others can see" className="mt-6">
        Handle and display name stay public. Capability, area, rates, and case work follow the City rule: visible after
        you continue locally. Rates and case work stay closed to a counterpart until Handshake.
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
          <TabsTrigger value="work">Capabilities</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
          <TabsTrigger value="trust">Trust</TabsTrigger>
        </TabsList>
        <TabsContent value="about">
          {!showDistrict ? (
            <p className="text-body-sm text-muted">Continue locally to see Commercial profile details.</p>
          ) : (
            <dl className="space-y-4 text-body-sm">
              <Section
                label="Identity"
                body={`${profile.displayName} · @${profile.handle} · ${profile.profileType === "company" ? "Company" : "Individual"}`}
              />
              <Section label="About" body={profile.about || "Not written yet."} />
              <Section label="Service area" body={profile.area || "Not listed."} />
              <Section label="Rates" body={revealed ? profile.rates || "Not listed." : "Opens after a Handshake."} />
            </dl>
          )}
        </TabsContent>
        <TabsContent value="work">
          {!showDistrict ? (
            <p className="text-body-sm text-muted">Sign in to see capability details.</p>
          ) : (
            <dl className="space-y-4 text-body-sm">
              <Section label="Capability" body={profile.capability || "None listed."} />
              <Section label="Capability labels" body={profile.capabilities.join(", ") || "None listed."} />
              <Section label="Experience" body={profile.experience || "None listed."} />
              <Section
                label="Credential labels"
                body={profile.credentials.join(", ") || "None listed. This kit does not validate licenses."}
              />
              <Section
                label="Case work"
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
            emptyDescription="License, insurance, and capability statements live here. Types are City-generic."
          />
        </TabsContent>
        <TabsContent value="trust">
          <ProfileTrustPanel
            values={[
              profile.displayName,
              profile.headline,
              profile.about,
              profile.capability,
              profile.area,
              profile.experience,
              profile.credentials,
            ]}
            districtNote="Reputation is not modeled. Unverified is the only honest state. Commercial does not invent company verification."
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

export function CommercialProfileEditPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { session } = useCitySession();
  const cm = useCommercial();
  const [status, setStatus] = useState<"default" | "editing" | "saving" | "saved" | "error">("editing");
  const [error, setError] = useState("");
  const mine = cm.ensureMine();
  const [form, setForm] = useState<CommercialProfile | null>(mine ?? null);

  if (!session.signedIn || session.handle !== username || !form) {
    return (
      <CityPage>
        <EmptyState
          title="You can only edit your own Commercial profile on this device"
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

  function set<K extends keyof CommercialProfile>(key: K, value: CommercialProfile[K]) {
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
      cm.writeProfile(form);
      setError("");
      setStatus("saved");
    } catch {
      setError("Could not save on this device.");
      setStatus("error");
    }
  }

  const docs = cm.documents(form.handle);

  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Commercial profile"
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
              onChange={(e) => set("profileType", e.target.value as CommercialProfile["profileType"])}
            >
              <option value="company">Company</option>
              <option value="individual">Individual</option>
            </Select>
          </Field>
          <Field label="Headline" htmlFor="hl">
            <Input id="hl" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
          </Field>
        </section>
        <section className="space-y-5">
          <p className="vael-kicker">About</p>
          <Field label="About" htmlFor="about">
            <Textarea id="about" value={form.about} onChange={(e) => set("about", e.target.value)} />
          </Field>
          <Field label="Service area" htmlFor="area">
            <Input id="area" value={form.area} onChange={(e) => set("area", e.target.value)} />
          </Field>
          <Field label="Rates" htmlFor="rates" hint="Shown after Handshake.">
            <Input id="rates" value={form.rates} onChange={(e) => set("rates", e.target.value)} />
          </Field>
        </section>
        <section className="space-y-5">
          <p className="vael-kicker">Capabilities</p>
          <Field label="Capability" htmlFor="cap">
            <Select id="cap" value={form.capability} onChange={(e) => set("capability", e.target.value)}>
              <option value="">Select</option>
              {CM_CAPABILITIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Capability labels" htmlFor="caps" hint="Comma-separated.">
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
            hint="Your labels only. This kit does not validate licenses."
          >
            <Input
              id="cred"
              value={form.credentials.join(", ")}
              onChange={(e) => set("credentials", split(e.target.value))}
            />
          </Field>
        </section>
        <section className="space-y-5">
          <p className="vael-kicker">Case work</p>
          <Field label="Case work label" htmlFor="hlab" hint="Shown after Handshake.">
            <Input
              id="hlab"
              value={form.history[0]?.label ?? ""}
              onChange={(e) => set("history", [{ label: e.target.value, url: form.history[0]?.url ?? "" }])}
            />
          </Field>
          <Field label="Case work URL" htmlFor="hurl">
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
            License, insurance, capability statement — local preview. NOT YET CONNECTED to cloud storage.
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
                  cm.uploadDocument({
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
