/**
 * Contractor Exchange Residential — homeowner projects + contractor opportunities.
 * Separate from the Matching Board and from /districts/residential.
 */

import { findAccountByEmail, findAccountByHandle, getAccounts, normalizeEmail } from "./accounts";
import { projectHref } from "./cxRoutes";
import { getOnboardingDraft } from "./onboarding";
import {
  ensureCxProfile,
  getActiveCxListing,
  getCxDocuments,
  getCxProfile,
  saveCxProfile,
  type ConstructionProfile,
} from "./constructionStore";
import {
  closeConnection,
  getConnection,
  getConnections,
  getLatestListing,
  getMessages,
  getNotices,
  openProjectHandshake,
  pushCoalescedNotice,
  sendMessage,
  type ConnectionRecord,
} from "./vaelStore";
import { RX_PROJECT_CATEGORIES, type RxProjectCategory } from "./rxExperience";

export { RX_PROJECT_CATEGORIES, type RxProjectCategory };

const KEYS = {
  projects: "vael_cx_projects_v1",
  vaelances: "vael_cx_vaelances_v1",
  interests: "vael_cx_interests_v1",
  questions: "vael_cx_questions_v1",
  active: "vael_cx_active_v1",
  seeded: "vael_cx_vaelance_seeded_v1",
  demoProject: "vael_cx_demo_project_v1",
} as const;

export const CX_LIVE_DAYS = 7;
export const CX_REMIND_DAY = 5;
export const CX_MAX_PHOTOS = 10;
export const CX_MAX_OPEN_HANDSHAKES = 3;
export const CX_MAX_FILE_CHARS = 350_000;

export const CX_TIMINGS = ["ASAP", "Within 30 days", "1–3 months", "Just planning"] as const;
export type CxTiming = (typeof CX_TIMINGS)[number];

export const CX_BUDGET_BANDS = [
  "Under $10,000",
  "$10,000 to $20,000",
  "$20,000 to $30,000",
  "$30,000 to $50,000",
  "$50,000 to $100,000",
  "Over $100,000",
  "Not sure yet",
] as const;
export type CxBudgetBand = (typeof CX_BUDGET_BANDS)[number];

export type CxProjectStatus = "draft" | "live" | "closed" | "expired";
export type CxProjectRole = "whole" | "specialty" | "either";
export type CxResponseGroup = "whole" | "specialty";

export type CxHistoryEntry = {
  at: string;
  kind: "created" | "published" | "edited" | "extended" | "closed" | "scope_change";
  note: string;
};

export type CxProject = {
  id: string;
  handle: string;
  saveEmail: string;
  savePhone: string;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  firstName: string;
  category: RxProjectCategory | "";
  description: string;
  photos: string[];
  video: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  timing: CxTiming | "";
  budgetBand: CxBudgetBand | "";
  status: CxProjectStatus;
  createdAt: string;
  publishedAt: string;
  liveUntil: string;
  closedAt: string;
  day5Reminded: boolean;
  history: CxHistoryEntry[];
};

export type CxVaelance = {
  handle: string;
  projectCategories: RxProjectCategory[];
  projectRole: CxProjectRole;
};

export type CxInterest = {
  id: string;
  projectId: string;
  contractorHandle: string;
  homeownerHandle: string;
  contractorInterested: boolean;
  homeownerInterested: boolean;
  savedByHomeowner: boolean;
  createdAt: string;
  connectionId: string;
};

export type CxQuestion = {
  id: string;
  projectId: string;
  fromHandle: string;
  body: string;
  createdAt: string;
  answer: string;
  answeredAt: string;
  /** Homeowner said this answer would change the project, and has not confirmed it yet. */
  scopeChangeRequested?: boolean;
  scopeChangeConfirmed: boolean;
};

