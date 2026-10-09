import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field, FormSection } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { TagField, splitTags as split } from "@/components/ui/tags";
import { SkillChips } from "@/components/mt/BoardMatchCard";
import { Avatar } from "@/components/ui/avatar";
import { DocumentCard } from "@/components/vael";
import { ImageIconButton, PortfolioEditor, ProfilePhotoField } from "@/components/vael/profileForm";
import { ProfileCompleteness, ProfileDocumentsSection, ProfileTrustPanel } from "@/components/vael/trust";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconBriefcase,
  IconCalendar,
  IconChevronLeft,
  IconClock,
  IconDocument,
  IconHandshake,
  IconImage,
  IconLink,
  IconLock,
  IconMapPin,
  IconUser,
  IconUsers,
  IconVael,
} from "@/components/ui/icons";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { cn } from "@/lib/cn";
import { findAccountByHandle } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import { formatDate } from "@/lib/time";
import { visibilityKindFromListing } from "@/lib/visibilityPlans";
import { DOC_TYPE_LABELS, normalizePortfolio, sectionErrors } from "@/lib/profileFields";
import { useVael } from "@/lib/vaelCore";
import {
  capabilityOptions,
  certificationOptions,
  disciplineOptions,
  DOC_TYPES,
  getLatestListing,
  hoursLeft,
  type ProfileDocument,
  type ProfileRecord,
  type VaelSide,
} from "@/lib/vaelStore";
import { ownVisibilityChip } from "@/lib/vaelCopy";

type DocType = (typeof DOC_TYPES)[number];

/** Generic district backdrop shown until someone uploads their own cover photo. */
const DEFAULT_COVER_IMAGE = "/scenes/city-skyline-wide.jpg";

function BackToDashboard() {
  return (
    <Link to={PRODUCT_HOME} className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground">
      <IconChevronLeft className="h-3.5 w-3.5" />
      Back to dashboard
    </Link>
  );
}

function WidgetIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-muted text-muted">
      {children}
    </span>
  );
}

const WORK_PREFERENCES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
] as const;

function workPreferenceLabel(value: ProfileRecord["workPreference"]) {
  return WORK_PREFERENCES.find((item) => item.value === value)?.label ?? "";
}

function professionalTypeLabel(type: ProfileRecord["profileType"]) {
  return type === "business" || type === "studio" ? "Organization" : "Professional";
}

function listed(value: string | undefined) {
  const text = value?.trim() ?? "";
  return text || "Not listed.";
}

