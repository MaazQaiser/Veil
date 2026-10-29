import { DashboardShell } from "@/components/mt/DashboardShell";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  IconCheck,
  IconChevronDown,
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
import {
  communityPostKind,
  communityPostKindLabel,
  communityPostTitle,
  formatCommunityTime,
  getVisibleCommunityPosts,
} from "@/lib/communityStore";
import {
  CX_MAX_AREAS,
  RX_PROJECT_CATEGORIES,
  getVaelance,
  projectsForHandle,
  saveVaelance,
  type CxProjectRole,
  type RxProjectCategory,
} from "@/lib/cxProjectStore";
import { opportunityHref, opportunityStart, projectHref } from "@/lib/cxRoutes";
import { addTeamMember, getTeam, removeTeamMember, subscribeTeam } from "@/lib/profileTeam";
import { useCxProjects } from "@/lib/useCxProjects";
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

const SCOPES = [
  { value: "whole", label: "The whole project" },
  { value: "specialty", label: "A specialty" },
  { value: "either", label: "Either" },
] as const;

function Chip({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-caption font-medium text-accent">
      {children}
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label={`Remove ${String(children)}`} className="text-accent/70 hover:text-accent">
          ×
        </button>
      ) : null}
    </span>
  );
}

function SaveButton({ dirty, onClick }: { dirty: boolean; onClick: () => void }) {
  return (
    <Button type="button" disabled={!dirty} onClick={onClick} className="mt-5">
      {dirty ? "Save" : "Saved"}
    </Button>
  );
}

function PickerPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <p className="text-caption font-semibold uppercase tracking-[0.14em] text-accent">{title}</p>
      <p className="mt-1.5 flex items-center gap-1.5 text-caption text-muted">
        <IconLock className="h-3 w-3" />
        Provided by the member
      </p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Scope, the kinds of project and the places a member works in. Editable on your own profile. */
