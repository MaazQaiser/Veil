import { beforeEach, describe, expect, it } from "vitest";
import { createAccount } from "./accounts";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  accountSignInBlock,
  accountStatus,
  adminAttention,
  KNOWN_REPORT_REASONS,
  addAdmin,
  adminStaff,
  deleteAdmin,
  removeAdmin,
  restoreAdmin,
  RETURN_NOTE_MAX,
  returnFoundingPlace,
  REPORT_ABOUT,
  reportAbout,
  shortReason,
  adminDashboard,
  foundingRows,
  adminFeed,
  adminLoginCheck,
  barStepDays,
  bucketDays,
  adminOverview,
  adminReports,
  adminSignIn,
  adminSignOut,
  getAuditLog,
  getGuides,
  publishedGuidesFor,
  defaultReviewBy,
  getHelpListings,
  getPageSettings,
  isAdminSignedIn,
  publishedHelpFor,
  resolveReport,
  saveGuide,
  setGuideStatus,
  saveHelpListing,
  savePageSettings,
  setAccountStatus,
  setHelpStatus,
  validateHelp,
} from "./adminStore";
import { fileReport } from "./cxProjectStore";
import { getNotices } from "./vaelStore";

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => memory.clear(),
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() {
      return memory.size;
    },
  } as Storage;
});

function twoPeople() {
  createAccount({ email: "holly@example.com", handle: "holly", displayName: "Holly" });
  createAccount({ email: "sullean@example.com", handle: "sullean", displayName: "Sullean" });
}

describe("admin sign-in", () => {
  it("only the admin email with the admin password goes to the console", () => {
    expect(adminLoginCheck(ADMIN_EMAIL, ADMIN_PASSWORD)).toBe("ok");
    expect(adminLoginCheck(` ${ADMIN_EMAIL.toUpperCase()} `, ADMIN_PASSWORD)).toBe("ok");
    expect(adminLoginCheck(ADMIN_EMAIL, "nope")).toBe("wrong_password");
    expect(adminLoginCheck("holly@example.com", ADMIN_PASSWORD)).toBe("not_admin");
  });

  it("remembers the admin session until sign out", () => {
    expect(isAdminSignedIn()).toBe(false);
    adminSignIn();
    expect(isAdminSignedIn()).toBe(true);
    adminSignOut();
    expect(isAdminSignedIn()).toBe(false);
  });
});

describe("reports", () => {
  it("warning tells the reporter we acted and warns the reported person", () => {
    twoPeople();
    fileReport({ kind: "person", byHandle: "holly", target: "sullean", projectId: "", reason: "Harassment", details: "Rude messages" });
    const [report] = adminReports();
    expect(report.status).toBe("open");

    resolveReport(report.id, "warn", "Checked the thread.");

    const after = adminReports()[0];
    expect(after.status).toBe("resolved");
    expect(after.resolution?.action).toBe("warn");
    expect(getNotices("holly").some((n) => n.body.includes("took action"))).toBe(true);
    expect(getNotices("sullean").some((n) => n.title === "A message from Vael")).toBe(true);
    expect(accountStatus("sullean")).toBe("active");
  });

  it("no action does not touch the reported person", () => {
    twoPeople();
    fileReport({ kind: "person", byHandle: "holly", target: "sullean", projectId: "", reason: "Fraud" });
    resolveReport(adminReports()[0].id, "none", "Not what she flagged him for.");
    expect(getNotices("sullean").length).toBe(0);
    expect(getNotices("holly").some((n) => n.body.includes("no action was needed"))).toBe(true);
  });

  it("deactivating shuts the account and a report can only be resolved once", () => {
    twoPeople();
    fileReport({ kind: "person", byHandle: "holly", target: "sullean", projectId: "", reason: "Fraud" });
    const id = adminReports()[0].id;
    resolveReport(id, "deactivate", "");
    expect(accountStatus("sullean")).toBe("deactivated");
    expect(() => resolveReport(id, "warn", "")).toThrow();
  });

  it("a second report of the same person is refused by the member side", () => {
    twoPeople();
    fileReport({ kind: "person", byHandle: "holly", target: "sullean", projectId: "", reason: "Fraud" });
    expect(() => fileReport({ kind: "person", byHandle: "holly", target: "sullean", projectId: "", reason: "Again" })).toThrow();
  });
});

