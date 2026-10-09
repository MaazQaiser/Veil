/**
 * Contractor Exchange experience placement.
 * Homeowners are placed in Residential internally; the UI never names that mode.
 */

const KEY = "vael_cx_experience_v1";

export type ContractorExperience = "residential" | "business";

type Store = Record<string, ContractorExperience>;

function read(): Store {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(next: Store) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getContractorExperience(handle: string): ContractorExperience | undefined {
  if (!handle) return undefined;
  return read()[handle];
}

export function setContractorExperience(handle: string, experience: ContractorExperience) {
  if (!handle) return;
  write({ ...read(), [handle]: experience });
}

export function clearContractorExperience(handle: string) {
  if (!handle) return;
  const { [handle]: _removed, ...rest } = read();
  write(rest);
}

export const RX_PROJECT_CATEGORIES = [
  "Kitchen",
  "Bathroom",
  "Flooring",
  "Roofing",
  "Doors & Windows",
  "Painting",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Addition",
  "New Construction",
  "Other",
] as const;

export type RxProjectCategory = (typeof RX_PROJECT_CATEGORIES)[number];
