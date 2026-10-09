/**
 * Explicit "I'm participating in this district" record, separate from Vael listings.
 * A member can only be in one district at a time — joining another switches them.
 */

const KEY = "vael_my_districts_v1";

type Entry = { active: string | null; history: string[] };
type Store = Record<string, Entry | string[]>;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeMyDistricts(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function normalize(raw: unknown): Entry {
  if (Array.isArray(raw)) {
    const history = raw.filter((item): item is string => typeof item === "string");
    return { active: history[history.length - 1] ?? null, history };
  }
  if (raw && typeof raw === "object" && "history" in (raw as object)) {
    const entry = raw as Entry;
    return {
      active: entry.active ?? null,
      history: Array.isArray(entry.history) ? entry.history : [],
    };
  }
  return { active: null, history: [] };
}

function read(): Record<string, Entry> {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Store) : {};
    const next: Record<string, Entry> = {};
    for (const [handle, value] of Object.entries(parsed)) {
      next[handle] = normalize(value);
    }
    return next;
  } catch {
    return {};
  }
}

function write(store: Record<string, Entry>) {
  localStorage.setItem(KEY, JSON.stringify(store));
  emit();
}

export function getActiveDistrictId(handle: string): string | undefined {
  if (!handle) return undefined;
  return read()[handle]?.active ?? undefined;
}

export function getDistrictHistory(handle: string): string[] {
  if (!handle) return [];
  return read()[handle]?.history ?? [];
}

/** Active district only — a member can be in one district at a time. */
export function getManuallyJoinedDistrictIds(handle: string): string[] {
  const active = getActiveDistrictId(handle);
  return active ? [active] : [];
}

export function setActiveDistrict(handle: string, id: string) {
  if (!handle || !id) return;
  const store = read();
  const current = store[handle] ?? { active: null, history: [] };
  const history = new Set(current.history);
  if (current.active) history.add(current.active);
  history.add(id);
  write({ ...store, [handle]: { active: id, history: [...history] } });
}

export function addManualDistricts(handle: string, ids: string[]) {
  if (!handle || ids.length === 0) return;
  setActiveDistrict(handle, ids[ids.length - 1]!);
}

export function removeManualDistrict(handle: string, districtId: string) {
  if (!handle) return;
  const store = read();
  const current = store[handle];
  if (!current) return;
  const history = current.history.filter((item) => item !== districtId);
  const active = current.active === districtId ? (history[history.length - 1] ?? null) : current.active;
  write({ ...store, [handle]: { active, history } });
}

/** Removes one handle's joined-districts record entirely. Used by the demo reset. */
export function clearManuallyJoinedDistricts(handle: string) {
  const store = read();
  if (!(handle in store)) return;
  const { [handle]: _removed, ...rest } = store;
  write(rest);
}
