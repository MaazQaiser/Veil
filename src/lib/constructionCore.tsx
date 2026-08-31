import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCitySession } from "./citySession";
import {
  addCxDocument,
  cxVeilKind,
  ensureCxProfile,
  expireOwnCxListing,
  getActiveCxListing,
  getLatestCxListing,
  getCxDocuments,
  getCxListing,
  getCxProfile,
  hoursLeft,
  publishCxListing,
  rankConstructionMatches,
  saveCxProfile,
  subscribeConstruction,
  type ConstructionListing,
  type ConstructionProfile,
  type RankedConstructionMatch,
} from "./constructionStore";
import {
  acceptHandshake,
  blockConnection,
  closeConnection,
  connectionsFor,
  counterpartOf,
  declineHandshake,
  findOpenConnection,
  getConnection,
  getMessages,
  markThreadRead,
  requestHandshake,
  sendMessage,
  simulateCounterpartAccept,
  subscribeVael,
  type ConnectionRecord,
} from "./vaelStore";

type Ctx = {
  handle: string;
  signedIn: boolean;
  listing?: ConstructionListing;
  latestListing?: ConstructionListing;
  matches: RankedConstructionMatch[];
  saveListing: (input: Omit<ConstructionListing, "id" | "createdAt" | "expiresAt" | "plan">) => ConstructionListing;
  clearListing: () => void;
  profile: (name: string) => ConstructionProfile | undefined;
  ensureMine: () => ConstructionProfile | undefined;
  writeProfile: (next: ConstructionProfile) => void;
  documents: (name: string) => ReturnType<typeof getCxDocuments>;
  uploadDocument: typeof addCxDocument;
  handshake: (opts: { fromHandle: string; toHandle: string; source: ConnectionRecord["source"]; listingId?: string }) => ConnectionRecord;
  accept: typeof acceptHandshake;
  decline: typeof declineHandshake;
  close: typeof closeConnection;
  block: typeof blockConnection;
  simulateAccept: typeof simulateCounterpartAccept;
  connection: typeof getConnection;
  myConnections: ConnectionRecord[];
  otherParty: typeof counterpartOf;
  openWith: (a: string, b: string) => ReturnType<typeof findOpenConnection>;
  listingById: typeof getCxListing;
  thread: typeof getMessages;
  send: typeof sendMessage;
  readThread: typeof markThreadRead;
  hoursLeft: typeof hoursLeft;
  veilKind: ReturnType<typeof cxVeilKind>;
};

const ConstructionContext = createContext<Ctx | null>(null);

export function ConstructionCoreProvider({ children }: { children: ReactNode }) {
  const { session, setVeil } = useCitySession();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubA = subscribeConstruction(() => setTick((n) => n + 1));
    const unsubB = subscribeVael(() => setTick((n) => n + 1));
    return () => {
      unsubA();
      unsubB();
    };
  }, []);

  useEffect(() => {
    if (session.signedIn && session.handle) ensureCxProfile(session.handle);
  }, [session.signedIn, session.handle]);

  const handle = session.signedIn ? session.handle : "";
  const listing = handle ? getActiveCxListing(handle) : undefined;
  const latestListing = handle ? getLatestCxListing(handle) : undefined;

  const value = useMemo<Ctx>(
    () => ({
      handle,
      signedIn: Boolean(handle),
      listing,
      latestListing,
      matches: listing ? rankConstructionMatches(listing) : [],
      saveListing: (input) => {
        const published = publishCxListing(input);
        setVeil(published.side);
        return published;
      },
      clearListing: () => {
        if (handle) expireOwnCxListing(handle);
      },
      profile: getCxProfile,
      ensureMine: () => (handle ? ensureCxProfile(handle) : undefined),
      writeProfile: saveCxProfile,
      documents: getCxDocuments,
      uploadDocument: addCxDocument,
      handshake: (opts) => requestHandshake({ ...opts, district: "construction" }),
      accept: acceptHandshake,
      decline: declineHandshake,
      close: closeConnection,
      block: blockConnection,
      simulateAccept: simulateCounterpartAccept,
      connection: getConnection,
      myConnections: handle ? connectionsFor(handle, "construction") : [],
      otherParty: counterpartOf,
      openWith: (a, b) => findOpenConnection(a, b, "construction"),
      listingById: getCxListing,
      thread: getMessages,
      send: sendMessage,
      readThread: markThreadRead,
      hoursLeft,
      veilKind: cxVeilKind(listing),
    }),
    [handle, listing, latestListing, session.veil],
  );

  return createElement(ConstructionContext.Provider, { value }, children);
}

export function useConstruction() {
  const ctx = useContext(ConstructionContext);
  if (!ctx) throw new Error("useConstruction must be used inside ConstructionCoreProvider");
  return ctx;
}
