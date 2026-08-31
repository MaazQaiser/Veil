import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCitySession } from "./citySession";
import {
  addTxDocument,
  ensureTxProfile,
  expireOwnTxListing,
  getActiveTxListing,
  getLatestTxListing,
  getTxDocuments,
  getTxListing,
  getTxProfile,
  hoursLeft,
  publishTxListing,
  rankTruckingMatches,
  saveTxProfile,
  subscribeTrucking,
  txVeilKind,
  type RankedTruckingMatch,
  type TruckingListing,
  type TruckingProfile,
} from "./truckingStore";
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
  listing?: TruckingListing;
  latestListing?: TruckingListing;
  matches: RankedTruckingMatch[];
  saveListing: (input: Omit<TruckingListing, "id" | "createdAt" | "expiresAt" | "plan">) => TruckingListing;
  clearListing: () => void;
  profile: (name: string) => TruckingProfile | undefined;
  ensureMine: () => TruckingProfile | undefined;
  writeProfile: (next: TruckingProfile) => void;
  documents: (name: string) => ReturnType<typeof getTxDocuments>;
  uploadDocument: typeof addTxDocument;
  handshake: (opts: {
    fromHandle: string;
    toHandle: string;
    source: ConnectionRecord["source"];
    listingId?: string;
  }) => ConnectionRecord;
  accept: typeof acceptHandshake;
  decline: typeof declineHandshake;
  close: typeof closeConnection;
  block: typeof blockConnection;
  simulateAccept: typeof simulateCounterpartAccept;
  connection: typeof getConnection;
  myConnections: ConnectionRecord[];
  otherParty: typeof counterpartOf;
  openWith: (a: string, b: string) => ReturnType<typeof findOpenConnection>;
  listingById: typeof getTxListing;
  thread: typeof getMessages;
  send: typeof sendMessage;
  readThread: typeof markThreadRead;
  hoursLeft: typeof hoursLeft;
  veilKind: ReturnType<typeof txVeilKind>;
};

const TruckingContext = createContext<Ctx | null>(null);

export function TruckingCoreProvider({ children }: { children: ReactNode }) {
  const { session, setVeil } = useCitySession();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubA = subscribeTrucking(() => setTick((n) => n + 1));
    const unsubB = subscribeVael(() => setTick((n) => n + 1));
    return () => {
      unsubA();
      unsubB();
    };
  }, []);

  useEffect(() => {
    if (session.signedIn && session.handle) ensureTxProfile(session.handle);
  }, [session.signedIn, session.handle]);

  const handle = session.signedIn ? session.handle : "";
  const listing = handle ? getActiveTxListing(handle) : undefined;
  const latestListing = handle ? getLatestTxListing(handle) : undefined;

  const value = useMemo<Ctx>(
    () => ({
      handle,
      signedIn: Boolean(handle),
      listing,
      latestListing,
      matches: listing ? rankTruckingMatches(listing) : [],
      saveListing: (input) => {
        const published = publishTxListing(input);
        setVeil(published.side);
        return published;
      },
      clearListing: () => {
        if (handle) expireOwnTxListing(handle);
      },
      profile: getTxProfile,
      ensureMine: () => (handle ? ensureTxProfile(handle) : undefined),
      writeProfile: saveTxProfile,
      documents: getTxDocuments,
      uploadDocument: addTxDocument,
      handshake: (opts) => requestHandshake({ ...opts, district: "trucking" }),
      accept: acceptHandshake,
      decline: declineHandshake,
      close: closeConnection,
      block: blockConnection,
      simulateAccept: simulateCounterpartAccept,
      connection: getConnection,
      myConnections: handle ? connectionsFor(handle, "trucking") : [],
      otherParty: counterpartOf,
      openWith: (a, b) => findOpenConnection(a, b, "trucking"),
      listingById: getTxListing,
      thread: getMessages,
      send: sendMessage,
      readThread: markThreadRead,
      hoursLeft,
      veilKind: txVeilKind(listing),
    }),
    [handle, listing, latestListing, session.veil],
  );

  return createElement(TruckingContext.Provider, { value }, children);
}

export function useTrucking() {
  const ctx = useContext(TruckingContext);
  if (!ctx) throw new Error("useTrucking must be used inside TruckingCoreProvider");
  return ctx;
}
