import { beforeEach, describe, expect, it } from "vitest";
import { createAccount } from "./accounts";
import {
  answerProjectQuestion,
  askProjectQuestion,
  attachDraftToHandle,
  bestMatchGroups,
  canHomeownerHandshake,
  closeCxProject,
  closeOtherHandshakes,
  confirmCxEmail,
  confirmCxPhone,
  confirmProjectScopeChange,
  contractorEligibleFor,
  contractorInterested,
  CX_MAX_OPEN_HANDSHAKES,
  editLiveProject,
  extendCxProject,
  getCxProject,
  homeownerInterested,
  intakeReady,
  openProjectHandshakesFor,
  projectsForHandle,
  opportunitiesForContractor,
  opportunitiesForVaelIn,
  getVaelances,
  patchCxProject,
  projectThreadFor,
  publishCxProject,
  publicProjectCard,
  respondentsFor,
  responseGroupFor,
  restoreDraftByEmail,
  revealedContacts,
  saveProjectContact,
  sendHandshakeMessage,
  saveVaelance,
  startCxDraft,
  toggleSavedContractor,
} from "./cxProjectStore";
import { closeConnection, getConnections, getNotices, sendMessage } from "./vaelStore";
import { ensureCxProfile, saveCxProfile } from "./constructionStore";
import { patchOnboarding } from "./onboarding";

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

function readyDraft() {
  const draft = startCxDraft("Kitchen");
  saveProjectContact(draft.id, "home@example.com", "4045550100");
  const account = createAccount({
    email: "home@example.com",
    handle: "priyahome",
    displayName: "Priya Home",
    phone: "4045550100",
  });
  attachDraftToHandle(draft.id, account.handle, "Priya");
  confirmCxEmail(draft.id);
  confirmCxPhone(draft.id);
  return { ...getCxProject(draft.id)!, handle: account.handle };
}

function fillIntake(id: string) {
  patchCxProject(id, {
    description: "Replace cabinets and countertops, keeping the existing layout. Cabinets are 1990s oak.",
    city: "Jacksonville",
    postalCode: "32204",
    timing: "Within 30 days",
    budgetBand: "$20,000 to $30,000",
  });
}