describe("accounts", () => {
  it("deactivated and blocked people cannot sign in, and blocked is permanent", () => {
    twoPeople();
    expect(accountSignInBlock("holly")).toBeNull();
    setAccountStatus("holly", "deactivated", "Test");
    expect(accountSignInBlock("holly")).toMatch(/deactivated/);
    setAccountStatus("holly", "active");
    expect(accountSignInBlock("holly")).toBeNull();
    setAccountStatus("holly", "blocked", "Fraud");
    expect(accountSignInBlock("holly")).toMatch(/blocked/);
    expect(() => setAccountStatus("holly", "active")).toThrow();
  });
});

describe("resources and help", () => {
  it("a guide needs a title, and publishing needs text", () => {
    expect(() => saveGuide({ title: " ", summary: "", body: "x" }, "draft")).toThrow();
    expect(() => saveGuide({ title: "FL order", summary: "", body: "" }, "published")).toThrow();
    saveGuide({ title: "FL order", summary: "s", body: "Do this." }, "published");
    expect(getGuides().some((g) => g.title === "FL order" && g.status === "published")).toBe(true);
  });

  it("help listings validate links and show only where they were published", () => {
    const base = {
      title: "Legal basics",
      kind: "Official resource" as const,
      summary: "Where to start.",
      coverage: "state" as const,
      state: "FL",
      links: [{ label: "Site", url: "https://example.com" }],
      placements: ["district_help" as const, "project_room" as const],
      districtIds: ["construction"],
    };
    expect(validateHelp({ ...base, links: [{ label: "x", url: "not a link" }] }, "published")).toMatch(/https/);
    expect(validateHelp({ ...base, links: Array.from({ length: 4 }, () => ({ label: "a", url: "https://a.com" })) }, "draft")).toMatch(/up to 3/);
    expect(validateHelp({ ...base, state: "" }, "draft")).toMatch(/state/);

    const saved = saveHelpListing(base, "draft");
    expect(publishedHelpFor("construction", "project_room").some((i) => i.id === saved.id)).toBe(false);
    setHelpStatus(saved.id, "published");
    expect(publishedHelpFor("construction", "project_room").some((i) => i.id === saved.id)).toBe(true);
    expect(publishedHelpFor("trucking", "project_room").some((i) => i.id === saved.id)).toBe(false);
    expect(getHelpListings().length).toBeGreaterThan(1);
  });

  it("page text can be changed and keeps defaults for what was not touched", () => {
    savePageSettings("resources", { welcome: "Hello", disclaimer: "Careful" });
    expect(getPageSettings().resources.welcome).toBe("Hello");
    expect(getPageSettings().help.welcome.length).toBeGreaterThan(0);
    // Who can read it starts as everyone, is kept once chosen, and the texts have a limit.
    expect(getPageSettings().resources.audience).toBe("everyone");
    savePageSettings("resources", { welcome: "Hello", disclaimer: "Careful", audience: "members" });
    expect(getPageSettings().resources.audience).toBe("members");
    savePageSettings("resources", { welcome: "Hi", disclaimer: "Careful" });
    expect(getPageSettings().resources.audience).toBe("members");
    expect(() => savePageSettings("resources", { welcome: "x".repeat(1001), disclaimer: "" })).toThrow(/1,000/);
  });
});

