/**
 * Sample people and activity for the admin demo, so a first look at the dashboard is not empty.
 *
 * It adds a set of members who joined over the last twelve weeks, the listings they put up, the
 * connections that opened between them, and a handful of reports. Everything is dated in the past
 * and already finished: no listing is still live, so nothing shows up on the member boards. Nobody
 * is sent a message and no real account is touched. It runs once, and `removeAdminDemo` takes all of
 * it out again.
 *
 * The rows are written straight into the same places the app reads from, so the dashboard counts
 * them exactly as it counts anything else.
 */
import { getAccounts } from "./accounts";
import { addCxReports, getCxProject, getReports, removeSampleCxReports, type CxReport } from "./cxProjectStore";

const KEYS = {
  done: "vael_admin_demo_v2",
  members: "vael_admin_demo_members_v1",
  accounts: "vael_city_accounts_v1",
  districts: "vael_my_districts_v1",
  onboarding: "vael_onboarding_v1",
  connections: "mtx_mock_connections_v1",
  listings: {
    "media-technology": "mtx_mock_listings_v1",
    construction: "cx_mock_listings_v1",
    trucking: "tx_mock_listings_v1",
    residential: "rx_mock_listings_v1",
    commercial: "cm_mock_listings_v1",
  },
} as const;

type DistrictId = keyof typeof KEYS.listings;

const DAY = 86400000;
const HOUR = 3600000;

/* ------------------------------------------------------------------ the people */

type Person = { name: string; district: DistrictId; daysAgo: number; finished: boolean };

/** Joined at a steady pace that picks up lately, spread across the five districts that are open. */
const PEOPLE: Person[] = [
  { name: "Marcus Reed", district: "construction", daysAgo: 86, finished: true },
  { name: "Elena Vasquez", district: "media-technology", daysAgo: 81, finished: true },
  { name: "Tyrone Banks", district: "trucking", daysAgo: 77, finished: true },
  { name: "Sophie Lambert", district: "residential", daysAgo: 72, finished: true },
  { name: "Daniel Okafor", district: "construction", daysAgo: 68, finished: true },
  { name: "Priya Nair", district: "media-technology", daysAgo: 63, finished: true },
  { name: "Luis Herrera", district: "commercial", daysAgo: 59, finished: true },
  { name: "Hannah Brooks", district: "residential", daysAgo: 55, finished: false },
  { name: "Omar Siddiqui", district: "trucking", daysAgo: 52, finished: true },
  { name: "Grace Turner", district: "construction", daysAgo: 48, finished: true },
  { name: "Victor Alvarez", district: "construction", daysAgo: 45, finished: true },
  { name: "Maya Fischer", district: "media-technology", daysAgo: 42, finished: true },
  { name: "Jordan Pierce", district: "commercial", daysAgo: 39, finished: true },
  { name: "Nadia Rahman", district: "residential", daysAgo: 36, finished: true },
  { name: "Caleb Foster", district: "construction", daysAgo: 33, finished: true },
  { name: "Isabel Moreno", district: "media-technology", daysAgo: 30, finished: true },
  { name: "Andre Dubois", district: "trucking", daysAgo: 27, finished: true },
  { name: "Chloe Bennett", district: "commercial", daysAgo: 25, finished: true },
  { name: "Samuel Obi", district: "construction", daysAgo: 23, finished: true },
  { name: "Lena Kowalski", district: "residential", daysAgo: 21, finished: false },
  { name: "Mateo Rossi", district: "media-technology", daysAgo: 19, finished: true },
  { name: "Aisha Khan", district: "trucking", daysAgo: 16, finished: true },
  { name: "Ethan Walsh", district: "construction", daysAgo: 14, finished: true },
  { name: "Zoe Martin", district: "commercial", daysAgo: 12, finished: false },
  { name: "Hassan Ali", district: "residential", daysAgo: 10, finished: true },
  { name: "Rachel Stein", district: "media-technology", daysAgo: 8, finished: true },
  { name: "Diego Castillo", district: "construction", daysAgo: 6, finished: false },
  { name: "Ines Moreau", district: "trucking", daysAgo: 4, finished: true },
  { name: "Noah Patel", district: "construction", daysAgo: 2, finished: false },
  { name: "Amara Johnson", district: "media-technology", daysAgo: 1, finished: false },
];

const handleOf = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "");

