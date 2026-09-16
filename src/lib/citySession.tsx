import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_HANDLE } from "./demoJourney";

const STORAGE_KEY = "vael_city_shell_session_v1";

export type VaelSession = "none" | "in" | "out";

export type CitySession = {
  signedIn: boolean;
  handle: string;
  vael: VaelSession;
  unreadNotifications: number;
  unreadMessages: number;
};

const defaults: CitySession = {
  signedIn: false,
  handle: "",
  vael: "none",
  unreadNotifications: 0,
  unreadMessages: 0,
};

function canonicalizeHandle(handle: string) {
  return handle === "member" ? DEMO_HANDLE : handle;
}

function readSession(): CitySession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = { ...defaults, ...JSON.parse(raw) } as CitySession;
    const handle = canonicalizeHandle(parsed.handle);
    const next = handle === parsed.handle ? parsed : { ...parsed, handle };
    if (next.handle !== parsed.handle) writeSession(next);
    return next;
  } catch {
    return defaults;
  }
}

function writeSession(next: CitySession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

type Ctx = {
  session: CitySession;
  signIn: (handle?: string) => void;
  signOut: () => void;
  setVael: (vael: VaelSession) => void;
};

const SessionContext = createContext<Ctx | null>(null);

export function CitySessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CitySession>(() =>
    typeof window === "undefined" ? defaults : readSession(),
  );

  useEffect(() => {
    if (!session.signedIn) return;
    const handle = canonicalizeHandle(session.handle);
    if (handle === session.handle) return;
    const next = { ...session, handle };
    setSession(next);
    writeSession(next);
  }, [session]);

  const value = useMemo<Ctx>(
    () => ({
      session,
      signIn: (handle = DEMO_HANDLE) => {
        const next = { ...session, signedIn: true, handle: canonicalizeHandle(handle) };
        setSession(next);
        writeSession(next);
      },
      signOut: () => {
        const next = { ...defaults };
        setSession(next);
        writeSession(next);
      },
      setVael: (vael) => {
        const next = { ...session, vael };
        setSession(next);
        writeSession(next);
      },
    }),
    [session],
  );

  return createElement(SessionContext.Provider, { value }, children);
}

export function useCitySession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useCitySession must be used inside CitySessionProvider");
  return ctx;
}
