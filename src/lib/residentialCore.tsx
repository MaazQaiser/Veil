import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCitySession } from "./citySession";
import {
  addRxDocument,
  ensureRxProfile,
  expireOwnRxListing,
  getActiveRxListing,
  getLatestRxListing,
  getRxDocuments,
  getRxListing,
  getRxProfile,
  hoursLeft,
  publishRxListing,
  rankResidentialMatches,
  resetRxProfile,
  saveRxProfile,
  subscribeResidential,
  rxVaelKind,
  type RankedResidentialMatch,
  type ResidentialListing,
  type ResidentialProfile,
} from "./residentialStore";
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
  listing?: ResidentialListing;
  latestListing?: ResidentialListing;
  matches: RankedResidentialMatch[];
  saveListing: (input: Omit<ResidentialListing, "id" | "createdAt" | "expiresAt" | "plan">) => ResidentialListing;
  clearListing: () => void;
  resetDistrict: () => void;
  profile: (name: string) => ResidentialProfile | undefined;
  ensureMine: () => ResidentialProfile | undefined;
  writeProfile: (next: ResidentialProfile) => void;
  documents: (name: string) => ReturnType<typeof getRxDocuments>;
  uploadDocument: typeof addRxDocument;
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
  listingById: typeof getRxListing;
  thread: typeof getMessages;
  send: typeof sendMessage;
  readThread: typeof markThreadRead;
  hoursLeft: typeof hoursLeft;
  vaelKind: ReturnType<typeof rxVaelKind>;
};

const ResidentialContext = createContext<Ctx | null>(null);

export function ResidentialCoreProvider({ children }: { children: ReactNode }) {
  const { session, setVael } = useCitySession();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubA = subscribeResidential(() => setTick((n) => n + 1));
    const unsubB = subscribeVael(() => setTick((n) => n + 1));
    return () => {
      unsubA();
      unsubB();
    };
  }, []);

  useEffect(() => {
    if (session.signedIn && session.handle) ensureRxProfile(session.handle);
  }, [session.signedIn, session.handle]);

  const handle = session.signedIn ? session.handle : "";
  const listing = handle ? getActiveRxListing(handle) : undefined;
  const latestListing = handle ? getLatestRxListing(handle) : undefined;

  const value = useMemo<Ctx>(
    () => ({
      handle,
      signedIn: Boolean(handle),
      listing,
      latestListing,
      matches: listing ? rankResidentialMatches(listing) : [],
      saveListing: (input) => {
        const published = publishRxListing(input);
        setVael(published.side);
        return published;
      },
      clearListing: () => {
        if (handle) expireOwnRxListing(handle);
      },
      resetDistrict: () => {
        if (handle) resetRxProfile(handle);
      },
      profile: getRxProfile,
      ensureMine: () => (handle ? ensureRxProfile(handle) : undefined),
      writeProfile: saveRxProfile,
      documents: getRxDocuments,
      uploadDocument: addRxDocument,
      handshake: (opts) => requestHandshake({ ...opts, district: "residential" }),
      accept: acceptHandshake,
      decline: declineHandshake,
      close: closeConnection,
      block: blockConnection,
      simulateAccept: simulateCounterpartAccept,
      connection: getConnection,
      myConnections: handle ? connectionsFor(handle, "residential") : [],
      otherParty: counterpartOf,
      openWith: (a, b) => findOpenConnection(a, b, "residential"),
      listingById: getRxListing,
      thread: getMessages,
      send: sendMessage,
      readThread: markThreadRead,
      hoursLeft,
      vaelKind: rxVaelKind(listing),
    }),
    [handle, listing, latestListing, session.vael],
  );

  return createElement(ResidentialContext.Provider, { value }, children);
}

export function useResidential() {
  const ctx = useContext(ResidentialContext);
  if (!ctx) throw new Error("useResidential must be used inside ResidentialCoreProvider");
  return ctx;
}
