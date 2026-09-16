/**
 * Explicit "I'm participating in this district" record, separate from Vael listings.
 * Someone can join a district from Manage → Add District before ever setting
 * availability there — a listing alone (the old signal) can't capture that yet.
 */

const KEY = "vael_my_districts_v1";

type Store = Record<string, string[]>;

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

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
  emit();
}

export function getManuallyJoinedDistrictIds(handle: string): string[] {
  if (!handle) return [];
  return read()[handle] ?? [];
}

export function addManualDistricts(handle: string, ids: string[]) {
  if (!handle || ids.length === 0) return;
  const store = read();
  const current = new Set(store[handle] ?? []);
  ids.forEach((id) => current.add(id));
  write({ ...store, [handle]: [...current] });
}

export function removeManualDistrict(handle: string, districtId: string) {
  if (!handle) return;
  const store = read();
  const current = (store[handle] ?? []).filter((item) => item !== districtId);
  write({ ...store, [handle]: current });
}

/** Removes one handle's joined-districts record entirely. Used by the demo reset. */
export function clearManuallyJoinedDistricts(handle: string) {
  const store = read();
  if (!(handle in store)) return;
  const { [handle]: _removed, ...rest } = store;
  write(rest);
}
