/**
 * The admin console's data. Like the rest of this demo it lives on this device (localStorage).
 *
 * The admin login below is a DEMO credential, the same way the Vael Out sample account has one. It
 * is not security: a real build checks it on a server. Nothing here protects data from someone who
 * opens the browser tools.
 */
import { findAccountByHandle, getAccounts, type CityAccount } from "./accounts";
import { demoPhoto } from "./adminDemo";
import { getCmListings } from "./commercialStore";
import { getCxListings } from "./constructionStore";
import {
  PERSON_REPORT_REASONS,
  PROJECT_REPORT_REASONS,
  getCxProject,
  getCxProjects,
  getInterests,
  getReports,
  resolveCxReport,
  type CxReport,
} from "./cxProjectStore";
import { districts } from "./districts";
import { getActiveDistrictId } from "./myDistricts";
import { onboardingComplete } from "./onboarding";
import { getRxListings } from "./residentialStore";
import { getTxListings } from "./truckingStore";
import { connectionDistrict, getConnections, getListings, getProfile, pushNotice } from "./vaelStore";

/* ------------------------------------------------------------------ keys */

const KEYS = {
  session: "vael_admin_session_v1",
  audit: "vael_admin_audit_v1",
  status: "vael_admin_account_status_v1",
  guides: "vael_admin_guides_v1",
  help: "vael_admin_help_v1",
  pages: "vael_admin_pages_v1",
  returned: "vael_admin_founding_returned_v1",
  staff: "vael_admin_staff_v1",
  ownerSince: "vael_admin_owner_since_v1",
} as const;

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeAdmin(fn: Listener) {
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
  listeners.forEach((fn) => fn());
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const nowIso = () => new Date().toISOString();

/* ------------------------------------------------------------------ sign-in */

export const ADMIN_EMAIL = "admin@vael.com";
export const ADMIN_PASSWORD = "admin123";
export const ADMIN_NAME = "Vael Admin";
export const ADMIN_HOME = "/admin";

/**
 * "not_admin": this is not the admin sign-in, so the normal member flow takes over.
 * "wrong_password": the admin email with the wrong password.
 */
export function adminLoginCheck(identity: string, password: string): "ok" | "wrong_password" | "not_admin" {
  const who = identity.trim().toLowerCase();
  if (who !== ADMIN_EMAIL && who !== "admin") return "not_admin";
  return password === ADMIN_PASSWORD ? "ok" : "wrong_password";
}

export function isAdminSignedIn() {
  return read<{ signedIn?: boolean }>(KEYS.session, {}).signedIn === true;
}

export function adminSignIn() {
  write(KEYS.session, { signedIn: true, at: nowIso() });
  logAdminAction("Signed in", ADMIN_NAME);
}

export function adminSignOut() {
  write(KEYS.session, { signedIn: false });
}

/* ------------------------------------------------------------------ audit log */

export type AuditEntry = { id: string; at: string; action: string; detail: string };

export function getAuditLog(): AuditEntry[] {
  return read<AuditEntry[]>(KEYS.audit, []);
}

/** Every admin action leaves a line here, so there is always a record of who did what and when. */
export function logAdminAction(action: string, detail: string) {
  write(KEYS.audit, [{ id: uid("aud"), at: nowIso(), action, detail }, ...getAuditLog()].slice(0, 200));
}

/* ------------------------------------------------------------------ admins */

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  /** When they were added. For the owner, when this admin area was first set up. */
  addedAt: string;
  role: "owner" | "admin";
  /** A removed admin has lost access but is still on the list, so access can be given back. */
  status: "active" | "removed";
};

type StoredAdmin = Omit<StaffMember, "role">;

function storedAdmins() {
  return read<StoredAdmin[]>(KEYS.staff, []);
}

/** The owner is the account that signs in here. It is always first and cannot be removed. */
function ownerRow(): StaffMember {
  let since = "";
  if (typeof localStorage !== "undefined") {
    since = localStorage.getItem(KEYS.ownerSince) ?? "";
    if (!since) {
      since = nowIso();
      localStorage.setItem(KEYS.ownerSince, since);
    }
  }
  return { id: "owner", name: ADMIN_NAME, email: ADMIN_EMAIL, addedAt: since || nowIso(), role: "owner", status: "active" };
}

/** Everyone who can use this area: the owner first, then the admins the owner added, oldest first. */
export function adminStaff(): StaffMember[] {
  const admins = [...storedAdmins()]
    .sort((a, b) => Date.parse(a.addedAt) - Date.parse(b.addedAt))
    .map((item): StaffMember => ({ ...item, role: "admin" }));
  return [ownerRow(), ...admins];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Adds another admin. They work in this area only and have no part of the member side. */
export function addAdmin(name: string, email: string, addedAt = nowIso()) {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanName) throw new Error("Enter their name.");
  if (!cleanEmail) throw new Error("Enter their email.");
  if (!EMAIL_PATTERN.test(cleanEmail)) throw new Error("That email does not look right.");
  const existing = adminStaff().find((item) => item.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error(
      existing.role === "owner"
        ? "That is the owner's email."
        : existing.status === "removed"
          ? "They were removed earlier. Restore them from the list instead."
          : "They are already an admin.",
    );
  }
  const row: StoredAdmin = { id: uid("adm"), name: cleanName, email: cleanEmail, addedAt, status: "active" };
  write(KEYS.staff, [...storedAdmins(), row]);
  logAdminAction("Added an admin", `${cleanName} (${cleanEmail})`);
  return row;
}