/** Same fields as Complete your profile, shown on the member's own profile. */
function OwnProfileDetails({ profile, docs }: { profile: ProfileRecord; docs: ProfileDocument[] }) {
  const certifications = split(profile.credentials);
  return (
    <Tabs defaultValue="overview" className="mt-8">
      <TabsList>
        <TabsTrigger value="overview" className="flex items-center gap-1.5">
          <IconUser className="h-3.5 w-3.5" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="expertise" className="flex items-center gap-1.5">
          <IconHandshake className="h-3.5 w-3.5" />
          Expertise
        </TabsTrigger>
        <TabsTrigger value="portfolio" className="flex items-center gap-1.5">
          <IconVael className="h-3.5 w-3.5" />
          Portfolio
        </TabsTrigger>
        <TabsTrigger value="projects" className="flex items-center gap-1.5">
          <IconBriefcase className="h-3.5 w-3.5" />
          Projects
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-1.5">
          <IconDocument className="h-3.5 w-3.5" />
          Documents
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile icon={<IconUser className="h-4 w-4" />} label="Display name" value={listed(profile.displayName)} />
          <InfoTile icon={<IconUser className="h-4 w-4" />} label="Handle" value={`@${profile.handle}`} />
          <InfoTile icon={<IconMapPin className="h-4 w-4" />} label="Location" value={listed(profile.location)} />
          <InfoTile
            icon={<IconBriefcase className="h-4 w-4" />}
            label="Professional type"
            value={professionalTypeLabel(profile.profileType)}
          />
        </div>
      </TabsContent>
      <TabsContent value="expertise" className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile icon={<IconHandshake className="h-4 w-4" />} label="Discipline" value={listed(profile.disciplines.join(", "))} />
          <InfoTile icon={<IconVael className="h-4 w-4" />} label="Skills" value={listed(profile.skills.join(", "))} />
          <InfoTile icon={<IconVael className="h-4 w-4" />} label="Tools / technologies" value={listed(profile.tools.join(", "))} />
        </div>
      </TabsContent>
      <TabsContent value="portfolio" className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile icon={<IconBriefcase className="h-4 w-4" />} label="Professional title" value={listed(profile.headline)} />
          <InfoTile icon={<IconUser className="h-4 w-4" />} label="Short bio" value={listed(profile.bio)} />
          <InfoTile
            icon={<IconClock className="h-4 w-4" />}
            label="Years of experience"
            value={profile.experienceYears ? `${profile.experienceYears} years` : "Not listed."}
          />
          <InfoTile icon={<IconClock className="h-4 w-4" />} label="Experience" value={listed(profile.experience)} />
        </div>
      </TabsContent>
      <TabsContent value="projects" className="mt-6">
        {profile.portfolio.length > 0 ? (
          <ul className="space-y-3">
            {profile.portfolio.map((item) => (
              <li key={item.url || item.label} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-body-sm font-medium text-foreground">{item.label || item.url}</p>
                {item.url ? (
                  <a href={item.url} className="mt-1 block text-body-sm text-muted underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                    {item.url}
                  </a>
                ) : null}
                {item.note ? <p className="mt-1 text-caption text-muted">{item.note}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-muted">Not listed.</p>
        )}
      </TabsContent>
      <TabsContent value="documents" className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile
            icon={<IconLock className="h-4 w-4" />}
            label="Certifications"
            value={certifications.length > 0 ? certifications.join(", ") : "Not listed."}
          />
        </div>
        {docs.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {docs.map((doc) => (
              <li key={doc.id}>
                <DocumentCard title={doc.title} type={doc.type} status={doc.publicFlag ? "public" : "uploaded"} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-body-sm text-muted">No documents yet.</p>
        )}
      </TabsContent>
    </Tabs>
  );
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

  const listing = getLatestListing(handle);
  const side: VaelSide = listing?.side ?? "in";
  const hiring = side === "out";
  const providerLocked = !hiring && !revealed;
  const account = findAccountByHandle(handle);
  const availabilityNote = listing
    ? [
        listing.timeline?.includes("now") ? "Available right now" : "",
        listing.timeline?.includes("today") ? "Available today" : "",
        listing.timing,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Not visible yet.";

  const meta = [`@${profile.handle}`, profile.headline || (hiring ? "Hiring" : "Professional"), "Media & Technology"]
    .filter(Boolean)
    .join(" · ");

  return (
    <CityPage className="-mt-4 sm:-mt-6">
      <BackToDashboard />
      <div className="mt-4 overflow-hidden rounded-xl border border-border shadow-[0_1px_2px_rgba(11,12,12,0.04),0_18px_36px_-10px_rgba(11,12,12,0.12)] md:rounded-2xl">
        <div className="relative isolate h-28 overflow-hidden bg-surface-muted md:h-36">
          <img
            src={profile.coverUrl || DEFAULT_COVER_IMAGE}
            alt=""
            loading="lazy"
            className={cn("h-full w-full object-cover", profile.coverUrl && !revealed && !mine && "blur-sm saturate-50")}
          />
          {profile.coverUrl && !revealed && !mine ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/40 text-body-sm font-medium">
              Cover opens after Handshake
            </div>
          ) : null}
          {mine ? (
            <ImageIconButton
              label="Add background picture"
              className="absolute bottom-3 right-3 z-10"
              onChange={(dataUrl) => vael.writeProfile({ ...profile, coverUrl: dataUrl })}
            >
              <IconImage className="h-4 w-4" />
            </ImageIconButton>
          ) : null}
        </div>
        <div className="bg-white px-6 pb-6 pt-4 md:px-8 dark:bg-white/[0.04] dark:backdrop-blur-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 items-end gap-4 -mt-10 md:-mt-12">
              <span className="relative inline-flex">
                <Avatar
                  name={profile.displayName}
                  src={profile.avatarUrl}
                  size="xl"
                  locked={!revealed && !mine}
                  className="shrink-0 bg-white ring-4 ring-white shadow-[0_8px_24px_rgba(11,12,12,0.12)] dark:bg-white/10 dark:ring-[#0B0C0C]"
                />
                {mine ? (
                  <ImageIconButton
                    label="Add profile photo"
                    className="absolute -bottom-1 -right-1 z-10"
                    onChange={(dataUrl) => vael.writeProfile({ ...profile, avatarUrl: dataUrl })}
                  >
                    <IconUser className="h-3.5 w-3.5" />
                  </ImageIconButton>
                ) : null}
              </span>
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-h3 font-medium tracking-tight text-foreground">{profile.displayName}</h1>
                <p className="mt-1 truncate text-body-sm text-muted">{meta}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {mine ? (
                <Link to={`/media-technology/profile/${session.handle}/edit`} className={buttonClassName({ variant: "outline" })}>
                  Edit profile
                </Link>
              ) : null}
              {mine ? (
                <Link
                  to={hiring ? "/media-technology/vael?create=1&side=out" : "/media-technology/vael?create=1&side=in"}
                  className={buttonClassName()}
                >
                  {hiring ? "Vael Out" : "Set availability"}
                </Link>
              ) : signedIn && handle !== session.handle && connection?.status !== "connected" ? (
                <Button
                  className="rounded-full"
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
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {profile.sample ? <p className="mt-6 text-caption text-muted">Sample on this device</p> : null}
      {providerLocked ? null : (
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
      )}

      <div className="mt-6 flex gap-3 rounded-xl border border-border bg-surface-muted px-5 py-4">
        <WidgetIcon>
          <IconLock className="h-4 w-4" />
        </WidgetIcon>
        <div>
          <p className="text-body-sm font-medium text-foreground">What others can see</p>
          <p className="mt-1 text-body-sm text-muted">
            {hiring
              ? "Handle and display name stay public. What they're hiring for and requirements become visible after you continue locally. Links and documents stay closed to a counterpart until Handshake."
              : mine
                ? "This is your profile. Other people can see that you are available. Your full profile and contact open for them after a Handshake."
                : revealed
                  ? "You're connected. The full VAEL IN profile and contact are open."
                  : "Availability is visible. The full profile and contact stay closed until a Handshake."}
          </p>
        </div>
      </div>

      {fromMatch && !mine ? (
        <p className="mt-4 text-body-sm text-muted">Matched via availability. Full details open after a Handshake.</p>
      ) : null}

      {providerLocked ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-5">
          <p className="text-body font-medium text-foreground">Available</p>
          <p className="mt-2 text-body-sm text-muted">{availabilityNote}</p>
          <p className="mt-2 text-body-sm text-muted">The full profile opens after a Handshake.</p>
        </div>
      ) : null}

      {showDistrict && !providerLocked && !(mine && !hiring) && profile.skills.length > 0 ? (
        <div className="mt-8">
          <SkillChips skills={profile.skills} max={8} />
        </div>
      ) : null}

      {mine && !hiring ? <OwnProfileDetails profile={profile} docs={docs} /> : null}

      {providerLocked || (mine && !hiring) ? null : (
      <Tabs defaultValue="about" className="mt-8">
        <TabsList className="gap-1.5 rounded-full border-none bg-surface-muted p-1.5">
          <PillTab value="about" icon={<IconUser className="h-3.5 w-3.5" />}>
            Identity
          </PillTab>
          <PillTab value="work" icon={<IconHandshake className="h-3.5 w-3.5" />}>
            {hiring ? "Requirements" : "Capabilities"}
          </PillTab>
          <PillTab value="docs" icon={<IconDocument className="h-3.5 w-3.5" />}>
            Documents
          </PillTab>
          <PillTab value="trust" icon={<IconUsers className="h-3.5 w-3.5" />}>
            Trust
          </PillTab>
        </TabsList>
        <TabsContent value="about" className="mt-6">
          {!showDistrict ? (
            <p className="text-body-sm text-muted">Continue locally to see district profile details.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile
                icon={<IconUser className="h-4 w-4" />}
                label="Identity"
                value={`${profile.displayName} · @${profile.handle} · ${profile.profileType}`}
              />
              <InfoTile icon={<IconVael className="h-4 w-4" />} label="About" value={profile.bio || "Not written yet."} />
              <InfoTile
                icon={<IconClock className="h-4 w-4" />}
                label="Location"
                value={
                  [profile.location, workPreferenceLabel(profile.workPreference)].filter(Boolean).join(" · ") ||
                  "Not listed."
                }
              />
              {!hiring ? (
                <InfoTile
                  icon={<IconLock className="h-4 w-4" />}
                  label="Rates"
                  value={revealed ? profile.rates || "Not listed." : "Opens after a Handshake."}
                  locked={!revealed}
                />
              ) : null}
            </div>
          )}
        </TabsContent>
        <TabsContent value="work" className="mt-6">
          {!showDistrict ? (
            <p className="text-body-sm text-muted">{hiring ? "Sign in to see requirements." : "Sign in to see capabilities."}</p>
          ) : hiring ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile
                icon={<IconLock className="h-4 w-4" />}
                label="Requirements"
                value={profile.credentials || "None listed."}
              />
              <InfoTile
                icon={<IconDocument className="h-4 w-4" />}
                label="Links"
                value={
                  revealed
                    ? profile.portfolio.map((item) => item.label).join(", ") || "None listed."
                    : "Opens after a Handshake."
                }
                locked={!revealed}
              />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile icon={<IconHandshake className="h-4 w-4" />} label="Capabilities" value={profile.disciplines.join(", ") || "None listed."} />
              <InfoTile icon={<IconVael className="h-4 w-4" />} label="Skills" value={profile.skills.join(", ") || "None listed."} />
              <InfoTile icon={<IconVael className="h-4 w-4" />} label="Tools" value={profile.tools.join(", ") || "None listed."} />
              <InfoTile
                icon={<IconClock className="h-4 w-4" />}
                label="Experience"
                value={
                  [profile.experienceYears ? `${profile.experienceYears} years` : "", profile.experience]
                    .filter(Boolean)
                    .join(" · ") || "None listed."
                }
              />
              <InfoTile
                icon={<IconLock className="h-4 w-4" />}
                label="Credentials"
                value={profile.credentials || "None listed. Labels only — not a verified credential record."}
              />
              <InfoTile
                icon={<IconDocument className="h-4 w-4" />}
                label="Portfolio"
                value={
                  revealed
                    ? profile.portfolio.map((item) => item.label).join(", ") || "None listed."
                    : "Opens after a Handshake."
                }
                locked={!revealed}
              />
              {revealed ? (
                <>
                  <InfoTile icon={<IconBriefcase className="h-4 w-4" />} label="Employment type" value={listing?.engagement || "Not listed."} />
                  <InfoTile
                    icon={<IconBriefcase className="h-4 w-4" />}
                    label="Project categories"
                    value={(profile.offers ?? []).join(", ") || listing?.category || "Not listed."}
                  />
                  <InfoTile icon={<IconHandshake className="h-4 w-4" />} label="Participation" value={profile.specialization || "Not listed."} />
                  <InfoTile
                    icon={<IconDocument className="h-4 w-4" />}
                    label={profile.profileType === "business" ? "Workstation" : "Own gear"}
                    value={listing?.requirements || "Not listed."}
                  />
                  <InfoTile icon={<IconMapPin className="h-4 w-4" />} label="Service area" value={listing?.location || profile.location || "Not listed."} />
                  <InfoTile icon={<IconClock className="h-4 w-4" />} label="Current availability" value={availabilityNote} />
                  <InfoTile
                    icon={<IconLock className="h-4 w-4" />}
                    label="Contact"
                    value={[account?.email, account?.phone, listing?.contact].filter(Boolean).join(" · ") || "Not listed."}
                  />
                </>
              ) : null}
            </div>
          )}
          {showDistrict && revealed && profile.portfolio.length > 0 ? (
            <ul className="mt-3 space-y-2 text-body-sm">
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
        </TabsContent>
        <TabsContent value="docs" className="mt-6">
          <ProfileDocumentsSection docs={docs} mine={mine} revealed={revealed} />
        </TabsContent>
        <TabsContent value="trust" className="mt-6">
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
      )}
    </CityPage>
  );
}

function PillTab({ value, icon, children }: { value: string; icon: ReactNode; children: ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="-mb-0 flex items-center gap-1.5 rounded-full border-b-0 px-3.5 py-2 text-button font-medium text-muted aria-selected:bg-[#0B0C0C] aria-selected:text-white dark:aria-selected:bg-accent dark:aria-selected:text-[#0B0C0C]"
    >
      {icon}
      {children}
    </TabsTrigger>
  );
}

function InfoTile({
  icon,
  label,
  value,
  locked,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  locked?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2.5">
        <WidgetIcon>{icon}</WidgetIcon>
        <p className="text-caption font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
      </div>
      <p className={cn("mt-2.5 text-body-sm", locked ? "text-muted" : "text-foreground")}>{value}</p>
    </div>
  );
}

export function ProfileEditPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { session } = useCitySession();
  const vael = useVael();
  const [status, setStatus] = useState<"default" | "editing" | "saving" | "saved" | "error">("editing");
  const [error, setError] = useState("");
  const [docType, setDocType] = useState<DocType>(DOC_TYPES[0]);
  const EDIT_TABS = ["identity", "expertise", "work", "projects", "documents"] as const;
  const [tab, setTab] = useState<(typeof EDIT_TABS)[number]>("identity");

  useEffect(() => {
    const next = hash.replace("#", "");
    if (EDIT_TABS.includes(next as (typeof EDIT_TABS)[number])) {
      setTab(next as (typeof EDIT_TABS)[number]);
    }
  }, [hash]);
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

  const side: VaelSide = vael.latestListing?.side ?? "in";
  const hiring = side === "out";

  function set<K extends keyof ProfileRecord>(key: K, value: ProfileRecord[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setStatus("editing");
  }

  function setPicture(key: "avatarUrl" | "coverUrl", dataUrl: string) {
    if (!form) return;
    set(key, dataUrl);
    const stored = vael.profile(form.handle);
    if (stored) vael.writeProfile({ ...stored, [key]: dataUrl });
  }

  function save() {
    if (!form) return false;
    const nextErrors = {
      ...sectionErrors("identity", form, side),
      ...sectionErrors("expertise", form, side),
      ...sectionErrors("work", form, side),
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
      headline: form.headline.trim() || form.disciplines[0] || "",
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
  const joinedAt = findAccountByHandle(form.handle)?.createdAt;
  const certifications = split(form.credentials);
  const skillOptions = capabilityOptions("skills");
  const toolOptions = capabilityOptions("tools");
  const certOptions = certificationOptions();

  const vaelStatusKind = visibilityKindFromListing(vael.latestListing);
  const vaeledIn = (vaelStatusKind === "in" || vaelStatusKind === "expiring") && vael.latestListing?.side !== "out";
  const vaeledOut =
    vaelStatusKind === "out" || ((vaelStatusKind === "in" || vaelStatusKind === "expiring") && vael.latestListing?.side === "out");
  const vaelVisibleHours =
    vael.latestListing && (vaeledIn || vaeledOut) ? hoursLeft(vael.latestListing.expiresAt) : null;

  function submit() {
    if (!form) return;
    if (!save()) return;
    navigate(`/media-technology/profile/${form.handle}`);
  }

  return (
    <CityPage className="-mt-4 sm:-mt-6">
      <BackToDashboard />
      <div className="mt-4 min-w-0">
        <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
          {hiring ? "Edit your hiring profile" : "Edit your professional profile"}
        </h1>
        <p className="mt-1 text-body-sm text-muted">
          {hiring
            ? "Identity, what you're hiring for, and optional detail. Availability stays on Vael Out."
            : "Identity, what you do, the work you show, and optional proof. Availability stays on Vael In."}
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border shadow-[0_1px_2px_rgba(11,12,12,0.04),0_18px_36px_-10px_rgba(11,12,12,0.12)] md:rounded-2xl">
        <div className="relative isolate h-32 overflow-hidden bg-gradient-to-br from-[#FFC555] via-[#FFE9AE] to-[#FFF6DC] dark:from-[#4A3410] dark:via-[#3A2B16] dark:to-[#241B10] md:h-40">
          {form.coverUrl ? (
            <>
              <img src={form.coverUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent dark:from-[#0B0C0C] dark:via-[#0B0C0C]/20" />
            </>
          ) : null}
          <ImageIconButton
            label="Add background picture"
            className="absolute bottom-3 right-3 z-10"
            onChange={(dataUrl) => setPicture("coverUrl", dataUrl)}
          >
            <IconImage className="h-4 w-4" />
          </ImageIconButton>
        </div>
        <div className="bg-white px-6 pb-5 pt-4 md:px-8 dark:bg-white/[0.04] dark:backdrop-blur-xl">
          <div className="flex items-end justify-between gap-4">
            <span className="relative inline-flex">
              <Avatar
                name={form.displayName || form.handle}
                src={form.avatarUrl}
                size="xl"
                className="-mt-9 shrink-0 bg-white ring-4 ring-white shadow-[0_8px_24px_rgba(11,12,12,0.12)] dark:bg-white/10 dark:ring-[#0B0C0C] md:-mt-10"
              />
              <ImageIconButton
                label="Add profile photo"
                className="absolute -bottom-1 -right-1 z-10"
                onChange={(dataUrl) => setPicture("avatarUrl", dataUrl)}
              >
                <IconUser className="h-3.5 w-3.5" />
              </ImageIconButton>
            </span>
          </div>

          <p className="mt-3 truncate text-h3 font-semibold tracking-tight text-foreground">
            {form.displayName || form.handle}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 text-caption font-semibold uppercase tracking-[0.04em] text-muted">
              <IconLock className="h-3.5 w-3.5" />
              Unverified
            </span>
            {form.disciplines.slice(0, 2).map((discipline) => (
              <span
                key={discipline}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#FFC555]/40 bg-[#FFC555]/10 px-3 py-1 text-caption font-semibold uppercase tracking-[0.04em] text-[#C99A28] dark:border-accent/40 dark:bg-accent/10 dark:text-accent"
              >
                <IconBriefcase className="h-3.5 w-3.5" />
                {discipline}
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-body-sm">
            <span className="flex items-center gap-1.5 font-medium text-[#C99A28] dark:text-accent">
              @{form.handle}
            </span>
            {form.portfolio[0]?.url ? (
              <a
                href={form.portfolio[0].url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-muted hover:text-foreground"
              >
                <IconLink className="h-3.5 w-3.5" />
                {form.portfolio[0].url.replace(/^https?:\/\//, "")}
              </a>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-body-sm text-muted">
              {form.location ? (
                <span className="flex items-center gap-1.5">
                  <IconMapPin className="h-4 w-4" />
                  {form.location}
                </span>
              ) : null}
              {joinedAt ? (
                <span className="flex items-center gap-1.5">
                  <IconCalendar className="h-4 w-4" />
                  Start Date: {formatDate(joinedAt)}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-caption font-medium uppercase tracking-[0.08em] text-muted">
                <span
                  aria-hidden
                  className={cn("h-1.5 w-1.5 rounded-full", vaeledIn || vaeledOut ? "bg-[#FFC555] dark:bg-accent" : "bg-quiet")}
                />
                {ownVisibilityChip(vaeledIn ? "in" : vaeledOut ? "out" : null)}
                {vaelVisibleHours !== null ? ` · ${vaelVisibleHours}h left` : ""}
              </span>
              <button type="submit" form="edit-profile-form" className={buttonClassName({ size: "sm" })}>
                {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save profile"}
              </button>
            </div>
          </div>
          {error ? (
            <p role="alert" className="mt-2 text-right text-caption text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <form
        id="edit-profile-form"
        className="mt-10"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
      <Tabs value={tab} onValueChange={(next) => setTab(next as (typeof EDIT_TABS)[number])} defaultValue="identity">
        <TabsList>
          <TabsTrigger value="identity" className="flex items-center gap-1.5">
            <IconUser className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          {!hiring ? (
            <TabsTrigger value="expertise" className="flex items-center gap-1.5">
              <IconHandshake className="h-3.5 w-3.5" />
              Expertise
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="work" className="flex items-center gap-1.5">
            <IconVael className="h-3.5 w-3.5" />
            {hiring ? "What you need" : "Portfolio"}
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-1.5">
            <IconBriefcase className="h-3.5 w-3.5" />
            {hiring ? "Links" : "Projects"}
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1.5">
            <IconDocument className="h-3.5 w-3.5" />
            Documents
          </TabsTrigger>
        </TabsList>
        <TabsContent value="identity" className="mt-8">
        <FormSection title="Overview">
          <ProfilePhotoField
            name={form.displayName || form.handle}
            src={form.avatarUrl}
            coverSrc={form.coverUrl}
            onChange={(dataUrl) => setPicture("avatarUrl", dataUrl)}
            onCoverChange={(dataUrl) => setPicture("coverUrl", dataUrl)}
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
          <Field label={hiring ? "How you're hiring" : "Professional type"} htmlFor="pt">
            <Select
              id="pt"
              value={form.profileType === "studio" ? "business" : form.profileType}
              onChange={(e) => set("profileType", e.target.value as ProfileRecord["profileType"])}
            >
              <option value="individual">{hiring ? "Individual" : "Professional"}</option>
              <option value="business">Organization</option>
            </Select>
          </Field>
        </FormSection>
        </TabsContent>

        {!hiring ? (
        <TabsContent value="expertise" className="mt-8">
        <FormSection
          title="What do you do?"
          note="Discipline, skills, and tools feed matches. These are the important inputs."
        >
          <TagField
            id="disc"
            label="Discipline"
            values={form.disciplines}
            options={disciplineOptions()}
            placeholder="Search or add a discipline"
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
        </TabsContent>
        ) : null}

        <TabsContent value="work" className="mt-8">
        {hiring ? (
        <FormSection title="What you need" note="What you're hiring for, and what the work involves.">
          <Field label="What are you hiring for?" htmlFor="hl" hint="The role or need, in a few words.">
            <Input id="hl" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
          </Field>
          <Field label="Describe what you need" htmlFor="bio" hint="What the work involves and what a great fit looks like.">
            <Textarea id="bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
        </FormSection>
        ) : (
        <FormSection title="Portfolio" note="Recommended. A short bio, experience, and links to what you have made.">
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
        </FormSection>
        )}
        </TabsContent>

        <TabsContent value="projects" className="mt-8">
        <FormSection
          title={hiring ? "Links" : "Projects"}
          note={
            hiring
              ? "Company website, job post, or a brief. Optional description on each."
              : "Links to what you have made — a project, a case study, or a site. Optional description on each."
          }
        >
          <PortfolioEditor items={form.portfolio} onChange={(next) => set("portfolio", next)} />
        </FormSection>
        </TabsContent>

        <TabsContent value="documents" className="mt-8">
        <FormSection
          title="Documents"
          note={
            hiring
              ? "Optional. A job brief, scope of work, or a spec — not required to continue."
              : "Optional. License, insurance, and a capability statement are proof — not required to continue."
          }
        >
          <TagField
            id="cert"
            label={hiring ? "Requirements" : "Certifications"}
            hint={
              hiring
                ? "Skills or certifications the person you hire should have. Optional."
                : "Optional. Listed on this device — not verified by VAEL."
            }
            values={certifications}
            options={hiring ? skillOptions : certOptions}
            placeholder={hiring ? "Search or add a requirement" : "Search or add a certification"}
            onChange={(next) => set("credentials", next.join(", "))}
          />
          <Field
            label="Documents"
            htmlFor="doc-type"
            hint={
              hiring
                ? "Job brief, scope of work, or a spec — held on this device."
                : "Held on this device — not connected to cloud storage."
            }
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
        </TabsContent>
      </Tabs>
      </form>
    </CityPage>
  );
}


