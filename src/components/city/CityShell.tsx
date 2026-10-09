import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { IconButton, buttonClassName } from "@/components/ui/button";
import { Drawer } from "@/components/ui/overlays";
import { Container } from "@/components/ui/layout";
import { Avatar } from "@/components/ui/avatar";
import { DistrictStatus } from "@/components/vael/status";
import {
  IconBell,
  IconClose,
  IconGrid,
  IconHome,
  IconMenu,
  IconMessage,
  IconSearch,
  IconUsers,
} from "@/components/ui/icons";
import { CITY_CONTEXT, districtFromPath, primaryDistricts } from "@/lib/districts";
import { useCitySession } from "@/lib/citySession";
import { useVael } from "@/lib/vaelCore";
import { onboardingComplete, onboardingRoute, signedInLanding } from "@/lib/onboarding";
import { PRODUCT_HOME, profileCompletion } from "@/lib/providerJourney";
import { relativeTime } from "@/lib/time";
import { isHomeownerPath } from "@/lib/cxRoutes";

type VaelApi = ReturnType<typeof useVael>;

/** Header avatar falls back to a real photo, never bare initials, until a member uploads their own. */
const DEFAULT_AVATAR_URL = "/people/p04.jpg";

/** Site-header pill links — shown on the public marketing site only, not inside the product. */
const cityEntryNav = [
  { id: "explore", label: "Explore Districts", to: "/districts" },
  { id: "projects", label: "Projects", to: "/projects" },
  { id: "community", label: "Community", to: "/feed" },
] as const;

export const JOIN_ROUTE = "/join";
export const GO_VISIBLE_ROUTE = "/go-visible";

function enterProductHref(signedIn: boolean, handle: string) {
  if (!signedIn) return JOIN_ROUTE;
  if (!onboardingComplete(handle)) return onboardingRoute(handle);
  return signedInLanding(handle);
}

/** Public website surfaces keep marketing chrome even when a member is signed in. */
export function isSitePath(pathname: string) {
  if (pathname === "/" || pathname === "/explore") return true;
  if (pathname === "/districts" || pathname === "/projects") return true;
  if (pathname === "/feed" || pathname.startsWith("/feed/")) return true;
  if (pathname === "/sign-in" || pathname === "/sign-up" || pathname === "/go-visible") return true;
  if (pathname === "/join" || pathname.startsWith("/join/")) return true;
  return isHomeownerPath(pathname);
}

/** Dark marketing bar — homepage, and the public pages that share its header. */
function isWebsiteNavPath(pathname: string) {
  if (pathname === "/" || pathname === "/districts" || pathname === "/projects") return true;
  return pathname === "/feed" || pathname.startsWith("/feed/");
}

function siteNavActive(pathname: string, hash: string, to: string) {
  if (to === "/#how-it-works") return pathname === "/" && hash === "#how-it-works";
  if (to === "/feed") return pathname === "/feed" || pathname.startsWith("/feed/");
  return pathname === to;
}

const mobilePrimary = [
  { id: "home", label: "Home", to: PRODUCT_HOME, icon: IconHome, end: true },
  { id: "matches", label: "Matches", to: `${PRODUCT_HOME}/matches`, icon: IconGrid, end: false },
  { id: "community", label: "Community", to: `${PRODUCT_HOME}/community`, icon: IconUsers, end: false },
  { id: "messages", label: "Messages", to: "/messages", icon: IconMessage, end: false },
] as const;

const moreLinks = [
  { label: "Feed", to: "/feed" },
  { label: "Saved", to: "/feed/saved" },
  { label: "Districts", to: "/districts" },
  { label: "Notifications", to: "/notifications" },
  { label: "Today", to: "/today" },
  { label: "Concierge", to: "/concierge" },
] as const;