function findAdmin(id: string) {
  const row = storedAdmins().find((item) => item.id === id);
  if (!row) throw new Error(id === "owner" ? "The owner cannot be changed here." : "That admin is no longer on the list.");
  return row;
}

/** Takes away an admin's access but keeps them on the list. */
export function removeAdmin(id: string) {
  const row = findAdmin(id);
  write(KEYS.staff, storedAdmins().map((item) => (item.id === id ? { ...item, status: "removed" as const } : item)));
  logAdminAction("Removed an admin", `${row.name} (${row.email})`);
}

/** Gives a removed admin their access back. */
export function restoreAdmin(id: string) {
  const row = findAdmin(id);
  write(KEYS.staff, storedAdmins().map((item) => (item.id === id ? { ...item, status: "active" as const } : item)));
  logAdminAction("Restored an admin", `${row.name} (${row.email})`);
}

/** Takes an admin off the list for good. */
export function deleteAdmin(id: string) {
  const row = findAdmin(id);
  write(KEYS.staff, storedAdmins().filter((item) => item.id !== id));
  logAdminAction("Deleted an admin for good", `${row.name} (${row.email})`);
}

/* ------------------------------------------------------------------ people */

export function personName(handle: string) {
  const account = findAccountByHandle(handle);
  const poster = account || getProfile(handle) ? undefined : getCxProjects().find((project) => project.handle === handle);
  return account?.displayName || getProfile(handle)?.displayName || poster?.firstName || (handle ? `@${handle}` : "Unknown");
}

/* ------------------------------------------------------------------ accounts */

export type AccountStatus = "active" | "deactivated" | "blocked";
type StatusRow = { status: Exclude<AccountStatus, "active">; reason: string; at: string };

function statusRows() {
  return read<Record<string, StatusRow>>(KEYS.status, {});
}

export function accountStatus(handle: string): AccountStatus {
  return statusRows()[handle]?.status ?? "active";
}

export function accountStatusInfo(handle: string) {
  return statusRows()[handle];
}

/** Shown on the sign-in page when someone whose account an admin shut tries to sign in. */
export function accountSignInBlock(handle: string): string | null {
  const status = accountStatus(handle);
  if (status === "blocked") return "This account has been blocked. Contact Vael support if you think that is a mistake.";
  if (status === "deactivated") return "This account has been deactivated. Contact Vael support to have it reviewed.";
  return null;
}

export function setAccountStatus(handle: string, status: AccountStatus, reason = "") {
  if (accountStatus(handle) === "blocked") throw new Error("A blocked account stays blocked.");
  const rows = { ...statusRows() };
  if (status === "active") delete rows[handle];
  else rows[handle] = { status, reason: reason.trim(), at: nowIso() };
  write(KEYS.status, rows);
  const label = status === "active" ? "Reactivated" : status === "blocked" ? "Blocked for good" : "Deactivated";
  logAdminAction(`${label} an account`, `${personName(handle)} (@${handle})${reason.trim() ? ` · ${reason.trim()}` : ""}`);
}

export type AdminAccount = CityAccount & { status: AccountStatus; reason: string };

export function adminAccounts(): AdminAccount[] {
  return [...getAccounts()]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((account) => ({
      ...account,
      status: accountStatus(account.handle),
      reason: statusRows()[account.handle]?.reason ?? "",
    }));
}

/* ------------------------------------------------------------------ reports */

export type ReportAction = "warn" | "none" | "deactivate";

export const REPORT_ACTIONS: { id: ReportAction; label: string; hint: string }[] = [
  { id: "warn", label: "Warn the person", hint: "They get a message asking them to stop. The reporter is told we acted." },
  { id: "none", label: "No action needed", hint: "Nothing happens to them. The reporter is told we looked into it." },
  { id: "deactivate", label: "Deactivate their account", hint: "They can't sign in until you reactivate them. The reporter is told we acted." },
];

/** The person a report is about. A project report is about whoever posted that opportunity. */
export function reportedHandle(report: CxReport) {
  if (report.kind === "person") return report.target;
  return getCxProject(report.projectId || report.target)?.handle ?? "";
}

export function reportSubject(report: CxReport) {
  if (report.kind === "person") return personName(report.target);
  const project = getCxProject(report.projectId || report.target);
  return project ? project.category || "Opportunity" : "An opportunity";
}

