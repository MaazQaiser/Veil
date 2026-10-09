import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_HANDLE } from "./demoJourney";

const STORAGE_KEY = "vael_city_shell_session_v1";
/** One-time wipe of saved dashboard data on this device (both Vael In and Vael Out). */
const DATA_CLEARED_KEY = "vael_dashboards_cleared_v1";
const KEEP_KEYS = new Set(["vael_theme_v1", "vael_theme_accent_v1", "vael_sidebar_collapsed_v1", DATA_CLEARED_KEY]);
const DATA_PREFIXES = ["vael_", "mtx_", "cx_", "rx_", "tx_", "cm_"];

function clearDashboardLocalDataOnce() {
  if (typeof localStorage === "undefined") return;
  try {
    if (localStorage.getItem(DATA_CLEARED_KEY) === "1") return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    for (const key of keys) {
      if (KEEP_KEYS.has(key)) continue;
      if (DATA_PREFIXES.some((prefix) => key.startsWith(prefix))) localStorage.removeItem(key);
    }
    if (typeof sessionStorage !== "undefined") {
      const sessionKeys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i += 1) {
        const key = sessionStorage.key(i);
        if (key) sessionKeys.push(key);
      }
      for (const key of sessionKeys) {
        if (key.startsWith("vael_")) sessionStorage.removeItem(key);
      }
    }
    localStorage.setItem(DATA_CLEARED_KEY, "1");
  } catch {
    // Private mode can block storage; sign-in still starts from an empty session.
  }
}

clearDashboardLocalDataOnce();

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