type ActivePointer = { draftId: string; email: string };

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeCxProjects(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function daysFrom(iso: string, days: number) {
  return new Date(Date.parse(iso) + days * 86400000).toISOString();
}

function emptyProject(): CxProject {
  const createdAt = nowIso();
  return {
    id: id("cxp"),
    handle: "",
    saveEmail: "",
    savePhone: "",
    emailConfirmed: false,
    phoneConfirmed: false,
    firstName: "",
    category: "",
    description: "",
    photos: [],
    video: "",
    city: "",
    postalCode: "",
    streetAddress: "",
    timing: "",
    budgetBand: "",
    status: "draft",
    createdAt,
    publishedAt: "",
    liveUntil: "",
    closedAt: "",
    day5Reminded: false,
    history: [{ at: createdAt, kind: "created", note: "Draft started." }],
  };
}

function coverJacksonville(handle: string) {
  const profile = ensureCxProfile(handle);
  const area = `${profile.serviceArea} ${profile.location}`.toLowerCase();
  if (area.includes("jacksonville")) return;
  saveCxProfile({
    ...profile,
    serviceArea: [profile.serviceArea, "Jacksonville"].filter(Boolean).join(", "),
  });
}

function seedVaelances() {
  if (typeof localStorage === "undefined") return;
  if (!localStorage.getItem(KEYS.seeded)) {
    const current = read<CxVaelance[]>(KEYS.vaelances, []);
    const extra: CxVaelance[] = [
      {
        handle: "ridgeworks",
        projectCategories: ["Kitchen", "Bathroom", "Electrical", "Plumbing", "HVAC"],
        projectRole: "whole",
      },
      {
        handle: "oakcabinets",
        projectCategories: ["Kitchen"],
        projectRole: "specialty",
      },
    ];
    const handles = new Set(current.map((item) => item.handle));
    write(KEYS.vaelances, [...current, ...extra.filter((item) => !handles.has(item.handle))]);
    const oak = ensureCxProfile("oakcabinets");
    if (!oak.sample) {
      saveCxProfile({
        ...oak,
        displayName: "ABC Cabinetry",
        profileType: "company",
        headline: "Kitchen cabinetry",
        about: "Specialty cabinet work for kitchens.",
        trade: "Carpentry",
        specialization: "Cabinets",
        capabilities: ["Cabinets", "Countertops"],
        experience: "Eight years on this sample record.",
        serviceArea: "Jacksonville",
        credentials: [],
        location: "Jacksonville, FL",
        sample: true,
        availableNow: true,
        projects: [{ id: "oak_1", title: "Kitchen cabinet replacement", status: "Completed" }],
      });
    }
    localStorage.setItem(KEYS.seeded, "1");
  }
  coverJacksonville("ridgeworks");
  coverJacksonville("oakcabinets");
}

seedVaelances();

function expireStale(projects: CxProject[]): CxProject[] {
  const now = Date.now();
  let changed = false;
  const next = projects.map((project) => {
    if (project.status !== "live" || !project.liveUntil) return project;
    if (Date.parse(project.liveUntil) > now) return project;
    changed = true;
    return {
      ...project,
      status: "expired" as const,
      history: [...project.history, { at: nowIso(), kind: "closed" as const, note: "Project closed after 7 days." }],
    };
  });
  if (changed) write(KEYS.projects, next);
  return next;
}

function remindDay5(projects: CxProject[]) {
  const now = Date.now();
  let changed = false;
  const next = projects.map((project) => {
    if (project.status !== "live" || project.day5Reminded || !project.publishedAt || !project.liveUntil) return project;
    const start = Date.parse(project.publishedAt);
    const remindAt = start + CX_REMIND_DAY * 86400000;
    if (now < remindAt) return project;
    changed = true;
    if (project.handle) {
      pushCoalescedNotice({
        handle: project.handle,
        title: "Your project is closing soon",
        body: `${project.category || "Your project"} will close in 2 days. You can extend it if you still need help.`,
        href: projectHref(project.id),
        kind: "project_expiring",
        projectId: project.id,
      });
    }
    return { ...project, day5Reminded: true };
  });
  if (changed) write(KEYS.projects, next);
  return next;
}

function seedDemoLiveProject() {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(KEYS.demoProject)) return;
  const current = read<CxProject[]>(KEYS.projects, []);
  if (current.some((item) => item.handle === "priyahome" && item.status === "live")) {
    localStorage.setItem(KEYS.demoProject, "1");
    return;
  }
  // Display-only sample listing — deliberately not createAccount(), so
  // "Priya Home" is never a signable account (visitors could otherwise sign
  // in as her — a name they'll have just seen on the page — with any
  // password, since only Vael Out checks one).
  const account = { email: "priya.home@example.com", handle: "priyahome", phone: "9045550100" };
  const publishedAt = nowIso();
  const project: CxProject = {
    ...emptyProject(),
    id: "cxp_demo_kitchen",
    handle: account.handle,
    firstName: "Priya",
    category: "Kitchen",
    description: "Replace cabinets and countertops, keeping the existing layout. Cabinets are 1990s oak.",
    city: "Jacksonville",
    postalCode: "32202",
    timing: "Within 30 days",
    budgetBand: "$10,000 to $20,000",
    saveEmail: account.email,
    savePhone: account.phone,
    emailConfirmed: true,
    phoneConfirmed: true,
    status: "live",
    publishedAt,
    liveUntil: daysFrom(publishedAt, CX_LIVE_DAYS),
    history: [
      { at: publishedAt, kind: "created", note: "Draft started." },
      { at: publishedAt, kind: "published", note: "Project published for 7 days." },
    ],
  };
  write(KEYS.projects, [...current, project]);
  localStorage.setItem(KEYS.demoProject, "1");
}