export function adminReports() {
  return [...getReports()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** What a report can be about, in the order the About filter lists them. */
export const REPORT_ABOUT = [
  { id: "members", label: "Members" },
  { id: "projects", label: "Projects" },
  { id: "conversations", label: "Conversations" },
  { id: "files", label: "Files" },
  { id: "vaels", label: "VAELs" },
  { id: "other", label: "Other" },
] as const;

export type ReportAbout = (typeof REPORT_ABOUT)[number]["id"];

/** Members can report a person or an opportunity today, so those are the two that have reports. */
export function reportAbout(report: CxReport): ReportAbout {
  if (report.kind === "person") return "members";
  if (report.kind === "project") return "projects";
  return "other";
}

/** A member's own profile photo if they added one, otherwise the stock portrait given to a sample member. */
export function memberPhoto(handle: string): string | undefined {
  return getProfile(handle)?.avatarUrl || demoPhoto(handle);
}

/** The face for a report: the person who was reported. An opportunity has no face, so it shows initials. */
export function subjectPhoto(report: CxReport): string | undefined {
  return report.kind === "person" ? memberPhoto(report.target) : undefined;
}

export function resolveReport(reportId: string, action: ReportAction, note: string) {
  const report = getReports().find((item) => item.id === reportId);
  if (!report) throw new Error("That report no longer exists.");
  if (report.status === "resolved") throw new Error("This report is already resolved.");
  const handle = reportedHandle(report);

  resolveCxReport(reportId, { action, note: note.trim() });

  if (action === "warn" && handle) {
    pushNotice(
      handle,
      "A message from Vael",
      "After reviewing a report, Vael is asking you to please refrain from this behaviour. Further reports may lead to your account being closed.",
    );
  }
  if (action === "deactivate" && handle && accountStatus(handle) === "active") {
    setAccountStatus(handle, "deactivated", "After a report was reviewed");
  }
  pushNotice(
    report.byHandle,
    "Thanks for your report",
    action === "none"
      ? "We reviewed it and found no action was needed. Thank you for helping keep Vael safe."
      : "We reviewed it and took action. Thank you for helping keep Vael safe.",
  );

  const outcome = action === "warn" ? "Warned" : action === "deactivate" ? "Deactivated" : "No action";
  logAdminAction(`Resolved a report: ${outcome}`, `${reportSubject(report)} · reported by ${personName(report.byHandle)}`);
}

/* ------------------------------------------------------------------ founding places */

export const FOUNDING_CAP = 100;

export type FoundingRow = {
  place: number;
  handle: string;
  name: string;
  email: string;
  /** The district they chose, or "No district yet". */
  district: string;
  joinedAt: string;
  completed: boolean;
};

/**
 * A founding place is held by each of the first members to join Vael, in any district. A place is
 * "completed" once the member has finished setting up their profile.
 */
export function foundingRows(): FoundingRow[] {
  const returned = returnedRows();
  return [...getAccounts()]
    .filter((account) => !returned[account.handle])
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .slice(0, FOUNDING_CAP)
    .map((account, index) => ({
      place: index + 1,
      handle: account.handle,
      name: account.displayName || account.handle,
      email: account.email,
      district: districts.find((item) => item.id === getActiveDistrictId(account.handle))?.name ?? "No district yet",
      joinedAt: account.createdAt,
      completed: onboardingComplete(account.handle),
    }))
    .reverse();
}

/* ------------------------------------------------------------------ returning a founding place */

export type ReturnReason = "duplicate" | "other";

export const RETURN_REASONS: { id: ReturnReason; label: string; hint: string }[] = [
  { id: "duplicate", label: "Duplicate or shell account", hint: "A second account for the same person, or an account that is not a real member." },
  { id: "other", label: "Another reason", hint: "Anything else that means this member should not hold a founding place." },
];

export const RETURN_NOTE_MAX = 1000;

type ReturnedRow = { reason: ReturnReason; note: string; at: string };

function returnedRows() {
  return read<Record<string, ReturnedRow>>(KEYS.returned, {});
}

/**
 * Takes a founding place back. It goes back to the pool and the member loses the free access that came
 * with it. It is never given back on its own, and the member is told Vael returned it, never why. The
 * reason and the private note go in the audit log, and nowhere the member can see.
 */
export function returnFoundingPlace(handle: string, reason: ReturnReason, note: string) {
  const text = note.trim();
  if (!text) throw new Error("Add a short note for the record.");
  if (text.length > RETURN_NOTE_MAX) throw new Error(`Keep the note under ${RETURN_NOTE_MAX.toLocaleString("en-US")} characters.`);
  if (!foundingRows().some((row) => row.handle === handle)) throw new Error("This member does not hold a founding place.");
  write(KEYS.returned, { ...returnedRows(), [handle]: { reason, note: text, at: nowIso() } });
  const label = RETURN_REASONS.find((item) => item.id === reason)?.label ?? "Another reason";
  logAdminAction("Returned a founding place", `${personName(handle)} (@${handle}) · ${label} · ${text}`);
  pushNotice(handle, "Your founding place was returned", "Vael returned your founding place, so your free access has ended. You can keep using Vael by paying for access.");
}

/* ------------------------------------------------------------------ what is on Vael */

export type SystemListing = { handle: string; side: "in" | "out"; district: string; createdAt: string; expiresAt: string };

/**
 * Every Vael In and Vael Out listing in every district, from members of this device. Sample people
 * who have no account are left out so the numbers always match the member count.
 */
function systemListings(): SystemListing[] {
  const members = new Set(getAccounts().map((account) => account.handle));
  const rows: SystemListing[] = [];
  const add = (district: string, list: { handle: string; side: "in" | "out"; createdAt: string; expiresAt: string }[]) => {
    for (const item of list) {
      if (members.has(item.handle)) rows.push({ handle: item.handle, side: item.side, district, createdAt: item.createdAt, expiresAt: item.expiresAt });
    }
  };
  add("media-technology", getListings());
  add("construction", getCxListings());
  add("trucking", getTxListings());
  add("residential", getRxListings());
  add("commercial", getCmListings());
  return rows;
}

const isVisibleNow = (item: SystemListing, nowMs: number) => Date.parse(item.expiresAt) > nowMs && Date.parse(item.createdAt) <= nowMs;

/** Handshakes that opened, in any district and from any source (board match, request or opportunity). */
function openedHandshakes() {
  return getConnections().filter((item) => item.status === "connected" || item.status === "closed");
}

/* ------------------------------------------------------------------ resources: guides */

export type PublishState = "draft" | "published";

export type Guide = {
  id: string;
  title: string;
  summary: string;
  body: string;
  /** District ids this guide shows in. */
  districtIds: string[];
  status: PublishState;
  updatedAt: string;
};

const DEFAULT_GUIDES: Guide[] = [
  {
    id: "guide_start",
    title: "Getting started on Vael",
    summary: "How to make your profile, go visible and open a Handshake.",
    body:
      "Make your profile first, then choose a district and go visible: Vael In if you are available, Vael Out if you need someone. When you and another member both say yes, a Handshake opens and you can talk privately.",
    districtIds: districts.map((item) => item.id),
    status: "published",
    updatedAt: "",
  },
];

export function getGuides(): Guide[] {
  const saved = read<Guide[] | null>(KEYS.guides, null) ?? DEFAULT_GUIDES;
  // Guides saved before districts were chosen apply to every district.
  return saved.map((guide) => (guide.districtIds ? guide : { ...guide, districtIds: districts.map((item) => item.id) }));
}

/** Published guides that belong in a district, for the member side. */
export function publishedGuidesFor(districtId: string) {
  return getGuides().filter((item) => item.status === "published" && item.districtIds.includes(districtId));
}

export function saveGuide(input: { id?: string; title: string; summary: string; body: string; districtIds?: string[] }, status: PublishState) {
  const title = input.title.trim();
  if (!title) throw new Error("Give the guide a title.");
  if (status === "published" && !input.body.trim()) throw new Error("Write the guide before you publish it.");
  const districtIds = input.districtIds ?? districts.map((item) => item.id);
  if (status === "published" && districtIds.length === 0) throw new Error("Choose at least one district for this guide.");
  const guides = getGuides();
  const existing = input.id ? guides.find((item) => item.id === input.id) : undefined;
  const next: Guide = {
    id: existing?.id ?? uid("guide"),
    title,
    summary: input.summary.trim(),
    body: input.body.trim(),
    districtIds,
    status,
    updatedAt: nowIso(),
  };
  write(KEYS.guides, existing ? guides.map((item) => (item.id === next.id ? next : item)) : [next, ...guides]);
  logAdminAction(status === "published" ? "Published a guide" : "Saved a guide as draft", title);
  return next;
}

export function setGuideStatus(id: string, status: PublishState) {
  const guide = getGuides().find((item) => item.id === id);
  if (!guide) return;
  write(KEYS.guides, getGuides().map((item) => (item.id === id ? { ...item, status, updatedAt: nowIso() } : item)));
  logAdminAction(status === "published" ? "Published a guide" : "Unpublished a guide", guide.title);
}

export function deleteGuide(id: string) {
  const guide = getGuides().find((item) => item.id === id);
  if (!guide) return;
  write(KEYS.guides, getGuides().filter((item) => item.id !== id));
  logAdminAction("Deleted a guide", guide.title);
}

/* ------------------------------------------------------------------ help and services */

export const HELP_KINDS = ["Official resource", "Partner service", "Community help"] as const;
export type HelpKind = (typeof HELP_KINDS)[number];

export const HELP_PLACEMENTS = [
  { id: "district_help", label: "District help page" },
  { id: "project_room", label: "Inside the Handshake room (optional services)" },
] as const;
export type HelpPlacement = (typeof HELP_PLACEMENTS)[number]["id"];

export const HELP_MAX_LINKS = 3;

export type HelpLink = { label: string; url: string };

export type HelpListing = {
  id: string;
  title: string;
  kind: HelpKind;
  summary: string;
  coverage: "nationwide" | "state";
  state: string;
  links: HelpLink[];
  placements: HelpPlacement[];
  /** District ids this listing shows in. */
  districtIds: string[];
  status: PublishState;
  updatedAt: string;
};

export const HELP_DISTRICTS = districts.map((item) => ({ id: item.id, name: item.name }));

const DEFAULT_HELP: HelpListing[] = [
  {
    id: "help_basics",
    title: "Legal, accounting and financing basics",
    kind: "Official resource",
    summary: "Where to get set up properly: contracts, bookkeeping and how to finance bigger jobs.",
    coverage: "nationwide",
    state: "",
    links: [],
    placements: ["district_help"],
    districtIds: districts.map((item) => item.id),
    status: "published",
    updatedAt: "",
  },
];

export function getHelpListings(): HelpListing[] {
  return read<HelpListing[] | null>(KEYS.help, null) ?? DEFAULT_HELP;
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateHelp(input: Omit<HelpListing, "id" | "status" | "updatedAt">, status: PublishState) {
  if (!input.title.trim()) return "Give the service a title.";
  if (status === "published") {
    if (!input.summary.trim()) return "Add a short description before you publish.";
    if (input.districtIds.length === 0) return "Choose at least one district.";
    if (input.placements.length === 0) return "Choose where it shows.";
  }
  if (input.coverage === "state" && !input.state.trim()) return "Add the state, or choose nationwide.";
  const links = input.links.filter((link) => link.url.trim() || link.label.trim());
  if (links.length > HELP_MAX_LINKS) return `Add up to ${HELP_MAX_LINKS} links.`;
  if (links.some((link) => !isHttpUrl(link.url))) return "Each link needs a full address starting with https://";
  return "";
}

export function saveHelpListing(
  input: Omit<HelpListing, "id" | "status" | "updatedAt"> & { id?: string },
  status: PublishState,
) {
  const problem = validateHelp(input, status);
  if (problem) throw new Error(problem);
  const all = getHelpListings();
  const existing = input.id ? all.find((item) => item.id === input.id) : undefined;
  const next: HelpListing = {
    ...input,
    id: existing?.id ?? uid("help"),
    title: input.title.trim(),
    summary: input.summary.trim(),
    state: input.coverage === "state" ? input.state.trim() : "",
    links: input.links.filter((link) => link.url.trim()).map((link) => ({ label: link.label.trim() || link.url.trim(), url: link.url.trim() })),
    status,
    updatedAt: nowIso(),
  };
  write(KEYS.help, existing ? all.map((item) => (item.id === next.id ? next : item)) : [next, ...all]);
  logAdminAction(status === "published" ? "Published a service" : "Saved a service as draft", next.title);
  return next;
}

export function setHelpStatus(id: string, status: PublishState) {
  const item = getHelpListings().find((row) => row.id === id);
  if (!item) return;
  write(KEYS.help, getHelpListings().map((row) => (row.id === id ? { ...row, status, updatedAt: nowIso() } : row)));
  logAdminAction(status === "published" ? "Published a service" : "Unpublished a service", item.title);
}

export function deleteHelpListing(id: string) {
  const item = getHelpListings().find((row) => row.id === id);
  if (!item) return;
  write(KEYS.help, getHelpListings().filter((row) => row.id !== id));
  logAdminAction("Deleted a service", item.title);
}

/** Published listings that belong in a place, for the member side. */
export function publishedHelpFor(districtId: string, placement: HelpPlacement) {
  return getHelpListings().filter(
    (item) => item.status === "published" && item.placements.includes(placement) && item.districtIds.includes(districtId),
  );
}

/* ------------------------------------------------------------------ page settings */

export type PageCopy = { welcome: string; disclaimer: string };
export type PageSettings = { resources: PageCopy; help: PageCopy };

const DEFAULT_PAGES: PageSettings = {
  resources: {
    welcome: "Guides from the Vael team to help you get the most out of Vael.",
    disclaimer: "Guides are general information, not legal, financial or professional advice.",
  },
  help: {
    welcome: "Trusted help and services for the work around the work.",
    disclaimer: "Vael lists these services for convenience and doesn't guarantee or endorse them.",
  },
};

export function getPageSettings(): PageSettings {
  const saved = read<Partial<PageSettings>>(KEYS.pages, {});
  return {
    resources: { ...DEFAULT_PAGES.resources, ...saved.resources },
    help: { ...DEFAULT_PAGES.help, ...saved.help },
  };
}

export function savePageSettings(page: keyof PageSettings, copy: PageCopy) {
  write(KEYS.pages, { ...getPageSettings(), [page]: { welcome: copy.welcome.trim(), disclaimer: copy.disclaimer.trim() } });
  logAdminAction(`Changed the ${page === "resources" ? "Resources" : "Help and services"} page text`, "Welcome text and disclaimer");
}

/* ------------------------------------------------------------------ overview */

export function adminOverview() {
  const reports = getReports();
  const accounts = adminAccounts();
  const founding = foundingRows();
  return {
    reportsWaiting: reports.filter((item) => item.status === "open").length,
    reportsResolved: reports.filter((item) => item.status === "resolved").length,
    foundingHeld: founding.length,
    foundingCompleted: founding.filter((row) => row.completed).length,
    activeMembers: accounts.filter((item) => item.status === "active").length,
    deactivated: accounts.filter((item) => item.status !== "active").length,
    visibleIn: systemListings().filter((item) => item.side === "in" && isVisibleNow(item, Date.now())).length,
    visibleOut: systemListings().filter((item) => item.side === "out" && isVisibleNow(item, Date.now())).length,
    openHandshakes: getConnections().filter((item) => item.status === "connected" && !item.blocked).length,
    handshakesEverOpened: openedHandshakes().length,
    profilesFinished: accounts.filter((item) => onboardingComplete(item.handle)).length,
    totalMembers: accounts.length,
    guidesPublished: getGuides().filter((item) => item.status === "published").length,
    helpPublished: getHelpListings().filter((item) => item.status === "published").length,
  };
}

/* ------------------------------------------------------------------ dashboard */

export type RangeDays = 7 | 30 | 90;

export type DayPoint = {
  /** Start of the day (or of the 3-day or weekly step), ISO. */
  date: string;
  /** People who joined. */
  members: number;
  /** Vael In and Vael Out listings made, in every district. */
  posted: number;
  /** Handshakes opened. */
  handshakes: number;
};

export type Trend = {
  /** This period. */
  value: number;
  /** The same length of time just before it. */
  previous: number;
  /** Percent change, or null when there is nothing before to compare with. */
  pct: number | null;
  /** One number per day, for the small line. */
  spark: number[];
};

export type CountRow = { id: string; name: string; count: number };

/** One district's share of Vael: its members, who is visible in it now, and the Handshakes it has produced. */
export type DistrictRow = { id: string; name: string; members: number; visibleIn: number; visibleOut: number; handshakes: number };

const DAY = 86400000;

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function stamps(values: string[]) {
  return values.map((value) => Date.parse(value)).filter((value) => Number.isFinite(value));
}

function countBetween(times: number[], from: number, to: number) {
  return times.filter((time) => time >= from && time < to).length;
}

/** Counts per bucket of `bucket` days, so a quiet month still draws a readable line. */
function perBucket(times: number[], first: number, days: number, bucket: number) {
  const out = new Array<number>(Math.ceil(days / bucket)).fill(0);
  for (const time of times) {
    const index = Math.floor((time - first) / (DAY * bucket));
    if (index >= 0 && index < out.length) out[index] += 1;
  }
  return out;
}

/** 7 and 30 days show every day. 90 days show whole weeks, so the chart stays readable. */
export function bucketDays(days: RangeDays) {
  return days === 90 ? 7 : 1;
}

/** Bars need more room than a line: a week is days, a month is 3-day steps, a quarter is weeks. */
export function barStepDays(days: RangeDays) {
  return days === 7 ? 1 : days === 30 ? 3 : 7;
}

function trendOf(times: number[], first: number, days: number, now: number): Trend {
  const value = countBetween(times, first, now + 1);
  const previous = countBetween(times, first - days * DAY, first);
  return {
    value,
    previous,
    pct: previous === 0 ? null : Math.round(((value - previous) / previous) * 100),
    spark: perBucket(times, first, days, bucketDays(days as RangeDays)),
  };
}

/** Every reason a member can give, so the chart always has its columns, with the real counts filled in. */
export const KNOWN_REPORT_REASONS = [...new Set([...PERSON_REPORT_REASONS, ...PROJECT_REPORT_REASONS])];

/** A short name for each reason, so it fits under a column. The full wording stays in the data and in the hover tip. */
const SHORT_REPORT_REASONS: Record<string, string> = {
  "Fraud or scam": "Fraud",
  "Harassment or abusive messages": "Harassment",
  "Not who they say they are": "Fake profile",
  "Something else": "Something else",
  "Not a real home project": "Fake project",
  "Contains personal details": "Personal info",
  "Looks like spam or a scam": "Spam",
};

export function shortReason(reason: string) {
  return SHORT_REPORT_REASONS[reason] ?? reason;
}

function reasonCounts(reports: { reason: string }[]): CountRow[] {
  const counts = new Map<string, number>(KNOWN_REPORT_REASONS.map((reason) => [reason, 0]));
  for (const report of reports) {
    const reason = report.reason || "Something else";
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  const order = [...counts.keys()];
  return order
    .map((name) => ({ id: name, name, count: counts.get(name) ?? 0 }))
    .sort((a, b) => b.count - a.count || order.indexOf(a.name) - order.indexOf(b.name));
}

/** Everything the admin Overview draws, for the last 7, 30 or 90 days. */
export function adminDashboard(days: RangeDays, nowMs = Date.now()) {
  const first = startOfDay(nowMs) - (days - 1) * DAY;
  const accounts = getAccounts();
  const listings = systemListings();
  const reports = getReports();

  const memberTimes = stamps(accounts.map((item) => item.createdAt));
  // A listing is one Vael In or Vael Out listing, in any district. The card and the chart count the same thing.
  const postedTimes = stamps(listings.map((item) => item.createdAt));
  const handshakeTimes = stamps(openedHandshakes().map((item) => item.createdAt));
  const reportTimes = stamps(reports.map((item) => item.createdAt));

  const members = trendOf(memberTimes, first, days, nowMs);
  const posted = trendOf(postedTimes, first, days, nowMs);
  const handshakeTrend = trendOf(handshakeTimes, first, days, nowMs);
  const reportTrend = trendOf(reportTimes, first, days, nowMs);

  const series: DayPoint[] = members.spark.map((_, index) => ({
    date: new Date(first + index * DAY * bucketDays(days)).toISOString(),
    members: members.spark[index],
    posted: posted.spark[index],
    handshakes: handshakeTrend.spark[index],
  }));

  const barStep = barStepDays(days);
  const barPosted = perBucket(postedTimes, first, days, barStep);
  const barHandshakes = perBucket(handshakeTimes, first, days, barStep);
  const barSeries = barPosted.map((count, index) => ({
    date: new Date(first + index * DAY * barStep).toISOString(),
    posted: count,
    handshakes: barHandshakes[index],
  }));

  // Total members at the end of each step: everyone who joined before the period, plus those who joined since.
  let running = memberTimes.filter((time) => time < first).length;
  const memberTotals = members.spark.map((joined) => (running += joined));

  const resolved = reports.filter((item) => item.status === "resolved" && item.resolution?.at);
  const avgResolveHours = resolved.length
    ? resolved.reduce((sum, item) => sum + (Date.parse(item.resolution!.at) - Date.parse(item.createdAt)) / 3600000, 0) / resolved.length
    : null;

  // Everything below counts what happened inside the chosen period, so the page follows the filter.
  const inPeriod = (iso: string) => {
    const time = Date.parse(iso);
    return Number.isFinite(time) && time >= first && time <= nowMs;
  };
  const periodAccounts = accounts.filter((item) => inPeriod(item.createdAt));
  const periodListings = listings.filter((item) => inPeriod(item.createdAt));
  const periodConnections = openedHandshakes().filter((item) => inPeriod(item.createdAt));
  const periodReports = reports.filter((item) => inPeriod(item.createdAt));
  const founding = foundingRows();

  const summary = {
    reports: {
      filed: periodReports.length,
      toReview: periodReports.filter((item) => item.status === "open").length,
      decided: periodReports.filter((item) => item.status === "resolved").length,
    },
    members: {
      joined: periodAccounts.length,
      alreadyHere: accounts.length - periodAccounts.length,
      finished: periodAccounts.filter((item) => onboardingComplete(item.handle)).length,
    },
    founding: {
      taken: founding.filter((row) => inPeriod(row.joinedAt)).length,
      held: founding.length,
    },
    listings: {
      total: periodListings.length,
      available: periodListings.filter((item) => item.side === "in").length,
      looking: periodListings.filter((item) => item.side === "out").length,
    },
    connections: {
      opened: periodConnections.length,
      stillOpen: periodConnections.filter((item) => item.status === "connected" && !item.blocked).length,
      ended: periodConnections.filter((item) => !(item.status === "connected" && !item.blocked)).length,
    },
  };

  const districtCounts = new Map<string, number>();
  for (const account of periodAccounts) {
    const id = getActiveDistrictId(account.handle) ?? "none";
    districtCounts.set(id, (districtCounts.get(id) ?? 0) + 1);
  }
  const byDistrict: CountRow[] = [
    ...districts.map((item) => ({ id: item.id, name: item.name, count: districtCounts.get(item.id) ?? 0 })),
    { id: "none", name: "No district yet", count: districtCounts.get("none") ?? 0 },
  ].sort((a, b) => b.count - a.count);

  const byDistrictTable: DistrictRow[] = districts.map((item) => ({
    id: item.id,
    name: item.name,
    members: districtCounts.get(item.id) ?? 0,
    visibleIn: periodListings.filter((row) => row.district === item.id && row.side === "in").length,
    visibleOut: periodListings.filter((row) => row.district === item.id && row.side === "out").length,
    handshakes: periodConnections.filter((row) => connectionDistrict(row) === item.id).length,
  }));
  const byVisibility: CountRow[] = [
    { id: "in", name: "Available", count: summary.listings.available },
    { id: "out", name: "Looking", count: summary.listings.looking },
  ];

  return {
    days,
    series,
    members,
    posted,
    handshakes: handshakeTrend,
    reports: reportTrend,
    avgResolveHours,
    memberTotals,
    barSeries,
    barStep,
    summary,
    byDistrict,
    byDistrictTable,
    byVisibility,
    byReason: reasonCounts(periodReports),
    newestMembers: [...periodAccounts]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 6)
      .map((account) => ({
        handle: account.handle,
        name: account.displayName || account.handle,
        email: account.email,
        joinedAt: account.createdAt,
        status: accountStatus(account.handle),
        district: districts.find((item) => item.id === getActiveDistrictId(account.handle))?.name ?? "No district yet",
      })),
  };
}

/* ------------------------------------------------------------------ attention + live feed */

export type AttentionItem = {
  id: string;
  tone: "urgent" | "normal" | "info";
  title: string;
  detail: string;
  cta: string;
  to: string;
};

/** The things an admin should look at today, each with somewhere to go. Empty means all caught up. */
export function adminAttention(nowMs = Date.now()): AttentionItem[] {
  const items: AttentionItem[] = [];
  const reports = getReports();

  const open = reports.filter((item) => item.status === "open").sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  if (open.length > 0) {
    const oldestDays = Math.floor((nowMs - Date.parse(open[0].createdAt)) / DAY);
    items.push({
      id: "reports",
      tone: "urgent",
      title: `${open.length} ${open.length === 1 ? "report is" : "reports are"} waiting`,
      detail: oldestDays >= 1 ? `The oldest has been waiting ${oldestDays} ${oldestDays === 1 ? "day" : "days"}.` : "The oldest came in today.",
      cta: "Review reports",
      to: "/admin/reports",
    });
  }

  const against = new Map<string, number>();
  for (const report of reports) {
    const handle = reportedHandle(report);
    if (handle) against.set(handle, (against.get(handle) ?? 0) + 1);
  }
  const repeat = [...against.entries()].filter(([handle, count]) => count >= 2 && accountStatus(handle) === "active");
  if (repeat.length > 0) {
    const first = repeat[0][0];
    items.push({
      id: "repeat",
      tone: "urgent",
      title: repeat.length === 1 ? `${personName(first)} has been reported ${repeat[0][1]} times` : `${repeat.length} people have been reported more than once`,
      detail: repeat.length === 1 ? "Worth a closer look before it happens again." : repeat.map(([handle]) => personName(handle)).slice(0, 3).join(", "),
      cta: "Open members",
      to: `/admin/accounts?q=${encodeURIComponent(repeat.length === 1 ? personName(first) : "")}`,
    });
  }

  const unfinished = foundingRows().filter((row) => !row.completed);
  if (unfinished.length > 0) {
    items.push({
      id: "founding",
      tone: "normal",
      title: `${unfinished.length} founding ${unfinished.length === 1 ? "member hasn't" : "members haven't"} finished their profile`,
      detail: "They hold a place but can't be matched yet.",
      cta: "See who",
      to: "/admin/founding",
    });
  }

  const closing = getCxProjects().filter((item) => item.status === "live" && item.liveUntil && Date.parse(item.liveUntil) - nowMs < DAY && Date.parse(item.liveUntil) > nowMs);
  if (closing.length > 0) {
    items.push({
      id: "closing",
      tone: "info",
      title: `${closing.length} ${closing.length === 1 ? "opportunity closes" : "opportunities close"} within a day`,
      detail: "Their owners may renew them, or they end on their own.",
      cta: "",
      to: "",
    });
  }
  return items;
}

export type FeedEvent = {
  id: string;
  at: string;
  kind: "member" | "opportunity" | "interest" | "handshake" | "report" | "admin";
  text: string;
  sub: string;
};

/** One stream of what just happened, from members and from admins. Newest first. */
export function adminFeed(limit = 12, only?: FeedEvent["kind"]): FeedEvent[] {
  const events: FeedEvent[] = [];
  for (const account of getAccounts()) {
    events.push({ id: `m_${account.handle}`, at: account.createdAt, kind: "member", text: `${account.displayName || account.handle} joined`, sub: account.email });
  }
  const projects = getCxProjects();
  for (const project of projects.filter((item) => item.status !== "draft")) {
    events.push({
      id: `o_${project.id}`,
      at: project.publishedAt || project.createdAt,
      kind: "opportunity",
      text: `${personName(project.handle)} posted a ${project.category || "new"} opportunity`,
      sub: project.city || "",
    });
  }
  for (const item of getInterests().filter((row) => row.contractorInterested)) {
    const project = projects.find((row) => row.id === item.projectId);
    events.push({
      id: `i_${item.id}`,
      at: item.createdAt,
      kind: "interest",
      text: `${personName(item.contractorHandle)} is interested in ${project?.category ? `a ${project.category} opportunity` : "an opportunity"}`,
      sub: `Posted by ${personName(item.homeownerHandle)}`,
    });
  }
  for (const item of getConnections().filter((row) => row.source === "project_interest" && (row.status === "connected" || row.status === "closed"))) {
    events.push({
      id: `h_${item.id}`,
      at: item.createdAt,
      kind: "handshake",
      text: `Handshake opened: ${personName(item.requesterHandle)} and ${personName(item.counterpartHandle)}`,
      sub: "",
    });
  }
  for (const report of getReports()) {
    events.push({ id: `r_${report.id}`, at: report.createdAt, kind: "report", text: `Report: ${report.reason}`, sub: `About ${reportSubject(report)}, by ${personName(report.byHandle)}` });
  }
  for (const entry of getAuditLog().filter((row) => row.action !== "Signed in")) {
    events.push({ id: `a_${entry.id}`, at: entry.at, kind: "admin", text: entry.action, sub: entry.detail });
  }
  return events
    .filter((event) => Number.isFinite(Date.parse(event.at)) && (!only || event.kind === only))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit);
}