describe("audit and overview", () => {
  it("records every admin action, newest first", () => {
    saveGuide({ title: "One", summary: "", body: "x" }, "draft");
    saveGuide({ title: "Two", summary: "", body: "x" }, "draft");
    const log = getAuditLog();
    expect(log[0].detail).toBe("Two");
    expect(log.length).toBe(2);
  });

  it("counts what is waiting", () => {
    twoPeople();
    expect(adminOverview().reportsWaiting).toBe(0);
    fileReport({ kind: "person", byHandle: "holly", target: "sullean", projectId: "", reason: "Fraud" });
    expect(adminOverview().reportsWaiting).toBe(1);
    expect(adminOverview().activeMembers).toBe(2);
  });
});

describe("dashboard numbers", () => {
  it("counts this period against the one before, and buckets the line", () => {
    const now = Date.parse("2026-11-18T12:00:00");
    const at = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
    memory.set(
      "vael_city_accounts_v1",
      JSON.stringify([
        { handle: "a", email: "a@x.com", phone: "", displayName: "A", createdAt: at(1) },
        { handle: "b", email: "b@x.com", phone: "", displayName: "B", createdAt: at(2) },
        { handle: "c", email: "c@x.com", phone: "", displayName: "C", createdAt: at(10) },
      ]),
    );
    const week = adminDashboard(7, now);
    expect(week.members.value).toBe(2);
    expect(week.members.previous).toBe(1);
    expect(week.members.pct).toBe(100);
    expect(week.series.length).toBe(7);
    expect(week.series.reduce((sum, point) => sum + point.members, 0)).toBe(2);

    expect(bucketDays(30)).toBe(1);
    expect(adminDashboard(30, now).series.length).toBe(30);
    expect(adminDashboard(90, now).series.length).toBe(13);
    expect(adminDashboard(30, now).members.value).toBe(3);

    // The running total ends at everyone, and never goes down.
    const totals = adminDashboard(30, now).memberTotals;
    expect(totals[totals.length - 1]).toBe(3);
    expect([...totals].sort((x, y) => x - y)).toEqual(totals);
    expect(adminDashboard(7, now).memberTotals[0]).toBe(1); // c joined 10 days ago, before the week began
  });

  it("has no trend to compare when nothing came before, and lists every district", () => {
    const data = adminDashboard(30);
    expect(data.members.pct).toBeNull();
    expect(data.byDistrict.length).toBe(11);
    expect(data.avgResolveHours).toBeNull();
  });
});

describe("needs you today and the live feed", () => {
  it("is empty when nothing needs the admin", () => {
    expect(adminAttention()).toEqual([]);
  });

  it("lists waiting reports and people reported more than once, then clears when handled", () => {
    twoPeople();
    createAccount({ email: "ana@example.com", handle: "ana", displayName: "Ana" });
    fileReport({ kind: "person", byHandle: "holly", target: "ana", projectId: "", reason: "Fraud" });
    fileReport({ kind: "person", byHandle: "sullean", target: "ana", projectId: "", reason: "Spam" });
    const ids = adminAttention().map((item) => item.id);
    expect(ids).toContain("reports");
    expect(ids).toContain("repeat");
    expect(adminAttention().find((item) => item.id === "reports")?.title).toMatch(/2 reports are waiting/);

    for (const report of adminReports()) resolveReport(report.id, "none", "");
    expect(adminAttention().find((item) => item.id === "reports")).toBeUndefined();
  });

  it("merges member, report and admin events newest first, and can show admin actions only", () => {
    twoPeople();
    fileReport({ kind: "person", byHandle: "holly", target: "sullean", projectId: "", reason: "Fraud" });
    saveGuide({ title: "Guide", summary: "", body: "x" }, "draft");
    const feed = adminFeed(20);
    expect(feed.some((event) => event.kind === "member")).toBe(true);
    expect(feed.some((event) => event.kind === "report")).toBe(true);
    expect(feed.some((event) => event.kind === "admin")).toBe(true);
    const times = feed.map((event) => Date.parse(event.at));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(adminFeed(20, "admin").every((event) => event.kind === "admin")).toBe(true);
  });
});


