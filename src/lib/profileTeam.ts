/**
 * Team members a profile lists. Local to this device, like the rest of the prototype data.
 */

const KEY = "vael_profile_team_v1";

export type TeamMember = { id: string; name: string; role: string };

type Store = Record<string, TeamMember[]>;
type Listener = () => void;

const listeners = new Set<Listener>();

function read(): Store {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function write(next: Store) {
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((fn) => fn());
}

export function subscribeTeam(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getTeam(handle: string): TeamMember[] {
  return read()[handle] ?? [];
}

export function addTeamMember(handle: string, member: { name: string; role: string }) {
  const name = member.name.trim();
  if (!handle || !name) return;
  const store = read();
  const id = `tm_${Math.random().toString(36).slice(2, 10)}`;
  write({ ...store, [handle]: [...(store[handle] ?? []), { id, name, role: member.role.trim() }] });
}

export function removeTeamMember(handle: string, id: string) {
  const store = read();
  write({ ...store, [handle]: (store[handle] ?? []).filter((item) => item.id !== id) });
}