export function getCxProjects(): CxProject[] {
  seedVaelances();
  seedDemoLiveProject();
  const all = expireStale(read<CxProject[]>(KEYS.projects, []));
  return remindDay5(all);
}

export function getCxProject(id: string) {
  return getCxProjects().find((item) => item.id === id);
}

function saveProject(next: CxProject) {
  const all = getCxProjects();
  const exists = all.some((item) => item.id === next.id);
  write(KEYS.projects, exists ? all.map((item) => (item.id === next.id ? next : item)) : [...all, next]);
  return next;
}

export function patchCxProject(projectId: string, patch: Partial<CxProject>) {
  const current = getCxProject(projectId);
  if (!current) throw new Error("Project not found.");
  return saveProject({ ...current, ...patch, id: current.id });
}

export function getActivePointer(): ActivePointer {
  return read<ActivePointer>(KEYS.active, { draftId: "", email: "" });
}

export function setActivePointer(next: Partial<ActivePointer>) {
  write(KEYS.active, { ...getActivePointer(), ...next });
}

export function startCxDraft(category: RxProjectCategory) {
  const pointer = getActivePointer();
  const existing = pointer.draftId ? getCxProject(pointer.draftId) : undefined;
  if (existing && existing.status === "draft") {
    const updated = saveProject({ ...existing, category });
    return updated;
  }
  const draft = { ...emptyProject(), category };
  saveProject(draft);
  setActivePointer({ draftId: draft.id });
  return draft;
}

export function getActiveDraft(): CxProject | undefined {
  const pointer = getActivePointer();
  if (pointer.draftId) {
    const byId = getCxProject(pointer.draftId);
    if (byId && byId.status === "draft") return byId;
  }
  if (pointer.email) {
    return getCxProjects()
      .filter((item) => item.status === "draft" && normalizeEmail(item.saveEmail) === normalizeEmail(pointer.email))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  }
  return undefined;
}

export function restoreDraftByEmail(email: string) {
  const wanted = normalizeEmail(email);
  setActivePointer({ email: wanted });
  const draft = getCxProjects()
    .filter((item) => item.status === "draft" && normalizeEmail(item.saveEmail) === wanted)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  if (draft) setActivePointer({ draftId: draft.id, email: wanted });
  return draft;
}

export function saveProjectContact(projectId: string, email: string, phone: string) {
  const wanted = normalizeEmail(email);
  const next = patchCxProject(projectId, { saveEmail: wanted, savePhone: phone.trim() });
  setActivePointer({ draftId: projectId, email: wanted });
  return next;
}

export function attachDraftToHandle(projectId: string, handle: string, firstName: string) {
  const account = findAccountByHandle(handle);
  return patchCxProject(projectId, {
    handle,
    firstName: firstName.trim() || account?.displayName.split(" ")[0] || "",
    saveEmail: account?.email || getCxProject(projectId)?.saveEmail || "",
    savePhone: account?.phone || getCxProject(projectId)?.savePhone || "",
  });
}

export function confirmCxEmail(projectId: string) {
  return patchCxProject(projectId, { emailConfirmed: true });
}

export function confirmCxPhone(projectId: string) {
  return patchCxProject(projectId, { phoneConfirmed: true });
}

export function intakeReady(project: CxProject | undefined) {
  if (!project) return false;
  return Boolean(
    project.category &&
      project.description.trim() &&
      project.city.trim() &&
      project.postalCode.trim() &&
      project.timing &&
      project.budgetBand,
  );
}

export function publishCxProject(projectId: string) {
  const project = getCxProject(projectId);
  if (!project) throw new Error("Project not found.");
  if (!intakeReady(project)) throw new Error("Finish describing the project before publishing.");
  if (!project.emailConfirmed || !project.phoneConfirmed) {
    throw new Error("Confirm email and phone before publishing.");
  }
  if (!project.handle) throw new Error("Create an account before publishing.");
  const publishedAt = nowIso();
  const next = saveProject({
    ...project,
    status: "live",
    publishedAt,
    liveUntil: daysFrom(publishedAt, CX_LIVE_DAYS),
    history: [...project.history, { at: publishedAt, kind: "published", note: "Project published for 7 days." }],
  });
  notifyEligibleContractors(next, "new_project", "New project matches what you work on", `${next.category} in ${next.city}`);
  notifyVaelInOfOpportunity(next);
  return next;
}

