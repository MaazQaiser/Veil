import { beforeEach, describe, expect, it } from "vitest";
import { createAccount } from "./accounts";
import { ensureCxProfile, saveCxProfile } from "./constructionStore";
import {
  CX_ROOM_MAX_FILES,
  CX_ROOM_MAX_BYTES,
  addRoomFile,
  askProjectQuestion,
  attachDraftToHandle,
  blockRoom,
  canReopenRoom,
  closeRoom,
  confirmCxEmail,
  confirmCxPhone,
  contractorEligibleFor,
  contractorInterested,
  fileReport,
  getCxProject,
  getRoom,
  hasAskedQuestion,
  homeownerInterested,
  matchPercent,
  patchCxProject,
  publishCxProject,
  reopenRoom,
  revealedContacts,
  saveProjectContact,
  shareContactDetails,
  startCxDraft,
} from "./cxProjectStore";
import { getConnection } from "./vaelStore";

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

function liveProject() {
  const draft = startCxDraft("Kitchen");
  saveProjectContact(draft.id, "home@example.com", "4045550100");
  const account = createAccount({ email: "home@example.com", handle: "priyahome", displayName: "Priya Home", phone: "4045550100" });
  attachDraftToHandle(draft.id, account.handle, "Priya");
  confirmCxEmail(draft.id);
  confirmCxPhone(draft.id);
  patchCxProject(draft.id, {
    description: "Replace cabinets and countertops, keeping the existing layout.",
    city: "Jacksonville",
    postalCode: "32204",
    timing: "Within 30 days",
    budgetBand: "$20,000 to $30,000",
  });
  publishCxProject(draft.id);
  return { id: draft.id, owner: account.handle };
}

function connected() {
  saveCxProfile({ ...ensureCxProfile("ridgeworks"), serviceArea: "Jacksonville" });
  const { id, owner } = liveProject();
  contractorInterested(id, "ridgeworks");
  const interest = homeownerInterested(id, "ridgeworks", owner);
  return { id, owner, connectionId: interest.connectionId };
}

describe("Handshake room rules", () => {
  it("gives each contractor one question per opportunity", () => {
    saveCxProfile({ ...ensureCxProfile("ridgeworks"), serviceArea: "Jacksonville" });
    const { id } = liveProject();
    contractorInterested(id, "ridgeworks");
    expect(hasAskedQuestion(id, "ridgeworks")).toBe(false);
    askProjectQuestion(id, "ridgeworks", "What is the nature of the job?");
    expect(hasAskedQuestion(id, "ridgeworks")).toBe(true);
    expect(() => askProjectQuestion(id, "ridgeworks", "And one more?")).toThrow(/one question/);
  });

  it("keeps contact details private until the homeowner shares them", () => {
    const { id, owner, connectionId } = connected();
    const project = getCxProject(id)!;
    expect(revealedContacts(project, getConnection(connectionId))).toBeNull();
    expect(() => shareContactDetails(connectionId, "ridgeworks")).toThrow(/homeowner/);
    shareContactDetails(connectionId, owner);
    expect(revealedContacts(project, getConnection(connectionId))?.email).toBe("home@example.com");
  });

  it("caps a room at 20 files and 60 MB", () => {
    const { connectionId, owner } = connected();
    for (let i = 0; i < CX_ROOM_MAX_FILES; i += 1) addRoomFile(connectionId, owner, { name: `f${i}.pdf`, size: 1000, data: "" });
    expect(() => addRoomFile(connectionId, owner, { name: "extra.pdf", size: 1000, data: "" })).toThrow(/20 files/);
    expect(getRoom(connectionId).files).toHaveLength(CX_ROOM_MAX_FILES);

    const second = connected();
    expect(() => addRoomFile(second.connectionId, second.owner, { name: "big.zip", size: CX_ROOM_MAX_BYTES + 1, data: "" })).toThrow(/60 MB/);
  });

  it("lets only the person who closed a Handshake reopen it, and never after a block", () => {
    const { connectionId, owner } = connected();
    closeRoom(connectionId, owner);
    expect(getConnection(connectionId)?.status).toBe("closed");
    expect(canReopenRoom(connectionId, "ridgeworks")).toBe(false);
    expect(() => reopenRoom(connectionId, "ridgeworks")).toThrow(/closed/);
    reopenRoom(connectionId, owner);
    expect(getConnection(connectionId)?.status).toBe("connected");

    blockRoom(connectionId, "ridgeworks");
    expect(canReopenRoom(connectionId, "ridgeworks")).toBe(false);
    expect(() => reopenRoom(connectionId, "ridgeworks")).toThrow();
  });

  it("accepts one report per person and target", () => {
    const { id, owner } = connected();
    fileReport({ kind: "person", byHandle: owner, target: "ridgeworks", projectId: id, reason: "Fraud or scam" });
    expect(() => fileReport({ kind: "person", byHandle: owner, target: "ridgeworks", projectId: id, reason: "Fraud or scam" })).toThrow(/already reported/);
  });

  it("treats towns within 25 miles as the same area", () => {
    saveCxProfile({ ...ensureCxProfile("ridgeworks"), serviceArea: "Orange Park" });
    const { id } = liveProject();
    expect(contractorEligibleFor(getCxProject(id)!, "ridgeworks")).toBe(true);
    patchCxProject(id, { city: "Savannah", postalCode: "31401" });
    expect(contractorEligibleFor(getCxProject(id)!, "ridgeworks")).toBe(false);
  });

  it("shows alignment as a percentage", () => {
    expect(matchPercent(1)).toBe(37);
    expect(matchPercent(2)).toBe(49);
    expect(matchPercent(6)).toBe(97);
    expect(matchPercent(9)).toBe(98);
  });
});
