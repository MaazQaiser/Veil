const KEY = "vael_saved_matches_v1";

type Store = Record<string, string[]>;

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

function write(next: Store) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getSavedListingIds(handle: string): string[] {
  if (!handle) return [];
  return read()[handle] ?? [];
}

export function isListingSaved(handle: string, listingId: string): boolean {
  return getSavedListingIds(handle).includes(listingId);
}

export function toggleSavedListing(handle: string, listingId: string): boolean {
  const current = getSavedListingIds(handle);
  const saved = current.includes(listingId);
  const nextIds = saved ? current.filter((id) => id !== listingId) : [...current, listingId];
  write({ ...read(), [handle]: nextIds });
  return !saved;
}

/** Removes one handle's saved-matches record entirely. Used by the demo reset. */
export function clearSavedMatches(handle: string) {
  const store = read();
  if (!(handle in store)) return;
  const { [handle]: _removed, ...rest } = store;
  write(rest);
}