/** Tells every Vael In account on this device that a Vael Out project is live. */
export function notifyVaelInOfOpportunity(project: CxProject) {
  if (!project.handle || project.status !== "live" || !postedByVaelOut(project.handle)) return;
  const href = `/districts/contractor/opportunities/${project.id}`;
  for (const account of getAccounts()) {
    if (account.handle === project.handle || postedByVaelOut(account.handle)) continue;
    const intent = getOnboardingDraft(account.handle)?.intent;
    if (intent === "need") continue;
    pushCoalescedNotice({
      handle: account.handle,
      title: "Hey, you have an opportunity",
      body: "Wanna see?",
      href,
      kind: "vael_in_opportunity",
      projectId: project.id,
    });
  }
}

export function extendCxProject(projectId: string) {
  const project = getCxProject(projectId);
  if (!project) throw new Error("Project not found.");
  const at = nowIso();
  return saveProject({
    ...project,
    status: "live",
    liveUntil: daysFrom(at, CX_LIVE_DAYS),
    day5Reminded: false,
    history: [...project.history, { at, kind: "extended", note: "Project extended for 7 more days." }],
  });
}

export function closeCxProject(projectId: string) {
  const project = getCxProject(projectId);
  if (!project) throw new Error("Project not found.");
  const at = nowIso();
  return saveProject({
    ...project,
    status: "closed",
    closedAt: at,
    history: [...project.history, { at, kind: "closed", note: "Closed early." }],
  });
}

export function editLiveProject(
  projectId: string,
  patch: Partial<Pick<CxProject, "description" | "photos" | "video" | "city" | "postalCode" | "timing" | "budgetBand" | "streetAddress">>,
) {
  const project = getCxProject(projectId);
  if (!project) throw new Error("Project not found.");
  const publicChange = (["description", "photos", "video", "city", "postalCode", "timing", "budgetBand"] as const).some(
    (key) => patch[key] !== undefined,
  );
  if (project.status !== "live" && publicChange) throw new Error("This project is closed.");
  const previous = project.description.trim();
  const nextDescription = patch.description?.trim() ?? previous;
  const descriptionChanged = nextDescription !== previous;
  const at = nowIso();
  const saved = saveProject({
    ...project,
    ...patch,
    description: nextDescription,
    history: [
      ...project.history,
      {
        at,
        kind: "edited",
        note: descriptionChanged ? `Previous scope: ${previous}` : "Project details updated.",
      },
    ],
  });
  if (publicChange) {
    for (const row of interestsForProject(project.id).filter((item) => item.contractorInterested)) {
      pushCoalescedNotice({
        handle: row.contractorHandle,
        title: "Project updated",
        body: `The ${project.category} project was updated. Everyone is looking at the same version.`,
        href: `/districts/contractor/opportunities/${project.id}`,
        kind: "project_edited",
        projectId: project.id,
      });
    }
  }
  return saved;
}

export function originalProjectDescription(project: CxProject) {
  const previous = project.history.find((item) => item.note.startsWith("Previous scope:"));
  if (!previous) return project.description;
  return previous.note.replace(/^Previous scope:\s*/, "");
}

