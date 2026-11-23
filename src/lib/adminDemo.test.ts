import { beforeEach, describe, expect, it } from "vitest";
import { createAccount, getAccounts } from "./accounts";
import { adminDashboard, adminOverview, adminReports, foundingRows, memberPhoto, subjectPhoto } from "./adminStore";
import { removeAdminDemo, seedAdminDemo } from "./adminDemo";
import { fileReport } from "./cxProjectStore";

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
  createAccount({ email: "real@example.com", handle: "realone", displayName: "Real One" });
});

describe("sample data for the admin demo", () => {
  it("fills every part of the dashboard, once", () => {
    const added = seedAdminDemo();
    expect(added.members).toBeGreaterThanOrEqual(25);
    expect(added.listings).toBeGreaterThan(20);
    expect(added.connections).toBeGreaterThanOrEqual(6);
    expect(added.reports).toBeGreaterThanOrEqual(10);
    expect(seedAdminDemo()).toEqual({ members: 0, listings: 0, connections: 0, reports: 0 });

    const month = adminDashboard(30);
    const quarter = adminDashboard(90);
    expect(month.summary.members.joined).toBeGreaterThan(5);
    expect(quarter.summary.members.joined).toBeGreaterThan(month.summary.members.joined);
    expect(quarter.summary.listings.total).toBeGreaterThan(month.summary.listings.total);
    expect(quarter.summary.listings.available).toBeGreaterThan(0);
    expect(quarter.summary.listings.looking).toBeGreaterThan(0);
    expect(quarter.summary.connections.opened).toBeGreaterThan(0);
    expect(quarter.summary.connections.stillOpen).toBeGreaterThan(0);
    expect(quarter.summary.connections.ended).toBeGreaterThan(0);
    expect(quarter.summary.reports.filed).toBeGreaterThan(0);
    expect(quarter.byReason.filter((row) => row.count > 0).length).toBeGreaterThanOrEqual(5);
    // Every district that can hold listings has some.
    const withListings = quarter.byDistrict.filter((row) => row.count > 0).map((row) => row.id);
    expect(withListings).toEqual(expect.arrayContaining(["construction", "media-technology", "trucking", "residential", "commercial"]));
    expect(adminOverview().profilesFinished).toBeGreaterThan(15);
    expect(foundingRows().length).toBe(getAccounts().length);
  });

  it("keeps the real people out of the sample reports and leaves them alone", () => {
    createAccount({ email: "real2@example.com", handle: "realtwo", displayName: "Real Two" });
    seedAdminDemo();
    for (const report of adminReports()) {
      expect(report.sample).toBe(true);
      expect(["realone", "realtwo"]).not.toContain(report.byHandle);
      expect(["realone", "realtwo"]).not.toContain(report.target);
    }
    expect(getAccounts().filter((account) => ["realone", "realtwo"].includes(account.handle))).toHaveLength(2);
  });

  it("replaces the older sample reports and keeps a real report", () => {
    createAccount({ email: "real2@example.com", handle: "realtwo", displayName: "Real Two" });
    fileReport({ kind: "person", byHandle: "realone", target: "realtwo", projectId: "", reason: "Fraud or scam" });
    seedAdminDemo();
    const reports = adminReports();
    expect(reports.filter((report) => !report.sample)).toHaveLength(1);
    expect(reports.filter((report) => report.sample).length).toBeGreaterThanOrEqual(10);
  });

  it("takes every sample row out again", () => {
    seedAdminDemo();
    removeAdminDemo();
    expect(getAccounts().map((account) => account.handle)).toEqual(["realone"]);
    expect(adminReports()).toHaveLength(0);
    const quarter = adminDashboard(90);
    expect(quarter.summary.listings.total).toBe(0);
    expect(quarter.summary.connections.opened).toBe(0);
    // And it can be added again afterwards.
    expect(seedAdminDemo().members).toBeGreaterThan(0);
  });

  it("gives sample members stock portraits, never to real members, and lets a member's own photo win", () => {
    seedAdminDemo();
    expect(memberPhoto("noahpatel")).toBe("/people/p03.jpg");
    expect(memberPhoto("realone")).toBeUndefined();
    // Nobody gets a face that was not given to them: a handle that is not a sample member has none.
    removeAdminDemo();
    expect(memberPhoto("noahpatel")).toBeUndefined();
  });

  it("shows the reported person's face on a person report, and none for an opportunity", () => {
    seedAdminDemo();
    const person = adminReports().find((report) => report.kind === "person" && memberPhoto(report.target));
    expect(person && subjectPhoto(person)).toBeTruthy();
    const project = adminReports().find((report) => report.kind === "project");
    if (project) expect(subjectPhoto(project)).toBeUndefined();
  });
});
