import { useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field, FormSection } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { TagField, splitTags as split } from "@/components/ui/tags";
import { SkillChips } from "@/components/mt/BoardMatchCard";
import { Avatar } from "@/components/ui/avatar";
import { DocumentCard } from "@/components/vael";
import { PortfolioEditor, ProfilePhotoField } from "@/components/vael/profileForm";
import { ProfileCompleteness, ProfileDocumentsSection, ProfileTrustPanel } from "@/components/vael/trust";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCitySession } from "@/lib/citySession";
import { DOC_TYPE_LABELS, normalizePortfolio, PROFILE_FIELDS, requiredFieldsFilled, sectionErrors } from "@/lib/profileFields";
import { useVael } from "@/lib/vaelCore";
import {
  capabilityOptions,
  certificationOptions,
  DOC_TYPES,
  M_T_DISCIPLINES,
  type ProfileDocument,
  type ProfileRecord,
} from "@/lib/vaelStore";

type DocType = (typeof DOC_TYPES)[number];

const WORK_PREFERENCES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
] as const;

function workPreferenceLabel(value: ProfileRecord["workPreference"]) {
  return WORK_PREFERENCES.find((item) => item.value === value)?.label ?? "";
}

export function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { session } = useCitySession();
  const vael = useVael();
  const [params] = useSearchParams();
  const fromMatch = params.get("from") === "match";
  const handle = username ?? "";
  const mine = session.signedIn && session.handle === handle;
  const profile = vael.profile(handle);
  const docs = vael.documents(handle);
  const connection = session.signedIn ? vael.openWith(session.handle, handle) : undefined;
  const revealed = mine || connection?.status === "connected";
  const signedIn = session.signedIn;
  const showDistrict = signedIn;

  if (!profile) {
    return (
      <CityPage>
        <PageHeader title="Profile" kicker="Media & Technology" />
        <EmptyState
          title="No profile on this device"
          description={`@${handle} is not in local prototype data.`}
          action={
            <Link to="/media-technology" className={buttonClassName({ variant: "outline" })}>
              Return to Media & Technology
            </Link>
          }
        />
      </CityPage>
    );
  }

  return (
    <CityPage>
      <PageHeader
        lead={<Avatar name={profile.displayName} src={profile.avatarUrl} size="xl" locked={!revealed && !mine} />}
        title={profile.displayName}
        description={[`@${profile.handle}`, profile.headline || "Professional", "Media & Technology"]
          .filter(Boolean)
          .join(" · ")}
        primaryAction={
          mine ? (
            <Link to="/media-technology/veil?create=1" className={buttonClassName()}>
              Set availability
            </Link>
          ) : signedIn && handle !== session.handle && connection?.status !== "connected" ? (
            <Button
              onClick={() => {
                const record = vael.handshake({
                  fromHandle: session.handle,
                  toHandle: handle,
                  source: "handshake",
                });
                navigate(`/media-technology/connections/${record.id}`);
              }}
            >
              Request Handshake
            </Button>
          ) : connection?.status === "connected" ? (
            <Link to={`/media-technology/connections/${connection.id}`} className={buttonClassName()}>
              Open conversation
            </Link>
          ) : !signedIn ? (
            <Link to={JOIN_ROUTE} className={buttonClassName()}>
              Join VAEL
            </Link>
          ) : null
        }
        secondaryAction={
          mine ? (
            <Link to={`/media-technology/profile/${session.handle}/edit`} className={buttonClassName({ variant: "outline" })}>
              Edit Profile
            </Link>
          ) : undefined
        }
      />

      {profile.sample ? <p className="mt-6 text-caption text-muted">Sample on this device</p> : null}
      <div className="mt-6">
        <ProfileCompleteness
          values={[
            profile.displayName,
            profile.headline,
            profile.bio,
            profile.disciplines,
            profile.experience,
            profile.credentials,
            profile.location,
          ]}
        />
      </div>

      <Alert tone="info" title="What others can see" className="mt-6">
        Handle and display name stay public. District bio, capabilities, rates, and portfolio become visible after you
        continue locally. Rates and portfolio stay closed to a counterpart until Handshake.
      </Alert>

      {fromMatch && !mine ? (
        <p className="mt-4 text-body-sm text-muted">Matched via availability. Full details open after a Handshake.</p>
      ) : null}

      {profile.coverUrl ? (
        <figure className="relative mt-8 overflow-hidden rounded-xl border border-border">
          <img
            src={profile.coverUrl}
            alt={revealed ? `Work by ${profile.displayName}` : ""}
            loading="lazy"
            className={revealed || mine ? "h-48 w-full object-cover md:h-64" : "h-48 w-full object-cover blur-sm saturate-50 md:h-64"}
          />
          {!revealed && !mine ? (
            <figcaption className="absolute inset-0 flex items-center justify-center bg-background/40 text-body-sm font-medium">
              Cover opens after Handshake
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {showDistrict && profile.skills.length > 0 ? (
        <div className="mt-8">
          <SkillChips skills={profile.skills} max={8} />
        </div>
      ) : null}

      <Tabs defaultValue="about" className="mt-8">
        <TabsList>
          <TabsTrigger value="about">Identity</TabsTrigger>
          <TabsTrigger value="work">Capabilities</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
          <TabsTrigger value="trust">Trust</TabsTrigger>
        </TabsList>
        <TabsContent value="about">
          {!showDistrict ? (
            <p className="text-body-sm text-muted">Continue locally to see district profile details.</p>
          ) : (
            <dl className="space-y-4 text-body-sm">
              <Section label="Identity" body={`${profile.displayName} · @${profile.handle} · ${profile.profileType}`} />
              <Section label="About" body={profile.bio || "Not written yet."} />
              <Section
                label="Location"
                body={[profile.location, workPreferenceLabel(profile.workPreference)]
                  .filter(Boolean)
                  .join(" · ") || "Not listed."}
              />
              <Section
                label="Rates"
                body={revealed ? profile.rates || "Not listed." : "Opens after a Handshake."}
                locked={!revealed}
              />
            </dl>
          )}
        </TabsContent>
        <TabsContent value="work">
          {!showDistrict ? (
            <p className="text-body-sm text-muted">Sign in to see capabilities.</p>
          ) : (
            <dl className="space-y-4 text-body-sm">
              <Section label="Capabilities" body={profile.disciplines.join(", ") || "None listed."} />
              <Section label="Skills" body={profile.skills.join(", ") || "None listed."} />
              <Section label="Tools" body={profile.tools.join(", ") || "None listed."} />
              <Section
                label="Experience"
                body={[
                  profile.experienceYears ? `${profile.experienceYears} years` : "",
                  profile.experience,
                ]
                  .filter(Boolean)
                  .join(" · ") || "None listed."}
              />
              <Section
                label="Credentials"
                body={profile.credentials || "None listed. Labels only — not a verified credential record."}
              />
              <Section
                label="Portfolio"
                body={
                  revealed
                    ? profile.portfolio.map((item) => item.label).join(", ") || "None listed."
                    : "Opens after a Handshake."
                }
                locked={!revealed}
              />
              {revealed && profile.portfolio.length > 0 ? (
                <ul className="space-y-2 text-body-sm">
                  {profile.portfolio.map((item) => (
                    <li key={item.url}>
                      <a href={item.url} className="underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                        {item.label || item.url}
                      </a>
                      {item.note ? <p className="text-caption text-muted">{item.note}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
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
              profile.bio,
              profile.disciplines,
              profile.experience,
              profile.credentials,
              profile.location,
            ]}
            districtNote="Reputation is not modeled. Unverified is the only honest state."
          />
        </TabsContent>
      </Tabs>
    </CityPage>
  );
}

function Section({ label, body, locked }: { label: string; body: string; locked?: boolean }) {
  return (
    <div>
      <dt className="vael-kicker">{label}</dt>
      <dd className={locked ? "mt-1 text-muted" : "mt-1"}>{body}</dd>
    </div>
  );
}

export function ProfileEditPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { session } = useCitySession();
  const vael = useVael();
  const [status, setStatus] = useState<"default" | "editing" | "saving" | "saved" | "error">("editing");
  const [error, setError] = useState("");
  const [docType, setDocType] = useState<DocType>(DOC_TYPES[0]);
  const mine = vael.ensureMine();
  const [form, setForm] = useState<ProfileRecord | null>(mine ?? null);

  if (!session.signedIn) {
    return (
      <CityPage>
        <EmptyState
          title="Sign in to edit your profile"
          description="A local handle on this device is required."
          action={
            <div className="flex flex-wrap gap-3">
              <Link to={JOIN_ROUTE} className={buttonClassName()}>
                Join VAEL
              </Link>
              <Link to="/sign-in" className={buttonClassName({ variant: "outline" })}>
                Sign in
              </Link>
            </div>
          }
        />
      </CityPage>
    );
  }

  if (session.handle !== username) {
    return <Navigate to={`/media-technology/profile/${session.handle}/edit`} replace />;
  }

  if (!form) {
    return (
      <CityPage>
        <EmptyState
          title="No profile on this device"
          action={
            <Link to={JOIN_ROUTE} className={buttonClassName({ variant: "outline" })}>
              Join VAEL
            </Link>
          }
        />
      </CityPage>
    );
  }

  function set<K extends keyof ProfileRecord>(key: K, value: ProfileRecord[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setStatus("editing");
  }

  function save() {
    if (!form) return false;
    const nextErrors = {
      ...sectionErrors("identity", form),
      ...sectionErrors("expertise", form),
    };
    if (Object.keys(nextErrors).length > 0) {
      setError(Object.values(nextErrors)[0] ?? "Name is required.");
      setStatus("error");
      return false;
    }
    const record = {
      ...form,
      displayName: form.displayName.trim(),
      location: form.location.trim(),
      headline: form.headline.trim() || form.disciplines[0] || form.displayName,
      portfolio: normalizePortfolio(form.portfolio),
    };
    setStatus("saving");
    try {
      vael.writeProfile(record);
      setForm(record);
      setError("");
      setStatus("saved");
      return true;
    } catch {
      setError("Could not save on this device.");
      setStatus("error");
      return false;
    }
  }

  const docs = vael.documents(form.handle);
  const certifications = split(form.credentials);
  const skillOptions = capabilityOptions("skills");
  const toolOptions = capabilityOptions("tools");
  const certOptions = certificationOptions();

  function submit() {
    if (!form) return;
    if (!save()) return;
    navigate(`/media-technology/profile/${form.handle}`);
  }

  return (
    <CityPage width="narrow">
      <PageHeader
        title="Edit your professional profile"
        description="Identity, what you do, the work you show, and optional proof. Availability stays on Veil In."
        crumbs={[
          { label: `@${form.handle}`, href: `/media-technology/profile/${form.handle}` },
          { label: "Edit" },
        ]}
      />
      <form
        className="mt-10 max-w-narrow space-y-14"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <FormSection title="Identity">
          <ProfilePhotoField
            name={form.displayName || form.handle}
            src={form.avatarUrl}
            onChange={(dataUrl) => set("avatarUrl", dataUrl)}
          />
          <Field label="Display name" htmlFor="dn" required>
            <Input id="dn" value={form.displayName} onChange={(e) => set("displayName", e.target.value)} />
          </Field>
          <Field label="Handle" htmlFor="hn" hint="Set when you continued on this device.">
            <Input id="hn" value={`@${form.handle}`} readOnly className="bg-surface-muted text-muted" />
          </Field>
          <Field label="Location" htmlFor="loc" required>
            <Input id="loc" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
          <Field label="Professional type" htmlFor="pt">
            <Select
              id="pt"
              value={form.profileType}
              onChange={(e) => set("profileType", e.target.value as ProfileRecord["profileType"])}
            >
              <option value="individual">Independent professional</option>
              <option value="studio">Studio</option>
              <option value="business">Agency or company</option>
            </Select>
          </Field>
          <Field label="Work preference" htmlFor="wp">
            <Select
              id="wp"
              value={form.workPreference ?? ""}
              onChange={(e) =>
                set("workPreference", (e.target.value || undefined) as ProfileRecord["workPreference"])
              }
            >
              <option value="">Select a preference</option>
              {WORK_PREFERENCES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
        </FormSection>

        <FormSection
          title="What do you do?"
          note="Discipline, skills, and tools feed matches. These are the important inputs."
        >
          <TagField
            id="disc"
            label="Discipline"
            values={form.disciplines}
            options={[...M_T_DISCIPLINES]}
            placeholder="Search disciplines"
            onChange={(next) => set("disciplines", next)}
          />
          <TagField
            id="sk"
            label="Skills"
            values={form.skills}
            options={skillOptions}
            placeholder="Search or add a skill"
            onChange={(next) => set("skills", next)}
          />
          <TagField
            id="tools"
            label="Tools / technologies"
            values={form.tools}
            options={toolOptions}
            placeholder="Search or add a tool"
            onChange={(next) => set("tools", next)}
          />
        </FormSection>

        <FormSection title="Show your work" note="Recommended. A short bio, experience, and links to what you have made.">
          <Field label="Professional title" htmlFor="hl" hint="How you would introduce yourself on a project.">
            <Input id="hl" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
          </Field>
          <Field label="Short bio" htmlFor="bio" hint="A few lines. Opens to a counterpart after a Handshake.">
            <Textarea id="bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
          <Field label="Years of experience" htmlFor="yrs">
            <Input
              id="yrs"
              type="number"
              min={0}
              max={60}
              inputMode="numeric"
              value={form.experienceYears ?? ""}
              onChange={(e) => set("experienceYears", e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </Field>
          <Field label="Experience" htmlFor="exp" hint="What you specialise in, in a sentence or two.">
            <Textarea id="exp" value={form.experience} onChange={(e) => set("experience", e.target.value)} />
          </Field>
          <div>
            <p className="text-label font-medium text-foreground">Portfolio</p>
            <p className="mt-1 text-label text-muted">Links to projects or a site. Optional description on each.</p>
            <div className="mt-4">
              <PortfolioEditor items={form.portfolio} onChange={(next) => set("portfolio", next)} />
            </div>
          </div>
          <Field label="Rates" htmlFor="rates" hint="Stays closed to a counterpart until a Handshake opens.">
            <Input id="rates" value={form.rates} onChange={(e) => set("rates", e.target.value)} />
          </Field>
        </FormSection>

        <FormSection
          title="Credentials"
          note="Optional. License, insurance, and a capability statement are proof — not required to continue."
        >
          <TagField
            id="cert"
            label="Certifications"
            hint="Optional. Listed on this device — not verified by VAEL."
            values={certifications}
            options={certOptions}
            placeholder="Search or add a certification"
            onChange={(next) => set("credentials", next.join(", "))}
          />
          <Field
            label="Documents"
            htmlFor="doc-type"
            hint="Held on this device — not connected to cloud storage."
          >
            <div className="flex flex-col gap-3">
              <Select id="doc-type" value={docType} onChange={(e) => setDocType(e.target.value as DocType)}>
                {DOC_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {DOC_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
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
                      handle: form.handle,
                      type: docType,
                      title: file.name,
                      publicFlag: false,
                      dataUrl: String(reader.result),
                    });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </Field>
          {docs.length > 0 ? (
            <ul className="space-y-3">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <DocumentCard title={doc.title} type={doc.type} status={doc.publicFlag ? "public" : "uploaded"} />
                </li>
              ))}
            </ul>
          ) : null}
        </FormSection>

        <ProfileReady profile={form} documents={docs} />

        {error ? (
          <p role="alert" className="text-caption text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={status === "saving"}>
            Save profile
          </Button>
          <Link to="/media-technology/veil?create=1" className={buttonClassName({ variant: "ghost" })}>
            Set availability
          </Link>
        </div>
      </form>
    </CityPage>
  );
}

function ProfileReady({
  profile,
  documents,
}: {
  profile: ProfileRecord;
  documents: ProfileDocument[];
}) {
  const rows: Array<[string, boolean]> = [
    ["Identity", PROFILE_FIELDS.filter((field) => field.section === "identity" && field.tier === "required").every((field) => field.filled(profile))],
    ["Expertise", PROFILE_FIELDS.filter((field) => field.section === "expertise" && field.tier === "required").every((field) => field.filled(profile))],
    ["Work", PROFILE_FIELDS.filter((field) => field.section === "work").some((field) => field.filled(profile))],
    ["Credentials", PROFILE_FIELDS.filter((field) => field.section === "credentials").some((field) => field.filled(profile, documents))],
  ];
  const done = requiredFieldsFilled(profile);
  return (
    <section className="rounded-xl border border-border bg-surface-muted px-6 py-5">
      <p className="vael-kicker">{done ? "Profile ready" : "Profile so far"}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center gap-2 text-body-sm">
            <span className={value ? "text-success" : "text-quiet"} aria-hidden>
              {value ? "✓" : "—"}
            </span>
            <span className={value ? "text-foreground" : "text-muted"}>{label}</span>
            <span className="sr-only">{value ? "complete" : "not filled in yet"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}