/** Shared size/shape for the header's Messages and Notifications popups — same box, either way. */
const DROPDOWN_PANEL_SHELL =
  "absolute right-0 z-40 mt-2 flex max-h-[32rem] min-h-[26rem] w-[min(20rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-[0_4px_8px_rgba(11,12,12,0.08),0_32px_64px_-16px_rgba(17,17,17,0.32)] dark:border-white/10 dark:backdrop-blur-2xl dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)]";

/** Bell line-art, matching the site's icon stroke weight, with a VAEL-yellow accent. */
function BellIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={cn("h-16 w-16 text-quiet", className)} aria-hidden>
      <path
        d="M48 20c-12 0-20 9-20 22v10l-8 12h56l-8-12V42c0-13-8-22-20-22z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M40 72a8 8 0 0 0 16 0" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <circle cx="68" cy="26" r="6" className="fill-[#FFC555] dark:fill-accent" />
    </svg>
  );
}


/** A glimpse of recent notices from the header — full history lives at /notifications. */
function NotificationsMenu({ notices, unread }: { notices: VaelApi["notices"]; unread: number }) {
  const location = useLocation();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const rows = useMemo(() => {
    const seen = new Set<string>();
    const recent: typeof notices = [];
    for (const item of [...notices].reverse()) {
      const key = `${item.title}·${item.body}`;
      if (seen.has(key)) continue;
      seen.add(key);
      recent.push(item);
      if (recent.length === 4) break;
    }
    return recent;
  }, [notices]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Notifications"
        title="Notifications"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#FFC555]/15 hover:text-[#C99A28] dark:border dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_-6px_rgba(0,0,0,0.4)] dark:backdrop-blur-lg dark:hover:bg-white/10"
        onClick={() => setOpen((value) => !value)}
      >
        <IconBell className="h-5 w-5" />
        {unread > 0 ? (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1">
            {unread}
            <span className="sr-only"> unread</span>
          </Badge>
        ) : null}
      </button>
      {open ? (
        <div
          id={menuId}
          role="dialog"
          aria-label="Notifications"
          className={DROPDOWN_PANEL_SHELL}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-4">
            <p className="text-body font-medium text-foreground">Notifications ({unread})</p>
          </div>
          {rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center">
              <BellIllustration className="h-20 w-20" />
              <p className="mt-2 text-body font-medium text-foreground">No notifications yet</p>
              <p className="max-w-[16rem] text-body-sm text-muted">
                The more you do on VAEL, the more you'll see in here.
              </p>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-border-subtle overflow-y-auto">
              {rows.map((item) => {
                const row = (
                  <>
                    {!item.read ? (
                      <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#FFC555] dark:bg-accent" />
                    ) : (
                      <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-transparent" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-body-sm font-medium text-foreground">{item.title}</span>
                        <span className="shrink-0 text-caption text-quiet">{relativeTime(item.createdAt)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-caption text-muted">{item.body}</span>
                    </div>
                  </>
                );
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link to={item.href} className="flex items-start gap-3 px-5 py-4 hover:bg-surface-muted" onClick={() => setOpen(false)}>
                        {row}
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 px-5 py-4">{row}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** A glimpse of recent conversations from the header — full inbox lives at /messages. */
function MessagesMenu({
  handle,
  connections,
  thread,
  profile,
  otherParty,
  unread,
}: {
  handle: string;
  connections: VaelApi["myConnections"];
  thread: VaelApi["thread"];
  profile: VaelApi["profile"];
  otherParty: VaelApi["otherParty"];
  unread: number;
}) {
  const location = useLocation();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const rows = useMemo(() => {
    return connections
      .filter((connection) => connection.status === "connected" && !connection.blocked)
      .map((connection) => {
        const other = otherParty(connection, handle);
        const person = profile(other);
        const messages = thread(connection.id);
        const last = messages[messages.length - 1];
        const unreadCount = messages.filter(
          (item) => item.fromHandle !== handle && !item.readBy.includes(handle),
        ).length;
        return {
          id: connection.id,
          name: person?.displayName || `@${other}`,
          avatarUrl: person?.avatarUrl,
          last,
          unreadCount,
        };
      })
      .sort((a, b) => Date.parse(b.last?.createdAt ?? "0") - Date.parse(a.last?.createdAt ?? "0"))
      .slice(0, 4);
  }, [connections, handle, otherParty, profile, thread]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Messages"
        title="Messages"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#FFC555]/15 hover:text-[#C99A28] dark:border dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_-6px_rgba(0,0,0,0.4)] dark:backdrop-blur-lg dark:hover:bg-white/10"
        onClick={() => setOpen((value) => !value)}
      >
        <IconMessage className="h-5 w-5" />
        {unread > 0 ? (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1">
            {unread}
            <span className="sr-only"> unread</span>
          </Badge>
        ) : null}
      </button>
      {open ? (
        <div id={menuId} role="menu" aria-label="Messages" className={DROPDOWN_PANEL_SHELL}>
          <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-5 py-4">
            <p className="text-body font-medium text-foreground">Messages</p>
            {unread > 0 ? (
              <span className="rounded-full bg-[#FFC555]/15 px-2 py-0.5 text-caption font-medium text-[#C99A28] dark:bg-accent/15 dark:text-accent">
                {unread} new
              </span>
            ) : null}
          </div>
          {rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C99A28]/20 bg-gradient-to-br from-[#FFC555]/20 to-[#FFC555]/5 text-[#C99A28] dark:border-accent/25 dark:from-accent/20 dark:to-accent/5 dark:text-accent">
                <IconMessage className="h-6 w-6" />
              </span>
              <p className="mt-2 text-body font-medium text-foreground">No messages yet</p>
              <p className="max-w-[16rem] text-body-sm text-muted">
                A thread opens once a Handshake is accepted.
              </p>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-border-subtle overflow-y-auto" role="none">
              {rows.map((row) => (
                <li key={row.id} role="none">
                  <Link
                    role="menuitem"
                    to={`/messages?c=${row.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-5 py-4 hover:bg-surface-muted"
                  >
                    <Avatar name={row.name} src={row.avatarUrl} size="sm" className="mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-body-sm font-medium text-foreground">{row.name}</span>
                        {row.last ? (
                          <span className="shrink-0 text-caption text-quiet">{relativeTime(row.last.createdAt)}</span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-caption text-muted">
                          {row.last?.body || "No messages yet"}
                        </span>
                        {row.unreadCount > 0 ? (
                          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[#FFC555] dark:bg-accent" />
                        ) : null}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            role="menuitem"
            to="/messages"
            onClick={() => setOpen(false)}
            className="block shrink-0 border-t border-border-subtle px-5 py-4 text-center text-body-sm font-medium text-[#C99A28] hover:bg-surface-muted dark:text-accent dark:hover:bg-white/5"
          >
            See all messages
          </Link>
        </div>
      ) : null}
    </div>
  );
}

const accountMenuItemClassName =
  "flex w-full rounded-sm px-3 py-2 text-left text-body-sm text-foreground hover:bg-surface-muted";

// Identity is one generic profile shared across every district (see JoinIdentityPage) —
// the account menu's "Profile" link always opens that one page, never a per-district
// profile page, regardless of which district you're currently browsing.
function profileHrefForHandle(handle: string) {
  return `${PRODUCT_HOME}/profile/${handle}`;
}

function AccountMenu({
  handle,
  displayName,
  avatarUrl,
  profileHref,
  className,
  tone = "default",
}: {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  profileHref: string;
  className?: string;
  /** Dark hero header. The menu sits on the near-black site, not the paper surface. */
  tone?: "default" | "dark";
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useCitySession();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentDistrict = districtFromPath(location.pathname);
  const dark = tone === "dark";
  const itemClassName = cn(
    accountMenuItemClassName,
    dark && "text-[#F5F3EE] hover:bg-white/10",
  );

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account, ${handle}`}
        title={`Account, ${handle}`}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full motion-safe:transition-opacity motion-safe:duration-200 hover:opacity-90"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar
          name={displayName}
          src={avatarUrl}
          size="md"
          className={
            avatarUrl
              ? "ring-2 ring-[#FFC555]/40 ring-offset-2 ring-offset-background dark:ring-accent/50 dark:ring-offset-[#0B0C0C]"
              : "border-transparent bg-gradient-to-br from-[#FDBA74] to-[#C99A28] font-medium text-[#0B0C0C] dark:from-accent-hover dark:to-accent dark:text-[#0B0C0C]"
          }
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className={cn(
            "absolute right-0 z-40 mt-2 w-[min(16rem,calc(100vw-2.5rem))] rounded-lg border p-2 shadow-md",
            dark
              ? "border-white/15 bg-[#141414] text-[#F5F3EE] shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
              : "border-border bg-surface-elevated dark:border-white/10 dark:backdrop-blur-2xl",
          )}
        >
          <div className={cn("mb-1 border-b px-3 py-2", dark ? "border-white/10" : "border-border-subtle")}>
            <p className="truncate text-body-sm font-medium">{displayName}</p>
            <p className={cn("truncate text-caption", dark ? "text-white/55" : "text-muted")}>@{handle}</p>
          </div>
          <Link
            role="menuitem"
            to={profileHref}
            className={itemClassName}
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            role="menuitem"
            to="/account"
            className={itemClassName}
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <div role="separator" className={cn("my-1 border-t", dark ? "border-white/10" : "border-border-subtle")} />
          {isHomeownerPath(location.pathname) ? null : (
            <>
          <p className={cn("px-3 py-1 text-label", dark ? "text-white/45" : "text-muted")}>Switch district</p>
          {primaryDistricts.map((district) => (
            <button
              key={district.id}
              type="button"
              role="menuitem"
              aria-current={currentDistrict?.id === district.id ? "true" : undefined}
              className={cn(
                itemClassName,
                "items-center justify-between gap-2",
                dark && "[&>span:last-child]:border-transparent [&>span:last-child]:bg-[#16361C] [&>span:last-child]:text-[#4ADE80]",
              )}
              onClick={() => {
                setOpen(false);
                navigate(district.route);
              }}
            >
              <span className="truncate">{district.name}</span>
              <DistrictStatus status={district.status} />
            </button>
          ))}
          <div role="separator" className={cn("my-1 border-t", dark ? "border-white/10" : "border-border-subtle")} />
            </>
          )}
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            onClick={() => {
              setOpen(false);
              signOut();
              navigate("/");
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function DistrictSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = districtFromPath(location.pathname);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const label = current?.name ?? CITY_CONTEXT.name;

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`District context, ${label}`}
        className="inline-flex max-w-[14rem] items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left text-body-sm text-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-surface-muted"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 truncate">
          <span className="block text-label text-muted">District</span>
          <span className="block truncate">{label}</span>
        </span>
        {current ? <DistrictStatus status={current.status} /> : <Badge tone="outline">City</Badge>}
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Districts"
          className="absolute left-0 z-40 mt-2 w-[min(18rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-surface-elevated p-2 shadow-md md:left-auto md:right-0"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!current}
              className="flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-body-sm hover:bg-surface-muted"
              onClick={() => {
                setOpen(false);
                navigate(CITY_CONTEXT.route);
              }}
            >
              The City
              <Badge tone="outline">City</Badge>
            </button>
          </li>
          {primaryDistricts.map((district) => (
            <li key={district.id}>
              <button
                type="button"
                role="option"
                aria-selected={current?.id === district.id}
                className="flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-body-sm hover:bg-surface-muted"
                onClick={() => {
                  setOpen(false);
                  navigate(district.route);
                }}
              >
                <span>
                  <span className="block">{district.name}</span>
                  {district.registryName ? (
                    <span className="block text-caption text-muted">Registry: {district.registryName}</span>
                  ) : null}
                </span>
                <DistrictStatus status={district.status} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const BANNER_DISMISS_KEY_PREFIX = "vael_profile_banner_dismissed_";

/** Dismissible strip above the header, nudging an incomplete profile toward completion. */
function ProfileCompleteBanner({ handle }: { handle: string }) {
  const vael = useVael();
  const profile = vael.profile(handle);
  const documents = vael.documents(handle);
  const { percent } = profileCompletion(profile, documents, vael.latestListing?.side ?? "in");
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(`${BANNER_DISMISS_KEY_PREFIX}${handle}`) === "1";
    } catch {
      return false;
    }
  });

  if (!profile || percent >= 100 || dismissed) return null;

  return (
    <div className="relative flex items-center justify-center bg-[#0B0C0C] px-10 py-2.5 text-center text-body-sm text-white">
      <p>
        Unlock full visibility across districts by completing your profile.{" "}
        <Link
          to={`${PRODUCT_HOME}/profile/${handle}/edit`}
          className="font-medium underline underline-offset-2 hover:no-underline"
        >
          Complete profile
        </Link>
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
        onClick={() => {
          setDismissed(true);
          try {
            sessionStorage.setItem(`${BANNER_DISMISS_KEY_PREFIX}${handle}`, "1");
          } catch {
            /* ignore */
          }
        }}
      >
        <IconClose className="h-4 w-4" />
      </button>
    </div>
  );
}

export function CityShell() {
  const { session } = useCitySession();
  const navigate = useNavigate();
  const vael = useVael();
  const unreadNotifications = vael.unreadNotices || session.unreadNotifications;
  const unreadMessages = vael.unreadMessages || session.unreadMessages;
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const onSite = isSitePath(location.pathname);
  const onHero = location.pathname === "/";
  const inProduct = session.signedIn && !onSite;
  const inJoinFlow =
    location.pathname.startsWith("/join") ||
    location.pathname === "/sign-in" ||
    location.pathname === "/sign-up" ||
    location.pathname === "/go-visible" ||
    isHomeownerPath(location.pathname);
  const darkNav = isWebsiteNavPath(location.pathname) || inJoinFlow;
  const onNeedFlow = location.pathname === "/need" || location.pathname.startsWith("/need/");

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  if (onNeedFlow) return null;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      {inProduct ? <ProfileCompleteBanner handle={session.handle} /> : null}
      <header
        className={cn(
          "z-40 text-foreground",
          darkNav
            ? onHero
              ? "absolute inset-x-0 top-0 border-b border-transparent bg-transparent"
              : "sticky top-0 border-b border-white/10 bg-[#0B0C0C]"
            : inProduct
              ? "sticky top-0 border-b border-border-subtle bg-white dark:border-white/5 dark:bg-[#0B0C0C]/70 dark:backdrop-blur-xl dark:supports-[backdrop-filter]:bg-[#0B0C0C]/50 dark:after:absolute dark:after:inset-x-0 dark:after:bottom-[-1px] dark:after:h-px dark:after:bg-gradient-to-r dark:after:from-transparent dark:after:via-accent/40 dark:after:to-transparent dark:after:content-['']"
              : "sticky top-0 border-b border-border-subtle bg-background",
        )}
      >
        <div
          className={cn(
            "relative flex h-nav min-w-0 items-center gap-4",
            inProduct ? "w-full px-4 sm:px-6" : "gap-6 site-container",
          )}
        >
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <img src="/vael-medallion.png" alt="" className="h-9 w-9 sm:h-10 sm:w-10" />
            <span className="sr-only">VAEL — City home</span>
          </Link>
          {!inProduct ? (
            <nav
              className="hidden min-w-0 items-center gap-8 lg:absolute lg:left-1/2 lg:flex lg:-translate-x-1/2"
              aria-label="Site"
            >
              {cityEntryNav.map((item) => {
                const active = siteNavActive(location.pathname, location.hash, item.to);
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "px-0 py-2 font-sans text-body-sm font-medium motion-safe:transition-colors motion-safe:duration-200",
                      darkNav
                        ? active
                          ? "text-white"
                          : "text-white/85 hover:text-white"
                        : active
                          ? "text-foreground"
                          : "text-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
          <div className="ml-auto flex min-w-0 items-center gap-3">
            {inProduct ? (
              <>
                <form
                  role="search"
                  className="hidden min-w-0 items-center gap-2 rounded-lg border border-border bg-white px-4 md:flex md:w-72 lg:w-[26rem] dark:border-white/10 dark:bg-white/[0.05] dark:backdrop-blur-md"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const query = String(new FormData(event.currentTarget).get("q") || "").trim();
                    navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
                  }}
                >
                  <label htmlFor="city-header-search" className="sr-only">
                    Search VAEL
                  </label>
                  <IconSearch className="h-4 w-4 shrink-0 text-quiet" />
                  <input
                    id="city-header-search"
                    name="q"
                    type="search"
                    placeholder="Search people, skills, or districts"
                    className="h-11 min-w-0 flex-1 bg-transparent text-body-sm text-foreground placeholder:text-quiet focus:outline-none"
                  />
                </form>
                <NotificationsMenu notices={vael.notices} unread={unreadNotifications} />
                <MessagesMenu
                  handle={session.handle}
                  connections={vael.myConnections}
                  thread={vael.thread}
                  profile={vael.profile}
                  otherParty={vael.otherParty}
                  unread={unreadMessages}
                />
                <AccountMenu
                  handle={session.handle}
                  displayName={vael.profile(session.handle)?.displayName || session.handle}
                  avatarUrl={vael.profile(session.handle)?.avatarUrl || DEFAULT_AVATAR_URL}
                  profileHref={profileHrefForHandle(session.handle)}
                />
              </>
            ) : session.signedIn ? (
              <>
                {inJoinFlow ? null : (
                  <AccountMenu
                    handle={session.handle}
                    displayName={vael.profile(session.handle)?.displayName || session.handle}
                    avatarUrl={vael.profile(session.handle)?.avatarUrl || DEFAULT_AVATAR_URL}
                    profileHref={profileHrefForHandle(session.handle)}
                    className="hidden sm:block"
                    tone={darkNav ? "dark" : "default"}
                  />
                )}
                <Link
                  to={enterProductHref(true, session.handle)}
                  className={cn(
                    "hidden h-12 items-center justify-center gap-2 rounded-md px-5 font-sans text-body-sm font-medium leading-none transition-colors sm:inline-flex",
                    darkNav
                      ? "bg-[#DE7C40] text-[#0B0C0C] hover:bg-[#E89E6E]"
                      : "bg-[#FFC555] text-[#0B0C0C] hover:bg-[#FFC555]/90",
                  )}
                >
                  Open VAEL
                  <span aria-hidden>→</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className={cn(
                    "hidden px-2 py-2 font-sans text-body-sm font-medium sm:inline-flex",
                    darkNav ? "text-white/85 hover:text-white" : "text-muted hover:text-foreground",
                  )}
                >
                  Sign in
                </Link>
                <Link
                  to={GO_VISIBLE_ROUTE}
                  className={cn(
                    "hidden h-12 items-center justify-center rounded-md px-5 font-sans text-body-sm font-medium leading-none transition-colors sm:inline-flex",
                    darkNav
                      ? "bg-[#DE7C40] text-[#0B0C0C] hover:bg-[#E89E6E]"
                      : "bg-[#FFC555] text-[#0B0C0C] hover:bg-[#FFC555]/90",
                  )}
                >
                  Go Visible →
                </Link>
              </>
            )}
            <IconButton
              className={cn("lg:hidden", darkNav && "text-white hover:bg-white/10")}
              label="More City destinations"
              onClick={() => setMoreOpen(true)}
            >
              <IconMenu />
            </IconButton>
          </div>
        </div>
      </header>

      {inProduct ? (
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-4">
          {mobilePrimary.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.to}
                end={item.end}
                aria-label={item.label}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-12 w-full min-w-0 flex-col items-center justify-center gap-1 overflow-hidden px-1 text-center text-caption font-medium leading-tight",
                    isActive ? "text-foreground" : "text-muted",
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      ) : null}

      <Drawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title={inProduct ? "City" : "VAEL"}
        side="left"
      >
        {inProduct ? (
          <>
            <p className="mb-4 text-body-sm text-muted">
              Secondary destinations. Primary actions stay on the bar below.
            </p>
            <ul className="flex flex-col">
              {moreLinks.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn("block py-3 text-button font-medium", isActive ? "text-foreground" : "text-muted")
                    }
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <ul className="flex flex-col">
              {cityEntryNav.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    className="block py-3 text-button font-medium text-foreground"
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to={session.signedIn ? "/account" : "/sign-in"}
                  className="block py-3 text-button font-medium text-foreground"
                  onClick={() => setMoreOpen(false)}
                >
                  {session.signedIn ? "Account" : "Sign in"}
                </Link>
              </li>
            </ul>
            {session.signedIn ? (
              <Link
                to={enterProductHref(true, session.handle)}
                className={buttonClassName({ size: "lg", className: "mt-6 w-full" })}
                onClick={() => setMoreOpen(false)}
              >
                Open VAEL →
              </Link>
            ) : (
              <Link
                to={GO_VISIBLE_ROUTE}
                className={buttonClassName({ size: "lg", className: "mt-6 w-full" })}
                onClick={() => setMoreOpen(false)}
              >
                Go Visible →
              </Link>
            )}
          </>
        )}
      </Drawer>
    </>
  );
}

export function CityFooter() {
  const { session } = useCitySession();
  return <SiteFooter signedIn={session.signedIn} />;
}

const SITE_FOOTER_EXPLORE_LINKS = [
  { label: "Marketplace", to: "/explore" },
  { label: "Districts", to: "/districts" },
  { label: "Community", to: "/feed" },
  { label: "How It Works", to: "/#how-it-works" },
] as const;

const SITE_FOOTER_COMPANY_LINKS = [
  { label: "About", to: "/#how-it-works" },
  { label: "Terms", to: "/legal/terms" },
  { label: "Privacy", to: "/legal/privacy" },
] as const;

function siteFooterColumns(signedIn: boolean) {
  return [
    { title: "Explore", links: SITE_FOOTER_EXPLORE_LINKS },
    { title: "Company", links: SITE_FOOTER_COMPANY_LINKS },
    {
      title: "Account",
      links: signedIn
        ? [
            { label: "Account", to: "/account" },
            { label: "Notifications", to: "/notifications" },
          ]
        : [
            { label: "Sign In", to: "/sign-in" },
            { label: "Join VAEL", to: JOIN_ROUTE },
          ],
    },
  ] as const;
}

function SiteFooter({ signedIn = false }: { signedIn?: boolean }) {
  const columns = siteFooterColumns(signedIn);
  return (
    <footer data-surface="site-dark" className="mt-auto bg-[#0B0C0C] text-white">
      <div className="site-container py-14 md:py-20">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <p className="flex items-center gap-2.5 font-sans text-h3 font-medium tracking-tight text-white">
              <img src="/vael-medallion.png" alt="" className="h-8 w-8" />
              VAEL
            </p>
            <p className="mt-3 max-w-[16rem] text-body-sm text-white/50">
              See who's available. Find who fits. Make the connection.
            </p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="site-meta text-white/85">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-body-sm text-white/50 hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-caption text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} THE CITY OF VAEL</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/legal/terms" className="hover:text-white/70">
              Terms
            </Link>
            <Link to="/legal/privacy" className="hover:text-white/70">
              Privacy
            </Link>
            <Link to="/legal/sms-terms" className="hover:text-white/70">
              SMS terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function CityPage({
  width = "default",
  children,
  className,
}: {
  width?: "default" | "narrow" | "wide" | "full";
  children: ReactNode;
  className?: string;
}) {
  if (width === "full") return <div className={className}>{children}</div>;
  return (
    <Container width={width} className={cn("py-12", className)}>
      {children}
    </Container>
  );
}