describe("the whole of Vael, not one district", () => {
  const now = Date.parse("2026-11-18T12:00:00");
  const at = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
  const listing = (handle: string, side: "in" | "out", expiresInDays: number) => ({
    id: `l_${handle}_${side}`,
    handle,
    side,
    createdAt: at(1),
    expiresAt: new Date(now + expiresInDays * 86400000).toISOString(),
  });

  it("counts new Vael In and Vael Out listings in every district, for real members only", () => {
    twoPeople();
    memory.set("cx_mock_listings_v1", JSON.stringify([listing("holly", "in", 1), listing("sullean", "out", 1)]));
    memory.set("tx_mock_listings_v1", JSON.stringify([listing("holly", "in", 1), listing("ghostsample", "in", 1)]));
    memory.set("rx_mock_listings_v1", JSON.stringify([{ ...listing("sullean", "out", 1), createdAt: at(40) }])); // made long before the period

    const { byDistrictTable, byVisibility, summary } = adminDashboard(30, now);
    const row = (id: string) => byDistrictTable.find((item) => item.id === id)!;
    expect(row("construction")).toMatchObject({ visibleIn: 1, visibleOut: 1 });
    expect(row("trucking")).toMatchObject({ visibleIn: 1, visibleOut: 0 }); // the sample person has no account
    expect(row("residential")).toMatchObject({ visibleIn: 0, visibleOut: 0 }); // made before the period
    expect(byVisibility.find((item) => item.id === "in")?.count).toBe(2);
    expect(byVisibility.find((item) => item.id === "out")?.count).toBe(1);
    expect(summary.listings).toEqual({ total: 3, available: 2, looking: 1 });
    expect(byDistrictTable.length).toBe(10); // every district, used or not
  });

  it("counts Handshakes from every source and puts each in its own district", () => {
    twoPeople();
    const connection = (id: string, district: string | undefined, source: string, status: string) => ({
      id,
      district,
      source,
      requesterHandle: "holly",
      counterpartHandle: "sullean",
      status,
      requesterAccepted: true,
      counterpartAccepted: true,
      blocked: false,
      createdAt: at(1),
    });
    memory.set(
      "mtx_mock_connections_v1",
      JSON.stringify([
        connection("c1", "trucking", "board_match", "connected"),
        connection("c2", "commercial", "handshake", "closed"),
        connection("c3", "construction", "project_interest", "connected"),
        connection("c4", "trucking", "board_match", "pending"), // not opened
      ]),
    );
    const { byDistrictTable, handshakes } = adminDashboard(7, now);
    const row = (id: string) => byDistrictTable.find((item) => item.id === id)!;
    expect(row("trucking").handshakes).toBe(1);
    expect(row("commercial").handshakes).toBe(1);
    expect(row("construction").handshakes).toBe(1);
    expect(handshakes.value).toBe(3);
  });

  it("founding places go to the first 100 members of Vael in any district", () => {
    createAccount({ email: "a@x.com", handle: "firstone", displayName: "First" });
    createAccount({ email: "b@x.com", handle: "secondone", displayName: "Second" });
    const rows = foundingRows();
    expect(rows.length).toBe(2);
    expect(rows[rows.length - 1].place).toBe(1); // newest first, so place 1 is last
    expect(rows.every((row) => typeof row.district === "string")).toBe(true);
  });

  it("the help page has a title, and its disclaimer cannot go while a listing is published", () => {
    expect(getPageSettings().help.title).toBe("Help and services");
    savePageSettings("help", { welcome: "Hi", disclaimer: "Not an endorsement.", title: "Project Help & Protection" });
    expect(getPageSettings().help.title).toBe("Project Help & Protection");
    expect(() => savePageSettings("help", { welcome: "Hi", disclaimer: "  ", title: "x".repeat(81) })).toThrow(/80/);
    // The starting data has a published listing, so an empty disclaimer is refused.
    expect(() => savePageSettings("help", { welcome: "Hi", disclaimer: "" })).toThrow(/disclaimer/);
    // The Resources page has no such rule.
    expect(() => savePageSettings("resources", { welcome: "Hi", disclaimer: "" })).not.toThrow();
  });

  it("guides take official https sources, can be archived, and have size limits", () => {
    expect(() => saveGuide({ title: "T", summary: "", body: "x", sources: [{ label: "Site", url: "http://example.com" }] }, "draft")).toThrow(/https/);
    expect(() => saveGuide({ title: "T".repeat(121), summary: "", body: "x" }, "draft")).toThrow(/120/);
    expect(() => saveGuide({ title: "T", summary: "s".repeat(301), body: "x" }, "draft")).toThrow(/300/);
    const guide = saveGuide({ title: "T", summary: "", body: "x", sources: [{ label: "", url: "https://example.com/a" }, { label: "", url: "" }] }, "published");
    expect(guide.sources).toEqual([{ label: "https://example.com/a", url: "https://example.com/a" }]);
    setGuideStatus(guide.id, "archived");
    expect(getGuides().find((item) => item.id === guide.id)?.status).toBe("archived");
    expect(publishedGuidesFor("construction").some((item) => item.id === guide.id)).toBe(false);
    setGuideStatus(guide.id, "published");
    expect(publishedGuidesFor("construction").some((item) => item.id === guide.id)).toBe(true);
  });

  it("a listing hides itself after its review day, and keeps the new fields", () => {
    const listing = saveHelpListing(
      { title: "Acme", summary: "Insurance.", kind: "Partner service", coverage: "nationwide", state: "", links: [], placements: ["district_help"], districtIds: ["construction"], category: "Licensing and permits", availability: "Mon to Fri", reviewBy: "2027-11-25" },
      "published",
    );
    expect(getHelpListings().find((item) => item.id === listing.id)).toMatchObject({ category: "Licensing and permits", availability: "Mon to Fri", reviewBy: "2027-11-25" });
    const lastMoment = Date.parse("2027-11-25T23:59:59Z");
    expect(publishedHelpFor("construction", "district_help", lastMoment).some((item) => item.id === listing.id)).toBe(true);
    expect(publishedHelpFor("construction", "district_help", lastMoment + 2000).some((item) => item.id === listing.id)).toBe(false);
    expect(defaultReviewBy(Date.parse("2026-11-25T10:00:00Z"))).toBe("2027-11-25");
    expect(validateHelp({ title: "Acme", summary: "x", kind: "Partner service", coverage: "nationwide", state: "", links: [], placements: ["district_help"], districtIds: ["construction"], reviewBy: "not a date" }, "draft")).toMatch(/date/);
  });

  it("guides keep a topic, a two-letter state and an order, and list by order", () => {
    expect(() => saveGuide({ title: "T", summary: "", body: "x", state: "Florida" }, "draft")).toThrow(/two letters/);
    expect(() => saveGuide({ title: "T", summary: "", body: "x", order: -1 }, "draft")).toThrow(/Order/);
    saveGuide({ title: "Second", summary: "", body: "x", order: 2, topic: "Contracts", state: "fl" }, "draft");
    saveGuide({ title: "First", summary: "", body: "x", order: 1 }, "draft");
    const list = getGuides().filter((guide) => ["First", "Second"].includes(guide.title));
    expect(list.map((guide) => guide.title)).toEqual(["First", "Second"]);
    expect(list[1]).toMatchObject({ topic: "Contracts", state: "FL", order: 2 });
  });

  it("a guide can be limited to some districts, and a published one needs at least one", () => {
    expect(() => saveGuide({ title: "Trucking tips", summary: "", body: "x", districtIds: [] }, "published")).toThrow(/district/);
    const guide = saveGuide({ title: "Trucking tips", summary: "", body: "x", districtIds: ["trucking"] }, "published");
    expect(guide.districtIds).toEqual(["trucking"]);
  });
});

