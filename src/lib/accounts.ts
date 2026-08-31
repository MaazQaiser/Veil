/**
 * Accounts on this device.
 *
 * There is no account server. Signing up writes a row here and signing in looks
 * one up by email. Passwords are never stored — see SignIn/SignUp for the copy
 * that tells the visitor exactly that.
 */

const KEY = "vael_city_accounts_v1";

export type CityAccount = {
  handle: string;
  email: string;
  displayName: string;
  createdAt: string;
};

function read(): CityAccount[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CityAccount[]) : [];
  } catch {
    return [];
  }
}

function write(next: CityAccount[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getAccounts(): CityAccount[] {
  return read();
}

export function findAccountByEmail(email: string): CityAccount | undefined {
  const wanted = normalizeEmail(email);
  return read().find((account) => account.email === wanted);
}

export function findAccountByHandle(handle: string): CityAccount | undefined {
  return read().find((account) => account.handle === handle);
}

const RESERVED_HANDLES = new Set(["admin", "vael", "support", "member", "city", "join", "explore", "feed", "account"]);

export function sanitizeHandle(raw: string) {
  return raw.trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9]/g, "").slice(0, 20);
}

/** Format, length, and reserved-word check. Returns null when the handle is well-formed. */
export function handleIssue(handle: string): string | null {
  const value = handle.trim().toLowerCase().replace(/^@/, "");
  if (!value) return "Enter a handle.";
  if (!/^[a-z0-9]+$/.test(value)) return "Use letters and numbers only.";
  if (value.length < 3) return "Use at least 3 characters.";
  if (value.length > 20) return "Keep it to 20 characters.";
  if (RESERVED_HANDLES.has(value)) return "That handle is reserved.";
  return null;
}

export function isHandleAvailable(handle: string, exceptHandle?: string): boolean {
  const value = handle.trim().toLowerCase().replace(/^@/, "");
  if (exceptHandle && value === exceptHandle) return true;
  return !read().some((account) => account.handle === value);
}

/** Lowercase, letters and digits only, seeded from the name and falling back to the email. */
export function suggestHandle(displayName: string, email: string) {
  const fromName = displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const fromEmail = normalizeEmail(email).split("@")[0]?.replace(/[^a-z0-9]/g, "") ?? "";
  const base = (fromName || fromEmail || "member").slice(0, 20);

  const taken = new Set(read().map((account) => account.handle));
  if (!taken.has(base) && !RESERVED_HANDLES.has(base) && base.length >= 3) return base;
  let n = 2;
  while (taken.has(`${base}${n}`) || RESERVED_HANDLES.has(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

export function createAccount(input: { email: string; handle: string; displayName?: string }): CityAccount {
  const email = normalizeEmail(input.email);
  const existing = findAccountByEmail(email);
  if (existing) return existing;

  const handle = sanitizeHandle(input.handle) || suggestHandle(input.displayName ?? "", email);
  const displayName = input.displayName?.trim() || handle;
  const account: CityAccount = {
    handle,
    email,
    displayName,
    createdAt: new Date().toISOString(),
  };
  write([...read(), account]);
  return account;
}

export function renameAccountHandle(from: string, to: string): CityAccount {
  const nextHandle = sanitizeHandle(to);
  const all = read();
  const account = all.find((item) => item.handle === from);
  if (!account) {
    throw new Error(`No account uses @${from} on this device.`);
  }
  const next: CityAccount = { ...account, handle: nextHandle };
  write(all.map((item) => (item.handle === from ? next : item)));
  return next;
}

/** Keeps the walkthrough persona signable-in alongside any account you create. */
export function registerAccount(account: CityAccount) {
  const all = read();
  const index = all.findIndex((item) => item.handle === account.handle);
  if (index >= 0) {
    write(all.map((item, i) => (i === index ? account : item)));
    return;
  }
  write([...all, account]);
}
