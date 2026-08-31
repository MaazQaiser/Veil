import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCitySession } from "./citySession";
import {
  acceptHandshake,
  addDocument,
  blockConnection,
  closeConnection,
  connectionsFor,
  counterpartOf,
  declineHandshake,
  ensureProfile,
  expireOwnListing,
  findOpenConnection,
  getActiveListing,
  getLatestListing,
  getConnection,
  getDocuments,
  getListing,
  getMessages,
  getNotices,
  getProfile,
  hoursLeft,
  markNoticesRead,
  markThreadRead,
  publishListing,
  rankMatches,
  requestHandshake,
  saveProfile,
  sendMessage,
  simulateCounterpartAccept,
  subscribeVael,
  unreadMessageCount,
  unreadNoticeCount,
  veilKindFor,
  type ConnectionRecord,
  type ProfileRecord,
  type RankedMatch,
  type VaelListing,
} from "./vaelStore";
import { DEMO_HANDLE, prepareDemoWorkspace } from "./demoJourney";

type Ctx = {
  handle: string;
  signedIn: boolean;
  listing?: VaelListing;
  latestListing?: VaelListing;
  matches: RankedMatch[];
  saveListing: (input: Omit<VaelListing, "id" | "createdAt" | "expiresAt" | "plan">) => VaelListing;
  clearListing: () => void;
  profile: (name: string) => ProfileRecord | undefined;
  ensureMine: () => ProfileRecord | undefined;
  writeProfile: (next: ProfileRecord) => void;
  documents: (name: string) => ReturnType<typeof getDocuments>;
  uploadDocument: typeof addDocument;
  handshake: typeof requestHandshake;
  accept: typeof acceptHandshake;
  decline: typeof declineHandshake;
  close: typeof closeConnection;
  block: typeof blockConnection;
  simulateAccept: typeof simulateCounterpartAccept;
  connection: typeof getConnection;
  myConnections: ConnectionRecord[];
  otherParty: typeof counterpartOf;
  openWith: (a: string, b: string) => ReturnType<typeof findOpenConnection>;
  listingById: typeof getListing;
  thread: typeof getMessages;
  send: typeof sendMessage;
  readThread: typeof markThreadRead;
  notices: ReturnType<typeof getNotices>;
  readNotices: () => void;
  unreadMessages: number;
  unreadNotices: number;
  hoursLeft: typeof hoursLeft;
  veilKind: ReturnType<typeof veilKindFor>;
};

const VaelContext = createContext<Ctx | null>(null);

export function VaelCoreProvider({ children }: { children: ReactNode }) {
  const { session, setVeil } = useCitySession();
  const [, setTick] = useState(0);

  useEffect(() => subscribeVael(() => setTick((n) => n + 1)), []);

  useEffect(() => {
    if (session.signedIn && session.handle === DEMO_HANDLE) prepareDemoWorkspace();
  }, [session.signedIn, session.handle]);

  useEffect(() => {
    if (session.signedIn && session.handle) ensureProfile(session.handle);
  }, [session.signedIn, session.handle]);

  const handle = session.signedIn ? session.handle : "";
  const listing = handle ? getActiveListing(handle) : undefined;
  const latestListing = handle ? getLatestListing(handle) : undefined;

  useEffect(() => {
    if (!handle) return;
    const kind = veilKindFor(listing);
    const next = kind === "in" || kind === "out" ? kind : "none";
    if (session.veil !== next) setVeil(next);
  }, [handle, listing?.id, listing?.side, listing?.expiresAt, session.veil, setVeil]);

  const value = useMemo<Ctx>(
    () => ({
      handle,
      signedIn: Boolean(handle),
      listing,
      latestListing,
      matches: listing ? rankMatches(listing) : [],
      saveListing: (input) => {
        const published = publishListing(input);
        setVeil(published.side);
        return published;
      },
      clearListing: () => {
        if (handle) expireOwnListing(handle);
        setVeil("none");
      },
      profile: getProfile,
      ensureMine: () => (handle ? ensureProfile(handle) : undefined),
      writeProfile: saveProfile,
      documents: getDocuments,
      uploadDocument: addDocument,
      handshake: (opts) => requestHandshake({ ...opts, district: "media-technology" }),
      accept: acceptHandshake,
      decline: declineHandshake,
      close: closeConnection,
      block: blockConnection,
      simulateAccept: simulateCounterpartAccept,
      connection: getConnection,
      myConnections: handle ? connectionsFor(handle, "media-technology") : [],
      otherParty: counterpartOf,
      openWith: (a, b) => findOpenConnection(a, b, "media-technology"),
      listingById: getListing,
      thread: getMessages,
      send: sendMessage,
      readThread: markThreadRead,
      notices: handle ? getNotices(handle) : [],
      readNotices: () => {
        if (handle) markNoticesRead(handle);
      },
      unreadMessages: handle ? unreadMessageCount(handle) : 0,
      unreadNotices: handle ? unreadNoticeCount(handle) : 0,
      hoursLeft,
      veilKind: veilKindFor(listing),
    }),
    [handle, listing, latestListing, session.veil],
  );

  return createElement(VaelContext.Provider, { value }, children);
}

export function useVael() {
  const ctx = useContext(VaelContext);
  if (!ctx) throw new Error("useVael must be used inside VaelCoreProvider");
  return ctx;
}