describe("charts always have something to draw", () => {
  it("lists every report reason a member can give, even when nobody has used it", () => {
    const { byReason } = adminDashboard(30);
    expect(byReason.map((row) => row.name).sort()).toEqual([...KNOWN_REPORT_REASONS].sort());
    expect(byReason.every((row) => row.count === 0)).toBe(true);
    expect(KNOWN_REPORT_REASONS.length).toBeGreaterThanOrEqual(6);
  });

  it("puts the most-used reason first and counts reasons nobody listed", () => {
    twoPeople();
    fileReport({ kind: "person", byHandle: "holly", target: "sullean", projectId: "", reason: "Fraud or scam" });
    const { byReason } = adminDashboard(30);
    expect(byReason[0]).toMatchObject({ name: "Fraud or scam", count: 1 });
    expect(byReason.filter((row) => row.count > 0).length).toBe(1);
  });

  it("lists all ten districts even when there are no members or listings", () => {
    const { byDistrictTable, byVisibility } = adminDashboard(30);
    expect(byDistrictTable.length).toBe(10);
    expect(byVisibility.map((row) => row.name)).toEqual(["Available", "Looking"]);
    expect(byVisibility.every((row) => row.count === 0)).toBe(true);
  });
});

describe("the period filter changes the numbers", () => {
  const now = Date.parse("2026-11-18T12:00:00");
  const at = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();

  it("counts only members who joined, reports filed and connections opened inside the period", () => {
    memory.set(
      "vael_city_accounts_v1",
      JSON.stringify([
        { handle: "new1", email: "n1@x.com", phone: "", displayName: "New One", createdAt: at(2) },
        { handle: "mid1", email: "m1@x.com", phone: "", displayName: "Mid One", createdAt: at(20) },
        { handle: "old1", email: "o1@x.com", phone: "", displayName: "Old One", createdAt: at(60) },
      ]),
    );
    memory.set(
      "vael_cx_reports_v1",
      JSON.stringify([
        { id: "r1", kind: "person", byHandle: "new1", target: "old1", projectId: "", reason: "Fraud or scam", details: "", createdAt: at(3), status: "open" },
        { id: "r2", kind: "person", byHandle: "old1", target: "mid1", projectId: "", reason: "Fraud or scam", details: "", createdAt: at(50), status: "resolved" },
      ]),
    );

    const week = adminDashboard(7, now);
    expect(week.summary.members).toMatchObject({ joined: 1, alreadyHere: 2 });
    expect(week.summary.reports).toMatchObject({ filed: 1, toReview: 1, decided: 0 });
    expect(week.newestMembers.map((member) => member.handle)).toEqual(["new1"]);
    expect(week.byReason.find((row) => row.name === "Fraud or scam")?.count).toBe(1);

    const month = adminDashboard(30, now);
    expect(month.summary.members.joined).toBe(2);

    const quarter = adminDashboard(90, now);
    expect(quarter.summary.members.joined).toBe(3);
    expect(quarter.summary.reports.filed).toBe(2);
    expect(quarter.summary.reports).toMatchObject({ toReview: 1, decided: 1 });
    expect(quarter.byReason.find((row) => row.name === "Fraud or scam")?.count).toBe(2);
  });
});