describe("cx residential projects", () => {
  it("restores a draft by email", () => {
    const draft = startCxDraft("Kitchen");
    saveProjectContact(draft.id, "home@example.com", "4045550100");
    expect(restoreDraftByEmail("home@example.com")?.id).toBe(draft.id);
  });

  it("will not publish without email and phone confirmation", () => {
    const draft = startCxDraft("Roofing");
    fillIntake(draft.id);
    attachDraftToHandle(draft.id, "priyahome", "Priya");
    expect(() => publishCxProject(draft.id)).toThrow(/Confirm email and phone/);
    confirmCxEmail(draft.id);
    expect(() => publishCxProject(draft.id)).toThrow(/Confirm email and phone/);
  });

  it("publishes for 7 days and reminds at day 5", () => {
    const { id, handle } = readyDraft();
    fillIntake(id);
    const live = publishCxProject(id);
    expect(live.status).toBe("live");
    const span = Date.parse(live.liveUntil) - Date.parse(live.publishedAt);
    expect(span).toBe(7 * 86400000);

    const fiveDays = Date.parse(live.publishedAt) + 5 * 86400000 + 1000;
    const realNow = Date.now;
    Date.now = () => fiveDays;
    getCxProject(id);
    Date.now = realNow;
    expect(getNotices(handle).some((item) => item.kind === "project_expiring")).toBe(true);
  });

  it("hides a project from contractors who do not work that category", () => {
    saveVaelance({ handle: "pro1", projectCategories: ["Plumbing"], projectRole: "whole" });
    ensureCxProfile("pro1");
    saveCxProfile({ ...ensureCxProfile("pro1"), serviceArea: "Jacksonville" });
    const { id } = readyDraft();
    fillIntake(id);
    publishCxProject(id);
    const project = getCxProject(id)!;
    expect(contractorEligibleFor(project, "pro1")).toBe(false);
    expect(opportunitiesForContractor("pro1").map((item) => item.id)).not.toContain(id);
  });

  it("shows a Vael Out project on the Vael In opportunity list", () => {
    createAccount({ email: "out@example.com", handle: "hiringout", displayName: "Hiring Out" });
    patchOnboarding("hiringout", { intent: "out" });
    const draft = startCxDraft("Kitchen");
    saveProjectContact(draft.id, "out@example.com", "4045550199");
    attachDraftToHandle(draft.id, "hiringout", "Hiring");
    confirmCxEmail(draft.id);
    confirmCxPhone(draft.id);
    fillIntake(draft.id);
    createAccount({ email: "in@example.com", handle: "availablein", displayName: "Available In" });
    patchOnboarding("availablein", { intent: "in" });
    const live = publishCxProject(draft.id);
    expect(opportunitiesForVaelIn("availablein").map((item) => item.id)).toContain(live.id);
    expect(opportunitiesForVaelIn("hiringout").map((item) => item.id)).not.toContain(live.id);
    expect(getNotices("availablein").some((item) => item.title === "Hey, you have an opportunity" && item.body === "Wanna see?")).toBe(true);
    expect(getNotices("hiringout").some((item) => item.kind === "vael_in_opportunity")).toBe(false);
  });

  it("shows a project only when location, category, and role all fit", () => {
    saveVaelance({ handle: "local", projectCategories: ["Kitchen"], projectRole: "specialty" });
    ensureCxProfile("local");
    saveCxProfile({ ...ensureCxProfile("local"), serviceArea: "Jacksonville", credentials: [] });
    saveVaelance({ handle: "away", projectCategories: ["Kitchen"], projectRole: "whole" });
    ensureCxProfile("away");
    saveCxProfile({ ...ensureCxProfile("away"), serviceArea: "Atlanta" });
    saveVaelance({ handle: "norole", projectCategories: ["Kitchen"], projectRole: "" as "whole" });
    const { id } = readyDraft();
    fillIntake(id);
    publishCxProject(id);
    const project = getCxProject(id)!;
    expect(contractorEligibleFor(project, "local")).toBe(true);
    expect(opportunitiesForContractor("local").map((item) => item.id)).toContain(id);
    expect(contractorEligibleFor(project, "away")).toBe(false);
    expect(opportunitiesForContractor("away").map((item) => item.id)).not.toContain(id);
    expect(contractorEligibleFor(project, "norole")).toBe(false);
    expect(publicProjectCard(project).city).toBe("Jacksonville");
    expect("email" in publicProjectCard(project)).toBe(false);
    expect("phone" in publicProjectCard(project)).toBe(false);
    expect("streetAddress" in publicProjectCard(project)).toBe(false);
  });

  it("keeps the seeded whole-project contractor eligible in Jacksonville", () => {
    getVaelances();
    saveCxProfile({ ...ensureCxProfile("ridgeworks"), serviceArea: "Atlanta", location: "Atlanta, GA" });
    getVaelances();
    const { id } = readyDraft();
    fillIntake(id);
    publishCxProject(id);
    expect(contractorEligibleFor(getCxProject(id)!, "ridgeworks")).toBe(true);
  });

  it("places Either in the whole-project group", () => {
    expect(responseGroupFor("either")).toBe("whole");
    expect(responseGroupFor("whole")).toBe("whole");
    expect(responseGroupFor("specialty")).toBe("specialty");
  });

  it("opens a Handshake as connected after two I'm Interested presses", () => {
    saveVaelance({
      handle: "ridgeworks",
      projectCategories: ["Kitchen", "Bathroom"],
      projectRole: "whole",
    });
    ensureCxProfile("ridgeworks");
    saveCxProfile({ ...ensureCxProfile("ridgeworks"), serviceArea: "Jacksonville", location: "Jacksonville, FL" });

    const { id, handle } = readyDraft();
    fillIntake(id);
    publishCxProject(id);

    contractorInterested(id, "ridgeworks");
    const afterOne = getConnections().filter((item) => item.projectId === id);
    expect(afterOne).toHaveLength(0);
    expect(() => sendMessage("missing", "ridgeworks", "hi")).toThrow();

    const interest = homeownerInterested(id, "ridgeworks", handle);
    const connection = getConnections().find((item) => item.id === interest.connectionId);
    expect(connection?.status).toBe("connected");
    expect(connection?.source).toBe("project_interest");
    expect(sendMessage(connection!.id, handle, "Let's talk timing").body).toBe("Let's talk timing");
  });

  it("keeps private messages on that project Handshake", () => {
    saveVaelance({ handle: "ridgeworks", projectCategories: ["Kitchen"], projectRole: "whole" });
    ensureCxProfile("ridgeworks");
    saveCxProfile({ ...ensureCxProfile("ridgeworks"), serviceArea: "Jacksonville" });
    saveVaelance({ handle: "oakcabinets", projectCategories: ["Kitchen"], projectRole: "specialty" });
    ensureCxProfile("oakcabinets");
    saveCxProfile({ ...ensureCxProfile("oakcabinets"), serviceArea: "Jacksonville" });

    const { id, handle } = readyDraft();
    fillIntake(id);
    publishCxProject(id);
    contractorInterested(id, "ridgeworks");
    contractorInterested(id, "oakcabinets");
    const interest = homeownerInterested(id, "ridgeworks", handle);
    sendHandshakeMessage(interest.connectionId, handle, "Can you start Thursday?");
    sendHandshakeMessage(interest.connectionId, "ridgeworks", "Thursday works.");

    expect(projectThreadFor(id, interest.connectionId, handle).map((item) => item.body)).toEqual([
      "Can you start Thursday?",
      "Thursday works.",
    ]);
    expect(projectThreadFor(id, interest.connectionId, "oakcabinets")).toEqual([]);
    expect(() => sendHandshakeMessage(interest.connectionId, "oakcabinets", "I can see this")).toThrow(/Handshake/);

    const second = startCxDraft("Kitchen");
    attachDraftToHandle(second.id, handle, "Priya");
    confirmCxEmail(second.id);
    confirmCxPhone(second.id);
    fillIntake(second.id);
    publishCxProject(second.id);
    contractorInterested(second.id, "ridgeworks");
    const other = homeownerInterested(second.id, "ridgeworks", handle);
    expect(other.connectionId).not.toBe(interest.connectionId);
    expect(projectThreadFor(second.id, other.connectionId, handle)).toEqual([]);
    expect(projectThreadFor(second.id, interest.connectionId, handle)).toEqual([]);
  });

  it("caps the homeowner at 3 Handshakes and does not auto-close the others", () => {
    const { id, handle } = readyDraft();
    fillIntake(id);
    publishCxProject(id);
    for (let i = 1; i <= 4; i += 1) {
      const contractor = `crew${i}`;
      saveVaelance({ handle: contractor, projectCategories: ["Kitchen"], projectRole: i === 4 ? "specialty" : "whole" });
      ensureCxProfile(contractor);
      saveCxProfile({ ...ensureCxProfile(contractor), serviceArea: "Jacksonville" });
      contractorInterested(id, contractor);
      if (i <= 3) homeownerInterested(id, contractor, handle);
    }
    expect(openProjectHandshakesFor(handle)).toHaveLength(CX_MAX_OPEN_HANDSHAKES);
    expect(openProjectHandshakesFor(handle).every((item) => item.status === "connected")).toBe(true);
    expect(canHomeownerHandshake(handle)).toBe(false);
    expect(() => homeownerInterested(id, "crew4", handle)).toThrow(/3 Handshakes/);
    const keep = openProjectHandshakesFor(handle)[0]!;
    expect(closeOtherHandshakes(handle, keep.id)).toHaveLength(2);
    expect(openProjectHandshakesFor(handle)).toHaveLength(1);
  });

  it("closes one Handshake and keeps the project, history, and the other Handshakes", () => {
    saveVaelance({ handle: "ridgeworks", projectCategories: ["Kitchen"], projectRole: "whole" });
    ensureCxProfile("ridgeworks");
    saveCxProfile({ ...ensureCxProfile("ridgeworks"), serviceArea: "Jacksonville" });
    const { id, handle } = readyDraft();
    fillIntake(id);
    publishCxProject(id);
    contractorInterested(id, "ridgeworks");
    const first = homeownerInterested(id, "ridgeworks", handle);
    sendHandshakeMessage(first.connectionId, handle, "Keep this record.");
    const secondContractor = "crewkeep";
    saveVaelance({ handle: secondContractor, projectCategories: ["Kitchen"], projectRole: "specialty" });
    ensureCxProfile(secondContractor);
    saveCxProfile({ ...ensureCxProfile(secondContractor), serviceArea: "Jacksonville" });
    contractorInterested(id, secondContractor);
    const second = homeownerInterested(id, secondContractor, handle);
    const before = getCxProject(id)!;
    closeConnection(first.connectionId);
    expect(openProjectHandshakesFor(handle).map((item) => item.id)).toEqual([second.connectionId]);
    expect(getCxProject(id)?.status).toBe("live");
    expect(getCxProject(id)?.history).toEqual(before.history);
    expect(projectThreadFor(id, first.connectionId, handle).map((item) => item.body)).toEqual(["Keep this record."]);
    expect(() => sendHandshakeMessage(first.connectionId, handle, "Still open?")).toThrow(/Handshake/);
    expect(projectThreadFor(id, second.connectionId, secondContractor)).toEqual([]);
  });

  it("keeps questions on the project and notifies respondents on a confirmed scope change", () => {
    saveVaelance({ handle: "ridgeworks", projectCategories: ["Kitchen"], projectRole: "whole" });
    ensureCxProfile("ridgeworks");
    saveCxProfile({ ...ensureCxProfile("ridgeworks"), serviceArea: "Jacksonville" });
    const { id, handle } = readyDraft();
    fillIntake(id);
    publishCxProject(id);
    contractorInterested(id, "ridgeworks");
    const question = askProjectQuestion(id, "ridgeworks", "Are you also replacing the plumbing?");
    const before = getCxProject(id)!.description;
    answerProjectQuestion(question.id, "Yes — replace the kitchen plumbing too.", true);
    expect(getCxProject(id)?.description).toBe(before);
    expect(getCxProject(id)?.history.some((item) => item.kind === "scope_change")).toBe(false);
    expect(getNotices("ridgeworks").some((item) => item.kind === "scope_changed")).toBe(false);
    expect(() => confirmProjectScopeChange(question.id, "ridgeworks")).toThrow(/homeowner/);
    confirmProjectScopeChange(question.id, handle);
    const after = getCxProject(id)!;
    expect(after.description).toContain("replace the kitchen plumbing too");
    expect(after.description.startsWith(before)).toBe(true);
    expect(after.history.some((item) => item.kind === "scope_change" && item.note.includes(before))).toBe(true);
    expect(getNotices("ridgeworks").some((item) => item.kind === "scope_changed")).toBe(true);
    expect(publicProjectCard(after).description).toBe(after.description);
  });

  it("hides private contact until Handshake is connected", () => {
    const { id } = readyDraft();
    fillIntake(id);
    const live = publishCxProject(id);
    const card = publicProjectCard(live);
    expect(card.firstName).toBe("Priya");
    expect("email" in card).toBe(false);
    expect(revealedContacts(live, undefined)).toBeNull();
  });

  it("treats Not sure yet as a complete budget answer", () => {
    const draft = startCxDraft("Other");
    patchCxProject(draft.id, {
      description: "Not sure of the full scope yet.",
      city: "Atlanta",
      postalCode: "30308",
      timing: "Just planning",
      budgetBand: "Not sure yet",
    });
    expect(intakeReady(getCxProject(draft.id))).toBe(true);
  });

  it("groups Best Matches without using a single ranked list", () => {
    saveVaelance({ handle: "ridgeworks", projectCategories: ["Kitchen"], projectRole: "whole" });
    saveVaelance({ handle: "oakcabinets", projectCategories: ["Kitchen"], projectRole: "specialty" });
    ensureCxProfile("ridgeworks");
    saveCxProfile({ ...ensureCxProfile("ridgeworks"), serviceArea: "Jacksonville" });
    const { id } = readyDraft();
    fillIntake(id);
    publishCxProject(id);
    contractorInterested(id, "ridgeworks");
    contractorInterested(id, "oakcabinets");
    const project = getCxProject(id)!;
    const groups = bestMatchGroups(project);
    expect(groups.whole.some((item) => item.handle === "ridgeworks")).toBe(true);
    expect(groups.specialty.some((item) => item.handle === "oakcabinets")).toBe(true);
    expect(respondentsFor(project)).toHaveLength(2);
  });

  it("extends and closes a live project without removing the Handshake", () => {
    saveVaelance({ handle: "ridgeworks", projectCategories: ["Kitchen"], projectRole: "whole" });
    ensureCxProfile("ridgeworks");
    saveCxProfile({ ...ensureCxProfile("ridgeworks"), serviceArea: "Jacksonville" });
    saveVaelance({ handle: "oakcabinets", projectCategories: ["Kitchen"], projectRole: "specialty" });
    ensureCxProfile("oakcabinets");
    saveCxProfile({ ...ensureCxProfile("oakcabinets"), serviceArea: "Jacksonville" });
    const { id, handle } = readyDraft();
    fillIntake(id);
    publishCxProject(id);
    const extended = extendCxProject(id);
    expect(extended.status).toBe("live");
    contractorInterested(id, "ridgeworks");
    const interest = homeownerInterested(id, "ridgeworks", handle);
    sendHandshakeMessage(interest.connectionId, handle, "Still here after close.");
    const closed = closeCxProject(id);
    expect(closed.status).toBe("closed");
    expect(closed.history.length).toBeGreaterThan(extended.history.length);
    expect(projectsForHandle(handle).some((item) => item.id === id && item.status === "closed")).toBe(true);
    expect(opportunitiesForContractor("oakcabinets").map((item) => item.id)).not.toContain(id);
    expect(openProjectHandshakesFor(handle).some((item) => item.id === interest.connectionId)).toBe(true);
    expect(getConnections().find((item) => item.id === interest.connectionId)?.status).toBe("connected");
    expect(projectThreadFor(id, interest.connectionId, handle).map((item) => item.body)).toEqual(["Still here after close."]);
    expect(() => contractorInterested(id, "oakcabinets")).toThrow(/not live/);
    expect(() => editLiveProject(id, { description: "Changed after close." })).toThrow(/closed/);
  });

  it("lets a homeowner save a contractor without messaging", () => {
    const { id, handle } = readyDraft();
    fillIntake(id);
    publishCxProject(id);
    const saved = toggleSavedContractor(id, "ridgeworks", handle);
    expect(saved.savedByHomeowner).toBe(true);
  });
});