/** The same numbers every time, so the demo always looks the same. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ listings */

type Side = "in" | "out";
type Made = { id: string; handle: string; district: DistrictId; side: Side; createdMs: number };

const WORDS: Record<DistrictId, () => Record<string, unknown>> = {
  "media-technology": () => ({
    category: "Design",
    discipline: "Brand and web design",
    skills: ["Figma", "Prototyping"],
    tools: ["Figma"],
    certifications: [],
    location: "Jacksonville, FL",
    remoteOnsite: "hybrid",
    timing: "Within 2 weeks",
    experienceYears: 5,
    engagement: "Contract",
    budgetProxy: "$$",
    timeline: "2 to 4 weeks",
  }),
  construction: () => ({
    trade: "Electrical",
    jobType: "Renovation",
    capabilities: ["Rewiring", "Panel upgrades"],
    serviceArea: "Jacksonville and nearby",
    availability: "Next two weeks",
    experienceYears: 8,
    credentials: ["Licensed"],
    insuranceNoted: true,
    timeline: "Within 30 days",
    scopeNote: "",
  }),
  trucking: () => ({
    origin: "Jacksonville, FL",
    destination: "Atlanta, GA",
    equipment: "Dry van",
    capacity: "Full load",
    availability: "This week",
    capabilities: ["Regional runs"],
    experienceYears: 7,
    pickupNote: "",
    deliveryNote: "",
  }),
  residential: () => ({
    service: "Home repair",
    area: "Jacksonville",
    postalCode: "32202",
    availability: "Next two weeks",
    capabilities: ["Small repairs"],
    experienceYears: 6,
    credentials: [],
    extraNote: "",
  }),
  commercial: () => ({
    capability: "Facilities",
    context: "Office maintenance",
    area: "Jacksonville",
    availability: "Next two weeks",
    capabilities: ["Maintenance"],
    experienceYears: 6,
    credentials: [],
    scopeNote: "",
  }),
};

function listingRow(person: { handle: string; district: DistrictId }, side: Side, createdMs: number, index: number) {
  const created = new Date(createdMs).toISOString();
  return {
    id: `demo_${person.district}_${index}`,
    handle: person.handle,
    side,
    ...WORDS[person.district](),
    description: side === "in" ? "Available for new work in the area." : "Looking for someone reliable for a job.",
    requirements: "",
    contact: "Message me on Vael",
    createdAt: created,
    // A day long, and long over, so it counts in the history without showing on any board.
    expiresAt: new Date(createdMs + 24 * HOUR).toISOString(),
    plan: "daily",
  };
}

/* ------------------------------------------------------------------ reports */

type DemoReport = { kind: CxReport["kind"]; reason: string; details: string; hoursAgo: number; decidedAfterHours?: number; action?: "warn" | "none" };

const REPORTS: DemoReport[] = [
  { kind: "person", reason: "Fraud or scam", details: "Asked me to pay a deposit by gift card before any work was agreed.", hoursAgo: 20 },
  { kind: "person", reason: "Harassment or abusive messages", details: "Keeps messaging after I said I wasn't interested.", hoursAgo: 3 * 24 + 4 },
  { kind: "person", reason: "Not who they say they are", details: "The licence number on the profile doesn't match the company name.", hoursAgo: 5 * 24 + 2, decidedAfterHours: 9, action: "warn" },
  { kind: "person", reason: "Fraud or scam", details: "Took a payment and stopped replying.", hoursAgo: 8 * 24, decidedAfterHours: 30, action: "none" },
  { kind: "person", reason: "Harassment or abusive messages", details: "Rude and threatening replies in the Handshake room.", hoursAgo: 12 * 24 + 6, decidedAfterHours: 5, action: "warn" },
  { kind: "project", reason: "Not a real home project", details: "The photos look like they came from a stock website.", hoursAgo: 18 * 24, decidedAfterHours: 14, action: "none" },
  { kind: "project", reason: "Looks like spam or a scam", details: "Same text posted in several districts.", hoursAgo: 26 * 24 + 3, decidedAfterHours: 50, action: "warn" },
  { kind: "person", reason: "Fraud or scam", details: "Offered a job that needed money up front.", hoursAgo: 34 * 24, decidedAfterHours: 22, action: "none" },
  { kind: "project", reason: "Contains personal details", details: "The description includes a full home address and phone number.", hoursAgo: 47 * 24, decidedAfterHours: 8, action: "none" },
  { kind: "person", reason: "Something else", details: "Profile photo isn't of a real person.", hoursAgo: 61 * 24 + 5, decidedAfterHours: 40, action: "warn" },
  { kind: "person", reason: "Not who they say they are", details: "Claims to be in Jacksonville but works out of another state.", hoursAgo: 72 * 24, decidedAfterHours: 3, action: "none" },
  { kind: "person", reason: "Fraud or scam", details: "Sent a payment link that didn't look right.", hoursAgo: 4 * 24 + 8 },
];