describe("the card and the chart agree", () => {
  it("counts listings the same way in the totals and in the day-by-day series", () => {
    const now = Date.parse("2026-11-18T12:00:00");
    const at = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
    twoPeople();
    const row = (handle: string, side: "in" | "out", daysAgo: number) => ({ id: `l_${handle}${daysAgo}`, handle, side, createdAt: at(daysAgo), expiresAt: at(daysAgo - 1) });
    memory.set("cx_mock_listings_v1", JSON.stringify([row("holly", "in", 1), row("sullean", "out", 2), row("holly", "out", 5)]));
    // An opportunity is not a listing, so it must not be counted in either place.
    memory.set("vael_cx_projects_v1", JSON.stringify([{ id: "p1", handle: "holly", status: "live", category: "Kitchen", createdAt: at(1), publishedAt: at(1) }]));
    const data = adminDashboard(7, now);
    const fromSeries = data.series.reduce((sum, point) => sum + point.posted, 0);
    expect(data.summary.listings.total).toBe(3);
    expect(fromSeries).toBe(data.summary.listings.total);
    expect(data.posted.value).toBe(data.summary.listings.total);
  });
});

describe("bars are grouped so they can be read", () => {
  it("groups a week by day, a month in 3-day steps and a quarter by week", () => {
    const now = Date.parse("2026-11-18T12:00:00");
    expect(barStepDays(7)).toBe(1);
    expect(barStepDays(30)).toBe(3);
    expect(barStepDays(90)).toBe(7);
    expect(adminDashboard(7, now).barSeries.length).toBe(7);
    expect(adminDashboard(30, now).barSeries.length).toBe(10);
    expect(adminDashboard(90, now).barSeries.length).toBe(13);
  });

  it("adds up to the same totals as the cards", () => {
    const now = Date.parse("2026-11-18T12:00:00");
    const at = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
    twoPeople();
    const row = (handle: string, side: "in" | "out", daysAgo: number) => ({ id: `l_${handle}${daysAgo}`, handle, side, createdAt: at(daysAgo), expiresAt: at(daysAgo - 1) });
    memory.set("cx_mock_listings_v1", JSON.stringify([row("holly", "in", 1), row("sullean", "out", 7), row("holly", "out", 20), row("sullean", "in", 29)]));
    memory.set(
      "mtx_mock_connections_v1",
      JSON.stringify([
        { id: "c1", source: "board_match", district: "trucking", requesterHandle: "holly", counterpartHandle: "sullean", status: "connected", requesterAccepted: true, counterpartAccepted: true, blocked: false, createdAt: at(4) },
        { id: "c2", source: "handshake", district: "trucking", requesterHandle: "holly", counterpartHandle: "sullean", status: "closed", requesterAccepted: true, counterpartAccepted: true, blocked: false, createdAt: at(15) },
      ]),
    );
    for (const days of [7, 30, 90] as const) {
      const data = adminDashboard(days, now);
      expect(data.barSeries.reduce((sum, point) => sum + point.posted, 0)).toBe(data.summary.listings.total);
      expect(data.barSeries.reduce((sum, point) => sum + point.handshakes, 0)).toBe(data.summary.connections.opened);
    }
  });
});


