import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_HANDLE, prepareDemoWorkspace, seedDemoConversation } from "./demoJourney";
import { toggleSavedListing, isListingSaved } from "./savedMatches";
import {
  acceptHandshake,
  declineHandshake,
  getConnections,
  getMessages,
  requestHandshake,
  sendMessage,
  simulateCounterpartAccept,
} from "./vaelStore";

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

describe("handshake to messages", () => {
  it("keeps a sent Handshake pending and does not open a thread", () => {
    prepareDemoWorkspace();
    const connection = requestHandshake({
      fromHandle: DEMO_HANDLE,
      toHandle: "jlee",
      source: "board_match",
      listingId: "vael_jlee",
    });
    expect(connection.status).toBe("pending");
    expect(connection.requesterAccepted).toBe(true);
    expect(connection.counterpartAccepted).toBe(false);
    expect(getMessages(connection.id)).toEqual([]);
    seedDemoConversation(connection.id);
    expect(getMessages(connection.id)).toEqual([]);
    expect(() => sendMessage(connection.id, DEMO_HANDLE, "Hello")).toThrow(
      /Messages open after a connected Handshake/,
    );
  });

  it("withdraws a pending Handshake", () => {
    prepareDemoWorkspace();
    const connection = requestHandshake({
      fromHandle: DEMO_HANDLE,
      toHandle: "jlee",
      source: "board_match",
      listingId: "vael_jlee",
    });
    declineHandshake(connection.id);
    expect(getConnections().find((item) => item.id === connection.id)?.status).toBe("declined");
  });

  it("opens chat only after the counterpart accepts", () => {
    prepareDemoWorkspace();
    const connection = requestHandshake({
      fromHandle: DEMO_HANDLE,
      toHandle: "jlee",
      source: "board_match",
      listingId: "vael_jlee",
    });
    simulateCounterpartAccept(connection.id, DEMO_HANDLE);
    const updated = getConnections().find((item) => item.id === connection.id);
    expect(updated?.status).toBe("connected");
    seedDemoConversation(connection.id);
    expect(getMessages(connection.id).length).toBeGreaterThan(0);
    const sent = sendMessage(connection.id, DEMO_HANDLE, "Brief attached", "brief.pdf");
    expect(sent.body).toBe("Brief attached");
    expect(sent.attachmentName).toBe("brief.pdf");
  });

  it("lists only connected threads for the inbox", () => {
    prepareDemoWorkspace();
    const pending = requestHandshake({
      fromHandle: DEMO_HANDLE,
      toHandle: "jlee",
      source: "board_match",
      listingId: "vael_jlee",
    });
    const incoming = requestHandshake({
      fromHandle: "pshah",
      toHandle: DEMO_HANDLE,
      source: "board_match",
      listingId: "vael_pshah",
    });
    acceptHandshake(incoming.id, DEMO_HANDLE);
    const inbox = getConnections().filter((item) => item.status === "connected" && !item.blocked);
    expect(inbox.map((item) => item.id)).toEqual([incoming.id]);
    expect(inbox.some((item) => item.id === pending.id)).toBe(false);
  });

  it("toggles a saved listing for a handle", () => {
    expect(isListingSaved(DEMO_HANDLE, "vael_jlee")).toBe(false);
    expect(toggleSavedListing(DEMO_HANDLE, "vael_jlee")).toBe(true);
    expect(isListingSaved(DEMO_HANDLE, "vael_jlee")).toBe(true);
    expect(toggleSavedListing(DEMO_HANDLE, "vael_jlee")).toBe(false);
    expect(isListingSaved(DEMO_HANDLE, "vael_jlee")).toBe(false);
  });
});