/* ------------------------------------------------------------------ storage */

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const writeJson = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

export type DemoSummary = { members: number; listings: number; connections: number; reports: number };

/** Adds the sample members, listings, connections and reports once. Returns what it added. */
export function seedAdminDemo(nowMs = Date.now()): DemoSummary {
  const none: DemoSummary = { members: 0, listings: 0, connections: 0, reports: 0 };
  if (typeof localStorage === "undefined" || localStorage.getItem(KEYS.done)) return none;

  // Earlier versions put sample reports on top of real people. Take those away first.
  removeSampleCxReports();

  /* members */
  const accounts = getAccounts();
  const taken = new Set(accounts.flatMap((account) => [account.handle, account.email]));
  const people: (Person & { handle: string; email: string })[] = [];
  for (const person of PEOPLE) {
    const handle = handleOf(person.name);
    const email = `${handle}@example.com`;
    if (taken.has(handle) || taken.has(email)) continue;
    people.push({ ...person, handle, email });
  }
  const newAccounts = people.map((person, index) => ({
    handle: person.handle,
    email: person.email,
    phone: `90455501${String(10 + index).padStart(2, "0")}`,
    displayName: person.name,
    createdAt: new Date(nowMs - person.daysAgo * DAY - (index % 5) * 2 * HOUR).toISOString(),
  }));
  writeJson(KEYS.accounts, [...accounts, ...newAccounts]);

  const districtStore = readJson<Record<string, unknown>>(KEYS.districts, {});
  const onboarding = readJson<Record<string, unknown>>(KEYS.onboarding, {});
  newAccounts.forEach((account, index) => {
    const person = people[index];
    districtStore[person.handle] = { active: person.district, history: [person.district] };
    onboarding[person.handle] = {
      handle: person.handle,
      intent: "in",
      profileType: "individual",
      districtId: person.district,
      handleClaimed: true,
      completedStep: person.finished ? "Done" : "Profile Setup",
      ...(person.finished ? { completedAt: new Date(Date.parse(account.createdAt) + 2 * HOUR).toISOString() } : {}),
    };
  });
  writeJson(KEYS.districts, districtStore);
  writeJson(KEYS.onboarding, onboarding);

  /* listings: members who finished their profile go visible once or twice after joining */
  const rand = random(20261119);
  const made: Made[] = [];
  const added: Record<DistrictId, unknown[]> = { "media-technology": [], construction: [], trucking: [], residential: [], commercial: [] };
  let serial = 0;
  for (const person of people) {
    if (!person.finished) continue;
    const times = rand() < 0.55 ? 2 : 1;
    let last = nowMs - person.daysAgo * DAY + 3 * HOUR;
    for (let n = 0; n < times; n += 1) {
      const room = nowMs - 6 * HOUR - last;
      if (room <= 0) break;
      const createdMs = Math.round(last + room * (n === 0 ? rand() * 0.6 : 0.3 + rand() * 0.7));
      const side: Side = rand() < 0.55 ? "in" : "out";
      added[person.district].push(listingRow(person, side, createdMs, (serial += 1)));
      made.push({ id: `demo_${person.district}_${serial}`, handle: person.handle, district: person.district, side, createdMs });
      last = createdMs + 26 * HOUR;
    }
  }
  for (const district of Object.keys(added) as DistrictId[]) {
    if (added[district].length === 0) continue;
    writeJson(KEYS.listings[district], [...readJson<unknown[]>(KEYS.listings[district], []), ...added[district]]);
  }

  /* connections: an available member and a looking member in the same district, a little after both went visible */
  const connections: unknown[] = [];
  for (const district of Object.keys(added) as DistrictId[]) {
    const ins = made.filter((item) => item.district === district && item.side === "in").sort((a, b) => a.createdMs - b.createdMs);
    const outs = made.filter((item) => item.district === district && item.side === "out").sort((a, b) => a.createdMs - b.createdMs);
    const pairs = Math.min(ins.length, outs.length, district === "construction" ? 4 : 2);
    for (let index = 0; index < pairs; index += 1) {
      const a = ins[index];
      const b = outs[index];
      if (a.handle === b.handle) continue;
      const openedMs = Math.max(a.createdMs, b.createdMs) + (4 + Math.round(rand() * 20)) * HOUR;
      if (openedMs > nowMs - 2 * HOUR) continue;
      const closed = connections.length % 3 === 2;
      connections.push({
        id: `demo_conn_${connections.length + 1}`,
        district,
        source: "board_match",
        listingId: b.id,
        requesterHandle: b.handle,
        counterpartHandle: a.handle,
        status: closed ? "closed" : "connected",
        requesterAccepted: true,
        counterpartAccepted: true,
        blocked: false,
        createdAt: new Date(openedMs).toISOString(),
      });
    }
  }
  writeJson(KEYS.connections, [...readJson<unknown[]>(KEYS.connections, []), ...connections]);

  /* reports: between the sample members; project reports are about the sample kitchen project */
  const handles = people.map((person) => person.handle);
  const project = getCxProject("cxp_demo_kitchen");
  const used = new Set(getReports().map((report) => `${report.kind}|${report.byHandle}|${report.target}`));
  const reports: CxReport[] = [];
  if (handles.length >= 3) {
    REPORTS.forEach((spec, index) => {
      const asProject = spec.kind === "project" && Boolean(project);
      const reason = spec.kind === "project" && !project ? "Something else" : spec.reason;
      for (let step = 0; step < handles.length * handles.length; step += 1) {
        const byHandle = handles[(index * 3 + 1 + Math.floor(step / handles.length)) % handles.length];
        const target = asProject ? project!.id : handles[(index * 5 + 2 + (step % handles.length)) % handles.length];
        const key = `${asProject ? "project" : "person"}|${byHandle}|${target}`;
        if (byHandle === target || used.has(key)) continue;
        used.add(key);
        const at = nowMs - spec.hoursAgo * HOUR;
        const report: CxReport = {
          id: `cxr_demo_${index + 1}`,
          kind: asProject ? "project" : "person",
          byHandle,
          target,
          projectId: asProject ? project!.id : "",
          reason,
          details: spec.details,
          createdAt: new Date(at).toISOString(),
          status: spec.decidedAfterHours === undefined ? "open" : "resolved",
          sample: true,
        };
        if (spec.decidedAfterHours !== undefined) {
          report.resolution = {
            action: spec.action ?? "none",
            note: spec.action === "warn" ? "Sent a reminder about the Vael rules." : "Looked into it. No action needed.",
            at: new Date(at + spec.decidedAfterHours * HOUR).toISOString(),
          };
        }
        reports.push(report);
        break;
      }
    });
    addCxReports(reports);
  }

  writeJson(KEYS.members, handles);
  localStorage.setItem(KEYS.done, "1");
  return { members: newAccounts.length, listings: made.length, connections: connections.length, reports: reports.length };
}

/** Takes every sample member, listing, connection and report out again. Real accounts are left alone. */
export function removeAdminDemo() {
  if (typeof localStorage === "undefined") return;
  const handles = new Set(readJson<string[]>(KEYS.members, []));
  if (handles.size > 0) {
    writeJson(KEYS.accounts, readJson<{ handle: string }[]>(KEYS.accounts, []).filter((item) => !handles.has(item.handle)));
    for (const key of [KEYS.districts, KEYS.onboarding]) {
      const store = readJson<Record<string, unknown>>(key, {});
      for (const handle of handles) delete store[handle];
      writeJson(key, store);
    }
    for (const key of Object.values(KEYS.listings)) {
      writeJson(key, readJson<{ handle: string }[]>(key, []).filter((item) => !handles.has(item.handle)));
    }
    writeJson(
      KEYS.connections,
      readJson<{ requesterHandle: string; counterpartHandle: string }[]>(KEYS.connections, []).filter(
        (item) => !handles.has(item.requesterHandle) && !handles.has(item.counterpartHandle),
      ),
    );
  }
  removeSampleCxReports();
  localStorage.removeItem(KEYS.members);
  localStorage.removeItem(KEYS.done);
}