describe("short report reasons", () => {
  it("gives every reason a short name that fits under a column", () => {
    for (const reason of KNOWN_REPORT_REASONS) {
      const short = shortReason(reason);
      expect(short.length).toBeLessThanOrEqual(14);
      expect(short.length).toBeLessThanOrEqual(reason.length);
    }
    expect(new Set(KNOWN_REPORT_REASONS.map(shortReason)).size).toBe(KNOWN_REPORT_REASONS.length);
  });

  it("leaves an unknown reason as it was written", () => {
    expect(shortReason("A reason from the future")).toBe("A reason from the future");
  });
});

describe("what a report is about", () => {
  it("lists the About choices in order and puts people under Members and opportunities under Projects", () => {
    expect(REPORT_ABOUT.map((item) => item.label)).toEqual(["Members", "Projects", "Conversations", "Files", "VAELs", "Other"]);
    twoPeople();
    fileReport({ kind: "person", byHandle: "holly", target: "sullean", projectId: "", reason: "Fraud or scam" });
    expect(reportAbout(adminReports()[0])).toBe("members");
    expect(reportAbout({ ...adminReports()[0], kind: "project" })).toBe("projects");
  });
});

describe("returning a founding place", () => {
  it("frees the place, tells the member without the note, and writes the audit log", () => {
    twoPeople();
    expect(foundingRows().map((row) => row.handle).sort()).toEqual(["holly", "sullean"]);
    returnFoundingPlace("holly", "duplicate", "Same person as sullean, matching phone number.");
    expect(foundingRows().map((row) => row.handle)).toEqual(["sullean"]);
    expect(adminOverview().foundingHeld).toBe(1);
    const notice = getNotices("holly").find((item) => item.title === "Your founding place was returned");
    expect(notice).toBeTruthy();
    expect(`${notice?.title} ${notice?.body}`).not.toContain("matching phone");
    const log = getAuditLog()[0];
    expect(log.action).toBe("Returned a founding place");
    expect(log.detail).toContain("Duplicate or shell account");
    expect(log.detail).toContain("matching phone number");
  });

  it("needs a note, is only for a member who holds a place, and cannot be done twice", () => {
    twoPeople();
    expect(() => returnFoundingPlace("holly", "other", "   ")).toThrow(/note/i);
    expect(() => returnFoundingPlace("holly", "other", "x".repeat(RETURN_NOTE_MAX + 1))).toThrow(/characters/i);
    expect(() => returnFoundingPlace("nobody", "other", "A reason")).toThrow(/does not hold/i);
    returnFoundingPlace("holly", "other", "A reason");
    expect(() => returnFoundingPlace("holly", "other", "A reason")).toThrow(/does not hold/i);
  });

  it("does not hand a returned place to the next member on its own", () => {
    twoPeople();
    returnFoundingPlace("holly", "other", "A reason");
    createAccount({ email: "ana@example.com", handle: "ana", displayName: "Ana" });
    const handles = foundingRows().map((row) => row.handle);
    expect(handles).not.toContain("holly");
    expect(handles).toContain("ana");
  });
});