function ProjectDetails({ handle, mine }: { handle: string; mine: boolean }) {
  useCxProjects();
  const saved = getVaelance(handle);
  const savedCategories = saved?.projectCategories ?? [];
  const savedRole = saved?.projectRole ?? "";
  const savedAreas = saved?.areas ?? [];

  const [role, setRole] = useState<string>(savedRole || "whole");
  const [categories, setCategories] = useState<string[]>(savedCategories);
  const [areas, setAreas] = useState<string[]>(savedAreas);
  const [areaText, setAreaText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const projectsDirty = role !== (savedRole || "whole") || categories.join("|") !== savedCategories.join("|");
  const areasDirty = areas.join("|") !== savedAreas.join("|");

  function persist(patch: { role?: string; categories?: string[]; areas?: string[] }) {
    const current = getVaelance(handle);
    saveVaelance({
      handle,
      projectRole: (patch.role ?? current?.projectRole ?? "whole") as CxProjectRole,
      projectCategories: (patch.categories ?? current?.projectCategories ?? []) as RxProjectCategory[],
      areas: patch.areas ?? current?.areas ?? [],
    });
  }

  function addArea() {
    const value = areaText.trim();
    if (!value || areas.length >= CX_MAX_AREAS || areas.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    setAreas([...areas, value]);
    setAreaText("");
  }

  if (!mine) {
    if (savedCategories.length === 0 && savedAreas.length === 0 && !savedRole) return null;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoTile
          icon={<IconBriefcase className="h-4 w-4" />}
          label="Scope"
          value={SCOPES.find((item) => item.value === savedRole)?.label ?? "Not listed."}
        />
        <InfoTile icon={<IconBriefcase className="h-4 w-4" />} label="Projects they take on" value={listed(savedCategories.join(", "))} />
        <InfoTile icon={<IconMapPin className="h-4 w-4" />} label="Areas they work in" value={listed(savedAreas.join(", "))} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PickerPanel title="Projects">
        <Field
          label="Scope you take on"
          htmlFor="pd-scope"
          hint="Whether you run a whole job or do part of one. A homeowner sees whole-project and specialty contractors in separate groups."
        >
          <Select id="pd-scope" value={role} onChange={(event) => setRole(event.target.value)}>
            {SCOPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="mt-5" ref={menuRef}>
          <p className="text-label font-medium text-foreground">Projects you take on</p>
          <div className="relative mt-2">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-surface px-4 text-left text-body-sm text-foreground"
            >
              {categories.length === 0 ? "Select" : `${categories.length} selected`}
              <IconChevronDown className="h-4 w-4 text-muted" />
            </button>
            {menuOpen ? (
              <ul
                role="listbox"
                aria-multiselectable
                aria-label="Projects you take on"
                className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-surface-elevated p-1.5 shadow-md"
              >
                {RX_PROJECT_CATEGORIES.map((category) => {
                  const selected = categories.includes(category);
                  return (
                    <li key={category}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() =>
                          setCategories((prev) => (prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]))
                        }
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-body-sm text-foreground hover:bg-surface-muted"
                      >
                        {category}
                        {selected ? <IconCheck className="h-4 w-4 text-accent" /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
          {categories.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Chip key={category} onRemove={() => setCategories(categories.filter((item) => item !== category))}>
                  {category}
                </Chip>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-caption text-muted">The kinds of homeowner project you want to see. You only see projects of these kinds.</p>
        </div>
        <SaveButton dirty={projectsDirty} onClick={() => persist({ role, categories })} />
      </PickerPanel>

      <PickerPanel title="Areas you work in">
        <label htmlFor="pd-area" className="sr-only">
          Add a town or a county
        </label>
        <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-surface px-4">
          <IconMapPin className="h-4 w-4 shrink-0 text-muted" />
          <input
            id="pd-area"
            value={areaText}
            disabled={areas.length >= CX_MAX_AREAS}
            onChange={(event) => setAreaText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addArea();
              }
            }}
            placeholder="Type a town or a county…"
            className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-body-sm text-foreground shadow-none ring-0 placeholder:text-quiet focus:outline-none focus:ring-0"
          />
          <button type="button" onClick={addArea} disabled={!areaText.trim()} className="text-body-sm font-medium text-accent disabled:text-quiet">
            Add
          </button>
        </div>
        {areas.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {areas.map((area) => (
              <Chip key={area} onRemove={() => setAreas(areas.filter((item) => item !== area))}>
                {area}
              </Chip>
            ))}
          </div>
        ) : null}
        <p className="mt-3 text-caption text-muted">
          {areas.length} of {CX_MAX_AREAS} picked.
        </p>
        <p className="mt-1 text-caption text-muted">Pick up to {CX_MAX_AREAS} towns, or whole counties. You only see projects in these places.</p>
        <SaveButton dirty={areasDirty} onClick={() => persist({ areas })} />
      </PickerPanel>
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-body-sm text-muted">{children}</p>;
}

type ActivityItem = { id: string; at: string; title: string; meta: string; href?: string };

function TeamPanel({ handle, mine }: { handle: string; mine: boolean }) {
  const [, setTick] = useState(0);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  useEffect(() => subscribeTeam(() => setTick((n) => n + 1)), []);
  const team = getTeam(handle);

  return (
    <div className="space-y-4">
      {team.length === 0 ? (
        <EmptyNote>{mine ? "No team members yet. Add the people you work with." : "No team members listed."}</EmptyNote>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {team.map((member) => (
            <li key={member.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
              <Avatar name={member.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium text-foreground">{member.name}</p>
                {member.role ? <p className="truncate text-caption text-muted">{member.role}</p> : null}
              </div>
              {mine ? (
                <button
                  type="button"
                  onClick={() => removeTeamMember(handle, member.id)}
                  className="shrink-0 text-caption font-medium text-muted hover:text-foreground"
                  aria-label={`Remove ${member.name}`}
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {mine ? (
        <form
          className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            addTeamMember(handle, { name, role });
            setName("");
            setRole("");
          }}
        >
          <Field label="Name" htmlFor="team-name">
            <Input id="team-name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Role" htmlFor="team-role">
            <Input id="team-role" value={role} onChange={(event) => setRole(event.target.value)} />
          </Field>
          <Button type="submit" disabled={!name.trim()}>
            Add team member
          </Button>
        </form>
      ) : null}
    </div>
  );
}

/**
 * The profile, in seven tabs. Your own profile and anyone you are connected to show everything;
 * other visitors see what is public and a note where something opens after a Handshake.
 */
function ProfileTabs({
  profile,
  docs,
  mine,
  hiring,
  revealed,
  signedIn,
  listing,
  account,
  availabilityNote,
}: {
  profile: ProfileRecord;
  docs: ProfileDocument[];
  mine: boolean;
  hiring: boolean;
  revealed: boolean;
  signedIn: boolean;
  listing: ReturnType<typeof getLatestListing>;
  account: ReturnType<typeof findAccountByHandle>;
  availabilityNote: string;
}) {
  const vael = useVael();
  useCxProjects();
  const open = mine || revealed;
  const certifications = split(profile.credentials);
  const projects = projectsForHandle(profile.handle).filter((item) => (mine ? true : item.status === "live"));

  const activity: ActivityItem[] = [
    ...getVisibleCommunityPosts()
      .filter((post) => post.handle === profile.handle)
      .map((post) => ({
        id: `post-${post.id}`,
        at: post.createdAt,
        title: communityPostTitle(post),
        meta: `Community · ${communityPostKindLabel(communityPostKind(post))}`,
        href: `/feed/${post.id}`,
      })),
    ...projects
      .filter((item) => item.status !== "draft")
      .map((item) => ({
        id: `opp-${item.id}`,
        at: item.publishedAt || item.createdAt,
        title: `Posted an opportunity: ${item.category || "Project"}`,
        meta: "Opportunities",
        href: mine ? projectHref(item.id) : opportunityHref(item.id),
      })),
    ...(mine
      ? vael.myConnections.map((connection) => {
          const other = vael.otherParty(connection, profile.handle);
          const name = vael.profile(other)?.displayName || `@${other}`;
          return {
            id: `conn-${connection.id}`,
            at: connection.createdAt,
            title: connection.status === "connected" ? `Connected with ${name}` : `Handshake with ${name}`,
            meta: connection.status === "connected" ? "Handshake · connected" : `Handshake · ${connection.status}`,
            href: `/media-technology/connections/${connection.id}`,
          };
        })
      : []),
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 20);

  const hasExperience = Boolean(profile.experienceYears) || Boolean(profile.experience.trim());
  const editWork = `/media-technology/profile/${profile.handle}/edit#work`;

  return (
    <Tabs defaultValue="overview" className="mt-8">
      <TabsList>
        {[
          { id: "overview", label: "Overview", icon: <IconUser className="h-3.5 w-3.5" /> },
          { id: "projects", label: "Projects", icon: <IconBriefcase className="h-3.5 w-3.5" /> },
          { id: "history", label: "Work history", icon: <IconClock className="h-3.5 w-3.5" /> },
          { id: "portfolio", label: "Portfolio", icon: <IconImage className="h-3.5 w-3.5" /> },
          { id: "activity", label: "Activity", icon: <IconHandshake className="h-3.5 w-3.5" /> },
          { id: "documents", label: "Documents", icon: <IconDocument className="h-3.5 w-3.5" /> },
          { id: "team", label: "Team", icon: <IconUsers className="h-3.5 w-3.5" /> },
        ].map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5">
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        {!signedIn ? (
          <p className="text-body-sm text-muted">Sign in to see the full overview.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoTile icon={<IconUser className="h-4 w-4" />} label="Identity" value={`${profile.displayName} · @${profile.handle} · ${professionalTypeLabel(profile.profileType)}`} />
            <InfoTile icon={<IconBriefcase className="h-4 w-4" />} label="Professional title" value={listed(profile.headline)} />
            <InfoTile icon={<IconVael className="h-4 w-4" />} label="About" value={profile.bio.trim() || "Not written yet."} />
            <InfoTile
              icon={<IconMapPin className="h-4 w-4" />}
              label="Location"
              value={[profile.location, workPreferenceLabel(profile.workPreference)].filter(Boolean).join(" · ") || "Not listed."}
            />
            {hiring ? (
              <InfoTile icon={<IconLock className="h-4 w-4" />} label="Requirements" value={listed(profile.credentials)} />
            ) : (
              <>
                <InfoTile icon={<IconHandshake className="h-4 w-4" />} label="Discipline" value={listed(profile.disciplines.join(", "))} />
                <InfoTile icon={<IconVael className="h-4 w-4" />} label="Skills" value={listed(profile.skills.join(", "))} />
                <InfoTile icon={<IconVael className="h-4 w-4" />} label="Tools / technologies" value={listed(profile.tools.join(", "))} />
                <InfoTile
                  icon={<IconLock className="h-4 w-4" />}
                  label="Rates"
                  value={open ? listed(profile.rates) : "Opens after a Handshake."}
                  locked={!open}
                />
              </>
            )}
            {open ? (
              <>
                <InfoTile icon={<IconBriefcase className="h-4 w-4" />} label="Employment type" value={listing?.engagement || "Not listed."} />
                <InfoTile icon={<IconMapPin className="h-4 w-4" />} label="Service area" value={listing?.location || profile.location || "Not listed."} />
                <InfoTile icon={<IconClock className="h-4 w-4" />} label="Current availability" value={availabilityNote} />
                {!mine ? (
                  <InfoTile
                    icon={<IconLock className="h-4 w-4" />}
                    label="Contact"
                    value={[account?.email, account?.phone, listing?.contact].filter(Boolean).join(" · ") || "Not listed."}
                  />
                ) : null}
              </>
            ) : null}
          </div>
        )}
      </TabsContent>

      <TabsContent value="projects" className="mt-6 space-y-6">
        <ProjectDetails handle={profile.handle} mine={mine} />
        {projects.length > 0 ? (
          <div>
            <p className="mb-3 text-caption font-semibold uppercase tracking-[0.14em] text-muted">Opportunities posted</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {projects.map((item) => (
                <li key={item.id}>
                  <Link
                    to={mine ? projectHref(item.id) : opportunityHref(item.id)}
                    className="block rounded-xl border border-border bg-surface p-4 motion-safe:transition-colors hover:border-accent/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-body-sm font-medium text-foreground">{item.category || "Project"}</p>
                      <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-0.5 text-caption capitalize text-muted">{item.status}</span>
                    </div>
                    <p className="mt-1 text-caption text-muted">{[item.city, item.timing, item.budgetBand].filter(Boolean).join(" · ")}</p>
                    {item.description ? <p className="mt-2 line-clamp-2 text-body-sm text-muted">{item.description}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : mine ? (
          <p className="text-body-sm text-muted">
            You haven't posted an opportunity yet.{" "}
            <Link to={opportunityStart("create").to} state={opportunityStart("create").state} className="font-medium text-accent">
              Post an Opportunity
            </Link>
          </p>
        ) : null}
        {!mine && projects.length === 0 && !getVaelance(profile.handle) ? <EmptyNote>No project details yet.</EmptyNote> : null}
      </TabsContent>

      <TabsContent value="history" className="mt-6">
        {!hasExperience ? (
          <EmptyNote>
            No work history listed yet.
            {mine ? (
              <>
                {" "}
                <Link to={editWork} className="font-medium text-accent">
                  Add work history
                </Link>
              </>
            ) : null}
          </EmptyNote>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoTile
              icon={<IconClock className="h-4 w-4" />}
              label="Years of experience"
              value={profile.experienceYears ? `${profile.experienceYears} years` : "Not listed."}
            />
            <InfoTile icon={<IconBriefcase className="h-4 w-4" />} label="Experience" value={listed(profile.experience)} />
            <InfoTile icon={<IconLock className="h-4 w-4" />} label="Certifications" value={certifications.length > 0 ? certifications.join(", ") : "Not listed."} />
          </div>
        )}
      </TabsContent>

      <TabsContent value="portfolio" className="mt-6">
        {!open && !mine ? (
          <EmptyNote>The portfolio opens after a Handshake.</EmptyNote>
        ) : profile.portfolio.length === 0 ? (
          <EmptyNote>No portfolio items yet.</EmptyNote>
        ) : (
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
        )}
      </TabsContent>

      <TabsContent value="activity" className="mt-6">
        {activity.length === 0 ? (
          <EmptyNote>No activity yet.</EmptyNote>
        ) : (
          <ul className="space-y-3">
            {activity.map((item) => {
              const body = (
                <>
                  <p className="text-body-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-caption text-muted">
                    {item.meta} · {formatCommunityTime(item.at)}
                  </p>
                </>
              );
              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link to={item.href} className="block rounded-xl border border-border bg-surface p-4 motion-safe:transition-colors hover:border-accent/40">
                      {body}
                    </Link>
                  ) : (
                    <div className="rounded-xl border border-border bg-surface p-4">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="documents" className="mt-6 space-y-6">
        <ProfileDocumentsSection docs={docs} mine={mine} revealed={revealed} />
        <ProfileTrustPanel
          values={[profile.displayName, profile.headline, profile.bio, profile.disciplines, profile.experience, profile.credentials, profile.location]}
          districtNote="Reputation is not modeled. Unverified is the only honest state."
        />
      </TabsContent>

      <TabsContent value="team" className="mt-6">
        <TeamPanel handle={profile.handle} mine={mine} />
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
    <DashboardShell>
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

      {providerLocked ? null : (
        <ProfileTabs
          profile={profile}
          docs={docs}
          mine={mine}
          hiring={hiring}
          revealed={revealed}
          signedIn={signedIn}
          listing={listing}
          account={account}
          availabilityNote={availabilityNote}
        />
      )}
    </DashboardShell>
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
    <DashboardShell>
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
        <div className="relative isolate h-32 overflow-hidden bg-gradient-to-br from-accent via-[#FFE9AE] to-[#FFF6DC] dark:from-[#4A3410] dark:via-[#3A2B16] dark:to-[#241B10] md:h-40">
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
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-caption font-semibold uppercase tracking-[0.04em] text-accent dark:border-accent/40 dark:bg-accent/10 dark:text-accent"
              >
                <IconBriefcase className="h-3.5 w-3.5" />
                {discipline}
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-body-sm">
            <span className="flex items-center gap-1.5 font-medium text-accent dark:text-accent">
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
                  className={cn("h-1.5 w-1.5 rounded-full", vaeledIn || vaeledOut ? "bg-accent dark:bg-accent" : "bg-quiet")}
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
    </DashboardShell>
  );
}


