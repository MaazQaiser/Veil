import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { DocumentCard, ProfileCard } from "@/components/vael";
import { ProfileCompleteness, ProfileDocumentsSection, ProfileTrustPanel, TrustSummary } from "@/components/vael/trust";
import { ConstructionTradeBadge } from "@/components/construction/ConstructionCards";
import { CityPage } from "@/components/city/CityShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCitySession } from "@/lib/citySession";
import { useConstruction } from "@/lib/constructionCore";
import { CX_TRADES, type ConstructionProfile } from "@/lib/constructionStore";
import { DOC_TYPES } from "@/lib/vaelStore";

const BASE = "/districts/contractor";

function split(value: string | string[]) {
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ConstructionProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { session, signIn } = useCitySession();
  const cx = useConstruction();
  const handle = username ?? "";
  const mine = session.signedIn && session.handle === handle;
  const profile = cx.profile(handle);
  const docs = cx.documents(handle);
  const connection = session.signedIn ? cx.openWith(session.handle, handle) : undefined;
  const revealed = mine || connection?.status === "connected";
  const signedIn = session.signedIn;
  const showDistrict = signedIn;

  if (!profile) {
    return (
      <CityPage>
        <PageHeader title="Construction profile" kicker="Construction Exchange" />
        <EmptyState
          title="No Construction profile on this device"
          description={`@${handle} is not in local Construction data.`}
          action={
            <Link to={BASE} className={buttonClassName({ variant: "outline" })}>
              Return to Construction
            </Link>
          }
        />
      </CityPage>
    );
  }

  return (
    <CityPage>
      <PageHeader
        kicker="Construction profile"
        title={profile.displayName}
        description={`@${profile.handle} · ${profile.profileType}`}
        crumbs={[
          { label: "Construction", href: BASE },
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
                const record = cx.handshake({
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
        <TrustSummary note="Unverified is the only honest state. Construction does not invent license or insurance verification." />
        {profile.trade ? <ConstructionTradeBadge trade={profile.trade} /> : null}
        {profile.sample ? <span className="text-caption text-muted">Sample on this device</span> : null}
      </div>
      <ProfileCompleteness
        values={[
          profile.displayName,
          profile.headline,
          profile.about,
          profile.trade,
          profile.capabilities,
          profile.experience,
          profile.credentials,
          profile.serviceArea,
        ]}
      />

      <Alert tone="info" title="What others can see" className="mt-6">
        Handle and display name stay public. Construction trade, service area, rates, and portfolio become visible after
        you continue locally. Rates and portfolio stay closed to a counterpart until Handshake.
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
          <TabsTrigger value="work">Trade</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
          <TabsTrigger value="trust">Trust</TabsTrigger>
        </TabsList>
        <TabsContent value="about">
          {!showDistrict ? (
            <p className="text-body-sm text-muted">Continue locally to see Construction profile details.</p>
          ) : (
            <dl className="space-y-4 text-body-sm">
              <Section label="Identity" body={`${profile.displayName} · @${profile.handle} · ${profile.profileType}`} />
              <Section label="About" body={profile.about || "Not written yet."} />
              <Section label="Service area" body={profile.serviceArea || "Not listed."} />
              <Section label="Rates" body={revealed ? profile.rates || "Not listed." : "Opens after a Handshake."} />
            </dl>
          )}
        </TabsContent>
        <TabsContent value="work">
          {!showDistrict ? (
            <p className="text-body-sm text-muted">Sign in to see trade details.</p>
          ) : (
            <dl className="space-y-4 text-body-sm">
              <Section label="Trade" body={profile.trade || "None listed."} />
              <Section label="Specialization" body={profile.specialization || "None listed."} />
              <Section label="Capabilities" body={profile.capabilities.join(", ") || "None listed."} />
              <Section label="Experience" body={profile.experience || "None listed."} />
              <Section
                label="Credentials"
                body={profile.credentials.join(", ") || "None listed. This kit does not validate licenses."}
              />
              <Section
                label="Portfolio"
                body={
                  revealed
                    ? profile.portfolio.map((item) => item.label).join(", ") || "None listed."
                    : "Opens after a Handshake."
                }
              />
            </dl>
          )}
        </TabsContent>
        <TabsContent value="docs">
          <ProfileDocumentsSection docs={docs} mine={mine} revealed={revealed} />
        </TabsContent>
        <TabsContent value="trust">
          <ProfileTrustPanel
            values={[
              profile.displayName,
              profile.headline,
              profile.about,
              profile.trade,
              profile.capabilities,
              profile.experience,
              profile.credentials,
              profile.serviceArea,
            ]}
            districtNote="Reputation is not modeled. Unverified is the only honest state. Construction does not invent license or insurance verification."
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

export function ConstructionProfileEditPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { session } = useCitySession();
  const cx = useConstruction();
  const [status, setStatus] = useState<"default" | "editing" | "saving" | "saved" | "error">("editing");
  const [error, setError] = useState("");
  const mine = cx.ensureMine();
  const [form, setForm] = useState<ConstructionProfile | null>(mine ?? null);

  if (!session.signedIn || session.handle !== username || !form) {
    return (
      <CityPage>
        <EmptyState
          title="You can only edit your own Construction profile on this device"
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

  function set<K extends keyof ConstructionProfile>(key: K, value: ConstructionProfile[K]) {
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
      cx.writeProfile(form);
      setError("");
      setStatus("saved");
    } catch {
      setError("Could not save on this device.");
      setStatus("error");
    }
  }

  const docs = cx.documents(form.handle);

  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Construction profile"
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
              onChange={(e) => set("profileType", e.target.value as ConstructionProfile["profileType"])}
            >
              <option value="individual">Professional</option>
              <option value="company">Company</option>
            </Select>
          </Field>
          <Field label="Headline" htmlFor="hl">
            <Input id="hl" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
          </Field>
        </section>
        <section className="space-y-5">
          <p className="vael-kicker">Company / professional</p>
          <Field label="About" htmlFor="about">
            <Textarea id="about" value={form.about} onChange={(e) => set("about", e.target.value)} />
          </Field>
          <Field label="Service area" htmlFor="area">
            <Input id="area" value={form.serviceArea} onChange={(e) => set("serviceArea", e.target.value)} />
          </Field>
          <Field label="Rates" htmlFor="rates" hint="Shown after Handshake.">
            <Input id="rates" value={form.rates} onChange={(e) => set("rates", e.target.value)} />
          </Field>
        </section>
        <section className="space-y-5">
          <p className="vael-kicker">Trade</p>
          <Field label="Trade" htmlFor="trade">
            <Select id="trade" value={form.trade} onChange={(e) => set("trade", e.target.value)}>
              <option value="">Select</option>
              {CX_TRADES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Specialization" htmlFor="spec">
            <Input id="spec" value={form.specialization} onChange={(e) => set("specialization", e.target.value)} />
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
            hint="Your labels only. This kit does not validate licenses or insurance."
          >
            <Input
              id="cred"
              value={form.credentials.join(", ")}
              onChange={(e) => set("credentials", split(e.target.value))}
            />
          </Field>
        </section>
        <section className="space-y-5">
          <p className="vael-kicker">Portfolio</p>
          <Field label="Portfolio label" htmlFor="pl">
            <Input
              id="pl"
              value={form.portfolio[0]?.label ?? ""}
              onChange={(e) => set("portfolio", [{ label: e.target.value, url: form.portfolio[0]?.url ?? "" }])}
            />
          </Field>
          <Field label="Portfolio URL" htmlFor="pu">
            <Input
              id="pu"
              value={form.portfolio[0]?.url ?? ""}
              onChange={(e) =>
                set("portfolio", [{ label: form.portfolio[0]?.label ?? "Link", url: e.target.value }])
              }
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
                  cx.uploadDocument({
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