describe("admins", () => {
  it("starts with the owner only, and the owner comes first", () => {
    const staff = adminStaff();
    expect(staff).toHaveLength(1);
    expect(staff[0]).toMatchObject({ role: "owner", status: "active", email: ADMIN_EMAIL });
  });

  it("adds an admin by name and email, tidies them, and writes the audit log", () => {
    const row = addAdmin("  Sara Whitfield ", "  Sara@Example.com ");
    expect(row).toMatchObject({ name: "Sara Whitfield", email: "sara@example.com", status: "active" });
    expect(adminStaff().map((item) => item.email)).toEqual([ADMIN_EMAIL, "sara@example.com"]);
    expect(getAuditLog()[0]).toMatchObject({ action: "Added an admin" });
  });

  it("asks for a name and a real email, and does not add the same person twice or the owner again", () => {
    expect(() => addAdmin("", "a@b.com")).toThrow(/name/i);
    expect(() => addAdmin("A", "")).toThrow(/email/i);
    expect(() => addAdmin("A", "not-an-email")).toThrow(/look right/i);
    expect(() => addAdmin("A", ADMIN_EMAIL.toUpperCase())).toThrow(/owner/i);
    addAdmin("Sara", "sara@example.com");
    expect(() => addAdmin("Sara again", "SARA@example.com")).toThrow(/already/i);
  });

  it("removes an admin but keeps them listed, then restores them", () => {
    const { id } = addAdmin("Sara", "sara@example.com");
    removeAdmin(id);
    expect(adminStaff().find((item) => item.id === id)?.status).toBe("removed");
    expect(() => addAdmin("Sara", "sara@example.com")).toThrow(/restore/i);
    restoreAdmin(id);
    expect(adminStaff().find((item) => item.id === id)?.status).toBe("active");
  });

  it("deletes an admin for good, and never lets the owner be changed", () => {
    const { id } = addAdmin("Sara", "sara@example.com");
    deleteAdmin(id);
    expect(adminStaff().map((item) => item.id)).toEqual(["owner"]);
    expect(() => deleteAdmin(id)).toThrow(/no longer/i);
    expect(() => removeAdmin("owner")).toThrow(/owner/i);
    expect(() => deleteAdmin("owner")).toThrow(/owner/i);
    // The same person can be added again afterwards.
    expect(addAdmin("Sara", "sara@example.com").status).toBe("active");
  });

  it("lists admins oldest first", () => {
    addAdmin("Newer", "newer@example.com", "2026-11-10T10:00:00.000Z");
    addAdmin("Older", "older@example.com", "2026-09-10T10:00:00.000Z");
    expect(adminStaff().slice(1).map((item) => item.name)).toEqual(["Older", "Newer"]);
  });
});