export function projectsForHandle(handle: string) {
  return getCxProjects()
    .filter((item) => item.handle === handle)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function liveCxProjects() {
  return getCxProjects().filter((item) => item.status === "live");
}

export function getVaelances(): CxVaelance[] {
  seedVaelances();
  return read<CxVaelance[]>(KEYS.vaelances, []);
}

export function getVaelance(handle: string) {
  return getVaelances().find((item) => item.handle === handle);
}

export function vaelanceReady(handle: string) {
  const row = getVaelance(handle);
  return Boolean(row && row.projectCategories.length > 0 && row.projectRole);
}

export function saveVaelance(next: CxVaelance) {
  const all = getVaelances();
  const exists = all.some((item) => item.handle === next.handle);
  write(
    KEYS.vaelances,
    exists ? all.map((item) => (item.handle === next.handle ? next : item)) : [...all, next],
  );
  return next;
}

export function responseGroupFor(role: CxProjectRole): CxResponseGroup {
  return role === "specialty" ? "specialty" : "whole";
}

function worksInProjectLocation(project: CxProject, handle: string) {
  const profile = getCxProfile(handle);
  const listing = getActiveCxListing(handle);
  const area = `${profile?.serviceArea ?? ""} ${profile?.location ?? ""} ${listing?.serviceArea ?? ""}`.toLowerCase();
  if (!area.trim() || !project.city.trim()) return false;
  const city = project.city.trim().toLowerCase();
  const zip = project.postalCode.trim().toLowerCase();
  if (area.includes(city)) return true;
  if (zip && area.includes(zip.slice(0, 3))) return true;
  return false;
}

/** A homeowner project does not require a role. Any chosen role can respond; the role only sets their group later. */
function roleFitsProject(role: CxProjectRole | undefined) {
  return role === "whole" || role === "specialty" || role === "either";
}

/** No project requires credentials yet. When one does, the contractor must already have each label. */
function credentialsAvailable(project: CxProject, handle: string) {
  const required = (project as CxProject & { requiredCredentials?: string[] }).requiredCredentials ?? [];
  if (required.length === 0) return true;
  const profile = getCxProfile(handle);
  const listing = getActiveCxListing(handle);
  const have = new Set([...(profile?.credentials ?? []), ...(listing?.credentials ?? [])].map((item) => item.toLowerCase()));
  return required.every((item) => have.has(item.toLowerCase()));
}

export function contractorEligibleFor(project: CxProject, handle: string) {
  if (project.status !== "live" || project.handle === handle) return false;
  const vaelance = getVaelance(handle);
  if (!vaelance || !project.category) return false;
  if (!vaelance.projectCategories.includes(project.category)) return false;
  if (!worksInProjectLocation(project, handle)) return false;
  if (!roleFitsProject(vaelance.projectRole)) return false;
  if (!credentialsAvailable(project, handle)) return false;
  return true;
}

export function alignmentScore(project: CxProject, handle: string) {
  const vaelance = getVaelance(handle);
  const profile = getCxProfile(handle);
  const listing = getActiveCxListing(handle);
  let score = 1;
  if (vaelance?.projectRole === "whole" || vaelance?.projectRole === "either") score += 1;
  if (project.timing === "ASAP" && (profile?.availableNow || listing?.availability)) score += 1;
  if ((profile?.credentials?.length ?? 0) + (listing?.credentials?.length ?? 0) > 0) score += 1;
  if ((profile?.projects?.length ?? 0) > 0) score += 1;
  if (listing) score += 1;
  return score;
}

export function eligibleContractorsFor(project: CxProject) {
  const handles = new Set(getVaelances().map((item) => item.handle));
  return [...handles].filter((handle) => contractorEligibleFor(project, handle));
}

export function opportunitiesForContractor(handle: string) {
  return liveCxProjects()
    .filter((project) => contractorEligibleFor(project, handle))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

/** The account that published this project is on the Vael Out side. */
export function postedByVaelOut(handle: string) {
  if (!handle) return false;
  if (getOnboardingDraft(handle)?.intent === "out") return true;
  return getLatestListing(handle)?.side === "out";
}

/**
 * Live opportunities a Vael In member should see: everything posted from a
 * Vael Out dashboard, plus any project they already match on category and area.
 */
export function opportunitiesForVaelIn(viewerHandle: string) {
  const fromOut = liveCxProjects().filter(
    (project) => project.handle && project.handle !== viewerHandle && postedByVaelOut(project.handle),
  );
  const matched = opportunitiesForContractor(viewerHandle).filter(
    (project) => !fromOut.some((item) => item.id === project.id),
  );
  return [...fromOut, ...matched].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

/** Projects this contractor has already responded to. Stays in Residential, not a separate dashboard. */
export function responsesForContractor(handle: string) {
  const ids = new Set(
    getInterests()
      .filter((item) => item.contractorHandle === handle && item.contractorInterested)
      .map((item) => item.projectId),
  );
  return getCxProjects()
    .filter((project) => ids.has(project.id))
    .sort((a, b) => Date.parse(b.publishedAt || b.createdAt) - Date.parse(a.publishedAt || a.createdAt));
}

function notifyEligibleContractors(project: CxProject, kind: string, title: string, body: string) {
  for (const handle of eligibleContractorsFor(project)) {
    pushCoalescedNotice({
      handle,
      title,
      body,
      href: `/districts/contractor/opportunities/${project.id}`,
      kind,
      projectId: project.id,
    });
  }
}

export function getInterests(): CxInterest[] {
  return read<CxInterest[]>(KEYS.interests, []);
}

export function interestsForProject(projectId: string) {
  return getInterests().filter((item) => item.projectId === projectId);
}

export function interestBetween(projectId: string, contractorHandle: string) {
  return getInterests().find((item) => item.projectId === projectId && item.contractorHandle === contractorHandle);
}

function saveInterest(next: CxInterest) {
  const all = getInterests();
  const exists = all.some((item) => item.id === next.id);
  write(KEYS.interests, exists ? all.map((item) => (item.id === next.id ? next : item)) : [...all, next]);
  return next;
}

export function openProjectHandshakesFor(homeownerHandle: string) {
  return getConnections().filter(
    (item) =>
      item.source === "project_interest" &&
      (item.status === "connected" || item.status === "pending") &&
      (item.requesterHandle === homeownerHandle || item.counterpartHandle === homeownerHandle),
  );
}

export function canHomeownerHandshake(homeownerHandle: string) {
  return openProjectHandshakesFor(homeownerHandle).length < CX_MAX_OPEN_HANDSHAKES;
}

export function contractorInterested(projectId: string, contractorHandle: string) {
  const project = getCxProject(projectId);
  if (!project || project.status !== "live" || !project.handle) throw new Error("Project is not live.");
  if (!contractorEligibleFor(project, contractorHandle)) throw new Error("Not eligible for this project.");
  const existing = interestBetween(projectId, contractorHandle);
  const row =
    existing ??
    saveInterest({
      id: id("cxi"),
      projectId,
      contractorHandle,
      homeownerHandle: project.handle,
      contractorInterested: true,
      homeownerInterested: false,
      savedByHomeowner: false,
      createdAt: nowIso(),
      connectionId: "",
    });
  const next = saveInterest({ ...row, contractorInterested: true, homeownerHandle: project.handle });
  pushCoalescedNotice({
    handle: project.handle,
    title: "A contractor responded",
    body: `${displayNameFor(contractorHandle)} is interested in your ${project.category} project.`,
    href: projectHref(project.id),
    kind: "contractor_responded",
    projectId,
  });
  return maybeOpenHandshake(next);
}

export function homeownerInterested(projectId: string, contractorHandle: string, homeownerHandle: string) {
  const project = getCxProject(projectId);
  if (!project || project.handle !== homeownerHandle) throw new Error("Project not found.");
  const existing = interestBetween(projectId, contractorHandle);
  if (!existing?.contractorInterested) throw new Error("That contractor has not responded yet.");
  if (!existing.connectionId && !canHomeownerHandshake(homeownerHandle)) {
    throw new Error("You already have 3 Handshakes open. Close one before starting another.");
  }
  const next = saveInterest({ ...existing, homeownerInterested: true });
  pushCoalescedNotice({
    handle: contractorHandle,
    title: "They want to connect",
    body: `${project.firstName || "The homeowner"} is interested in working with you.`,
    href: `/districts/contractor/opportunities/${projectId}`,
    kind: "homeowner_interested",
    projectId,
  });
  return maybeOpenHandshake(next);
}

/** Records that the homeowner is interested. Does not open a Handshake. */
export function signalHomeownerInterest(projectId: string, contractorHandle: string, homeownerHandle: string) {
  const project = getCxProject(projectId);
  if (!project || project.handle !== homeownerHandle) throw new Error("Project not found.");
  const existing = interestBetween(projectId, contractorHandle);
  if (!existing?.contractorInterested) throw new Error("That contractor has not responded yet.");
  if (existing.homeownerInterested) return existing;
  const next = saveInterest({ ...existing, homeownerInterested: true });
  pushCoalescedNotice({
    handle: contractorHandle,
    title: "They want to connect",
    body: `${project.firstName || "The homeowner"} is interested in working with you.`,
    href: `/districts/contractor/opportunities/${projectId}`,
    kind: "homeowner_interested",
    projectId,
  });
  return next;
}

function maybeOpenHandshake(interest: CxInterest) {
  if (!interest.contractorInterested || !interest.homeownerInterested) return interest;
  if (interest.connectionId) return interest;
  const connection = openProjectHandshake({
    homeownerHandle: interest.homeownerHandle,
    contractorHandle: interest.contractorHandle,
    projectId: interest.projectId,
  });
  return saveInterest({ ...interest, connectionId: connection.id });
}

export function toggleSavedContractor(projectId: string, contractorHandle: string, homeownerHandle: string) {
  const existing = interestBetween(projectId, contractorHandle);
  if (!existing) {
    return saveInterest({
      id: id("cxi"),
      projectId,
      contractorHandle,
      homeownerHandle,
      contractorInterested: false,
      homeownerInterested: false,
      savedByHomeowner: true,
      createdAt: nowIso(),
      connectionId: "",
    });
  }
  return saveInterest({ ...existing, savedByHomeowner: !existing.savedByHomeowner });
}

export type CxRespondent = {
  interest: CxInterest;
  handle: string;
  group: CxResponseGroup;
  alignment: number;
  vaelance?: CxVaelance;
  profile?: ConstructionProfile;
};

export function respondentsFor(project: CxProject): CxRespondent[] {
  return interestsForProject(project.id)
    .filter((item) => item.contractorInterested)
    .map((interest) => {
      const vaelance = getVaelance(interest.contractorHandle);
      return {
        interest,
        handle: interest.contractorHandle,
        group: responseGroupFor(vaelance?.projectRole ?? "whole"),
        alignment: alignmentScore(project, interest.contractorHandle),
        vaelance,
        profile: getCxProfile(interest.contractorHandle),
      };
    })
    .sort((a, b) => b.alignment - a.alignment);
}

export function bestMatchGroups(project: CxProject) {
  const all = respondentsFor(project);
  const threshold = all.length <= 2 ? 0 : all.map((item) => item.alignment).sort((a, b) => a - b)[Math.floor(all.length / 2)] ?? 0;
  const best = all.filter((item) => item.alignment >= threshold);
  return {
    whole: best.filter((item) => item.group === "whole"),
    specialty: best.filter((item) => item.group === "specialty"),
  };
}

export function getQuestions(): CxQuestion[] {
  return read<CxQuestion[]>(KEYS.questions, []);
}

export function questionsForProject(projectId: string) {
  return getQuestions()
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function askProjectQuestion(projectId: string, fromHandle: string, body: string) {
  const project = getCxProject(projectId);
  if (!project || project.status !== "live") throw new Error("Project is not live.");
  const question: CxQuestion = {
    id: id("cxq"),
    projectId,
    fromHandle,
    body: body.trim(),
    createdAt: nowIso(),
    answer: "",
    answeredAt: "",
    scopeChangeRequested: false,
    scopeChangeConfirmed: false,
  };
  write(KEYS.questions, [...getQuestions(), question]);
  if (project.handle) {
    pushCoalescedNotice({
      handle: project.handle,
      title: "A question on your project",
      body: question.body,
      href: projectHref(projectId),
      kind: "project_question",
      projectId,
    });
  }
  emit();
  return question;
}

export function proposedScopeText(current: string, answer: string) {
  return `${current.trim()}\n\nUpdate: ${answer.trim()}`;
}

/** Records an answer on the project. A scope change stays pending until the homeowner confirms it. */
export function answerProjectQuestion(questionId: string, answer: string, changesScope = false) {
  const all = getQuestions();
  const question = all.find((item) => item.id === questionId);
  if (!question) throw new Error("Question not found.");
  if (!answer.trim()) throw new Error("Write an answer first.");
  if (question.scopeChangeConfirmed) throw new Error("That change is already confirmed.");
  const nextQuestion: CxQuestion = {
    ...question,
    answer: answer.trim(),
    answeredAt: nowIso(),
    scopeChangeRequested: changesScope,
    scopeChangeConfirmed: false,
  };
  write(
    KEYS.questions,
    all.map((item) => (item.id === questionId ? nextQuestion : item)),
  );
  return nextQuestion;
}

export function keepCurrentScope(questionId: string, homeownerHandle: string) {
  const all = getQuestions();
  const question = all.find((item) => item.id === questionId);
  if (!question) throw new Error("Question not found.");
  const project = getCxProject(question.projectId);
  if (!project || project.handle !== homeownerHandle) throw new Error("Only the homeowner can confirm a scope change.");
  if (question.scopeChangeConfirmed) throw new Error("That change is already confirmed.");
  const nextQuestion: CxQuestion = { ...question, scopeChangeRequested: false };
  write(
    KEYS.questions,
    all.map((item) => (item.id === questionId ? nextQuestion : item)),
  );
  return nextQuestion;
}

/** Applies a pending scope change, keeps the previous scope in history, and notifies respondents. */
export function confirmProjectScopeChange(questionId: string, homeownerHandle: string) {
  const all = getQuestions();
  const question = all.find((item) => item.id === questionId);
  if (!question?.answer.trim() || !question.scopeChangeRequested) throw new Error("There is no scope change to confirm.");
  if (question.scopeChangeConfirmed) throw new Error("That change is already confirmed.");
  const project = getCxProject(question.projectId);
  if (!project || project.handle !== homeownerHandle) throw new Error("Only the homeowner can confirm a scope change.");
  const previous = project.description.trim();
  const at = nowIso();
  saveProject({
    ...project,
    description: proposedScopeText(previous, question.answer),
    history: [...project.history, { at, kind: "scope_change", note: `Previous scope: ${previous}` }],
  });
  const nextQuestion: CxQuestion = { ...question, scopeChangeConfirmed: true, scopeChangeRequested: false };
  write(
    KEYS.questions,
    all.map((item) => (item.id === questionId ? nextQuestion : item)),
  );
  const respondents = interestsForProject(project.id).filter((item) => item.contractorInterested);
  for (const row of respondents) {
    pushCoalescedNotice({
      handle: row.contractorHandle,
      title: "Project scope changed",
      body: `The ${project.category} project was updated. Everyone is looking at the same version.`,
      href: `/districts/contractor/opportunities/${project.id}`,
      kind: "scope_changed",
      projectId: project.id,
    });
  }
  return nextQuestion;
}

export function closeOtherHandshakes(homeownerHandle: string, keepConnectionId: string) {
  const open = openProjectHandshakesFor(homeownerHandle).filter((item) => item.id !== keepConnectionId);
  for (const item of open) closeConnection(item.id);
  return open.map((item) => item.id);
}

export function vaelanceSourceLabels(handle: string) {
  const docs = getCxDocuments(handle);
  const verified = docs.some((item) => item.publicFlag && (item.type === "license" || item.type === "insurance"));
  return {
    company: "Contractor provided" as const,
    licenses: verified ? ("Externally verified" as const) : ("Contractor provided" as const),
    activity: "VAEL activity" as const,
    history: "Contractor provided" as const,
    categories: "Contractor provided" as const,
  };
}

export function firstNameOf(project: CxProject) {
  if (project.firstName.trim()) return project.firstName.trim();
  if (project.handle) {
    const account = findAccountByHandle(project.handle);
    if (account?.displayName) return account.displayName.split(" ")[0] ?? account.displayName;
  }
  return "Homeowner";
}

export function displayNameFor(handle: string) {
  return getCxProfile(handle)?.displayName || findAccountByHandle(handle)?.displayName || handle;
}

export function publicProjectCard(project: CxProject) {
  return {
    id: project.id,
    category: project.category,
    city: project.city,
    postalCode: project.postalCode,
    budgetBand: project.budgetBand,
    timing: project.timing,
    postedAt: project.publishedAt,
    description: project.description,
    photos: project.photos,
    firstName: firstNameOf(project),
  };
}

export function revealedContacts(project: CxProject, connection: ConnectionRecord | undefined) {
  if (!connection || connection.status !== "connected" || connection.blocked) return null;
  const account = project.handle ? findAccountByHandle(project.handle) : undefined;
  const emailAccount = project.saveEmail ? findAccountByEmail(project.saveEmail) : undefined;
  return {
    fullName: account?.displayName || emailAccount?.displayName || firstNameOf(project),
    phone: account?.phone || project.savePhone,
    email: account?.email || project.saveEmail,
    address: [project.streetAddress, project.city, project.postalCode].filter(Boolean).join(", "),
  };
}

export function handshakeThreadReady(connection: ConnectionRecord | undefined) {
  return Boolean(connection && connection.status === "connected" && !connection.blocked);
}

/** Messages belong to this project Handshake. Other contractors never see the thread. */
export function projectThreadFor(projectId: string, connectionId: string, handle: string) {
  const connection = getConnection(connectionId);
  if (!connection || connection.blocked) return [];
  if (connection.status !== "connected" && connection.status !== "closed") return [];
  if (connection.source !== "project_interest" || connection.projectId !== projectId) return [];
  if (connection.requesterHandle !== handle && connection.counterpartHandle !== handle) return [];
  return getMessages(connectionId);
}

export function sendHandshakeMessage(connectionId: string, fromHandle: string, body: string, attachmentName?: string) {
  const connection = getConnection(connectionId);
  if (!connection || connection.source !== "project_interest") {
    throw new Error("Messages stay inside this Handshake.");
  }
  if (connection.requesterHandle !== fromHandle && connection.counterpartHandle !== fromHandle) {
    throw new Error("Messages stay inside this Handshake.");
  }
  return sendMessage(connectionId, fromHandle, body, attachmentName);
}

export function noticeCountFor(handle: string) {
  return getNotices(handle).length;
}

export function clearCxProjectsFor(handle: string, email?: string) {
  const wantedEmail = email ? normalizeEmail(email) : "";
  write(
    KEYS.projects,
    getCxProjects().filter((item) => item.handle !== handle && (!wantedEmail || normalizeEmail(item.saveEmail) !== wantedEmail)),
  );
  write(
    KEYS.interests,
    getInterests().filter((item) => item.contractorHandle !== handle && item.homeownerHandle !== handle),
  );
  write(
    KEYS.vaelances,
    getVaelances().filter((item) => item.handle !== handle || item.handle === "ridgeworks" || item.handle === "oakcabinets"),
  );
  const pointer = getActivePointer();
  if (pointer.draftId && !getCxProject(pointer.draftId)) write(KEYS.active, { draftId: "", email: "" });
}

export function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function looksLikePhone(value: string) {
  return /^[0-9+()\-.\s]{7,}$/.test(value.trim());
}
