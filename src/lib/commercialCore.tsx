import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCitySession } from "./citySession";
import {
  addCmDocument,
  ensureCmProfile,
  expireOwnCmListing,
  getActiveCmListing,
  getLatestCmListing,
  getCmDocuments,
  getCmListing,
  getCmProfile,
  hoursLeft,
  publishCmListing,
  rankCommercialMatches,
  resetCmProfile,
  saveCmProfile,
  subscribeCommercial,
  cmVaelKind,
  type RankedCommercialMatch,
  type CommercialListing,
  type CommercialProfile,
} from "./commercialStore";
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
  listing?: CommercialListing;
  latestListing?: CommercialListing;
  matches: RankedCommercialMatch[];
  saveListing: (input: Omit<CommercialListing, "id" | "createdAt" | "expiresAt" | "plan">) => CommercialListing;
  clearListing: () => void;
  resetDistrict: () => void;
  profile: (name: string) => CommercialProfile | undefined;
  ensureMine: () => CommercialProfile | undefined;
  writeProfile: (next: CommercialProfile) => void;
  documents: (name: string) => ReturnType<typeof getCmDocuments>;
  uploadDocument: typeof addCmDocument;
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
  listingById: typeof getCmListing;
  thread: typeof getMessages;
  send: typeof sendMessage;
  readThread: typeof markThreadRead;
  hoursLeft: typeof hoursLeft;
  vaelKind: ReturnType<typeof cmVaelKind>;
};

const CommercialContext = createContext<Ctx | null>(null);

export function CommercialCoreProvider({ children }: { children: ReactNode }) {
  const { session, setVael } = useCitySession();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubA = subscribeCommercial(() => setTick((n) => n + 1));
    const unsubB = subscribeVael(() => setTick((n) => n + 1));
    return () => {
      unsubA();
      unsubB();
    };
  }, []);

  useEffect(() => {
    if (session.signedIn && session.handle) ensureCmProfile(session.handle);
  }, [session.signedIn, session.handle]);

  const handle = session.signedIn ? session.handle : "";
  const listing = handle ? getActiveCmListing(handle) : undefined;
  const latestListing = handle ? getLatestCmListing(handle) : undefined;

  const value = useMemo<Ctx>(
    () => ({
      handle,
      signedIn: Boolean(handle),
      listing,
      latestListing,
      matches: listing ? rankCommercialMatches(listing) : [],
      saveListing: (input) => {
        const published = publishCmListing(input);
        setVael(published.side);
        return published;
      },
      clearListing: () => {
        if (handle) expireOwnCmListing(handle);
      },
      resetDistrict: () => {
        if (handle) resetCmProfile(handle);
      },
      profile: getCmProfile,
      ensureMine: () => (handle ? ensureCmProfile(handle) : undefined),
      writeProfile: saveCmProfile,
      documents: getCmDocuments,
      uploadDocument: addCmDocument,
      handshake: (opts) => requestHandshake({ ...opts, district: "commercial" }),
      accept: acceptHandshake,
      decline: declineHandshake,
      close: closeConnection,
      block: blockConnection,
      simulateAccept: simulateCounterpartAccept,
      connection: getConnection,
      myConnections: handle ? connectionsFor(handle, "commercial") : [],
      otherParty: counterpartOf,
      openWith: (a, b) => findOpenConnection(a, b, "commercial"),
      listingById: getCmListing,
      thread: getMessages,
      send: sendMessage,
      readThread: markThreadRead,
      hoursLeft,
      vaelKind: cmVaelKind(listing),
    }),
    [handle, listing, latestListing, session.vael],
  );

  return createElement(CommercialContext.Provider, { value }, children);
}

export function useCommercial() {
  const ctx = useContext(CommercialContext);
  if (!ctx) throw new Error("useCommercial must be used inside CommercialCoreProvider");
  return ctx;
}
