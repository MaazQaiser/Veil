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
  IconCheck,
  IconClose,
  IconGrid,
  IconHome,
  IconMenu,
  IconMessage,
  IconMoon,
  IconSearch,
  IconSun,
  IconUsers,
} from "@/components/ui/icons";
import { CITY_CONTEXT, districtFromPath, primaryDistricts } from "@/lib/districts";
import { useCitySession } from "@/lib/citySession";
import { useTheme } from "@/lib/theme";
import { useVael } from "@/lib/vaelCore";
import { onboardingComplete, onboardingRoute } from "@/lib/onboarding";
import { PRODUCT_HOME, isDarkModeFlowPath, profileCompletion } from "@/lib/providerJourney";
import { relativeTime } from "@/lib/time";

type VaelApi = ReturnType<typeof useVael>;

/** Header avatar falls back to a real photo, never bare initials, until a member uploads their own. */
const DEFAULT_AVATAR_URL = "/people/p04.jpg";

/** Site-header pill links — shown on the public marketing site only, not inside the product. */
const cityEntryNav = [
  { id: "explore", label: "Explore Districts", to: "/districts" },
  { id: "how", label: "How VAEL Works", to: "/#how-it-works" },
  { id: "community", label: "Community", to: "/feed" },
] as const;

export const JOIN_ROUTE = "/join";

function enterProductHref(signedIn: boolean, handle: string) {
  if (!signedIn) return JOIN_ROUTE;
  if (!onboardingComplete(handle)) return onboardingRoute(handle);
  return PRODUCT_HOME;
}

/** Public website surfaces keep marketing chrome even when a member is signed in. */
export function isSitePath(pathname: string) {
  if (pathname === "/" || pathname === "/explore") return true;
  if (pathname === "/sign-in" || pathname === "/sign-up") return true;
  return pathname === "/join" || pathname.startsWith("/join/");
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

/** Dark-mode toggle — visible in the header while on the dashboard, where dark styling exists so far. */
function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#FFC555]/15 hover:text-[#C99A28] dark:border dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_-6px_rgba(0,0,0,0.4)] dark:backdrop-blur-lg dark:hover:bg-white/10 dark:hover:text-[#F5F3EE]"
      onClick={toggleTheme}
    >
      {isDark ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
    </button>
  );
}

/** Accent picker — only meaningful in dark mode, lets the viewer choose the orange or yellow CTA palette. */
function AccentPicker() {
  const { theme, accent, setAccent } = useTheme();
  const id = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const options: Array<{ value: "orange" | "yellow"; label: string; swatch: string }> = [
    { value: "orange", label: "Orange", swatch: "#FF9D45" },
    { value: "yellow", label: "Yellow", swatch: "#FFC555" },
  ];

  if (theme !== "dark") return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label="Accent color"
        title="Accent color"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] motion-safe:transition-colors motion-safe:duration-200 hover:bg-white/10"
        onClick={() => setOpen((value) => !value)}
      >
        <span
          aria-hidden
          className={cn(
            "h-4 w-4 rounded-full ring-1 ring-inset ring-white/25",
            accent === "yellow" ? "bg-[#FFC555]" : "bg-[#FF9D45]",
          )}
        />
      </button>
      {open ? (
        <div
          id={id}
          role="menu"
          aria-label="Accent color"
          className="absolute right-0 z-40 mt-2 w-44 rounded-2xl border border-white/10 bg-surface-elevated p-2 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={accent === option.value}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-body-sm font-medium text-foreground hover:bg-white/10",
                accent === option.value ? "bg-white/10" : null,
              )}
              onClick={() => {
                setAccent(option.value);
                setOpen(false);
              }}
            >
              <span aria-hidden className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: option.swatch }} />
              {option.label}
              {accent === option.value ? <IconCheck className="ml-auto h-4 w-4 shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
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
              {rows.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-5 py-4">
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
                </li>
              ))}
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
}: {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  profileHref: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useCitySession();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentDistrict = districtFromPath(location.pathname);

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
              ? "ring-2 ring-[#FFC555]/40 ring-offset-2 ring-offset-background dark:ring-accent/50 dark:ring-offset-[#100E0B]"
              : "border-transparent bg-gradient-to-br from-[#FDBA74] to-[#C99A28] font-medium text-[#0B0C0C] dark:from-accent-hover dark:to-accent dark:text-[#1A1410]"
          }
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-40 mt-2 w-[min(16rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-surface-elevated p-2 shadow-md dark:border-white/10 dark:backdrop-blur-2xl"
        >
          <div className="mb-1 border-b border-border-subtle px-3 py-2">
            <p className="truncate text-body-sm font-medium">{displayName}</p>
            <p className="truncate text-caption text-muted">@{handle}</p>
          </div>
          <Link
            role="menuitem"
            to={profileHref}
            className={accountMenuItemClassName}
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            role="menuitem"
            to="/account"
            className={accountMenuItemClassName}
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <div role="separator" className="my-1 border-t border-border-subtle" />
          <p className="px-3 py-1 text-label text-muted">Switch district</p>
          {primaryDistricts.map((district) => (
            <button
              key={district.id}
              type="button"
              role="menuitem"
              aria-current={currentDistrict?.id === district.id ? "true" : undefined}
              className={cn(accountMenuItemClassName, "items-center justify-between gap-2")}
              onClick={() => {
                setOpen(false);
                navigate(district.route);
              }}
            >
              <span className="truncate">{district.name}</span>
              <DistrictStatus status={district.status} />
            </button>
          ))}
          <div role="separator" className="my-1 border-t border-border-subtle" />
          <button
            type="button"
            role="menuitem"
            className={accountMenuItemClassName}
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
  const inJoinFlow = location.pathname.startsWith("/join");

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

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
          onHero
            ? "absolute inset-x-0 top-0 border-b border-transparent bg-transparent"
            : inProduct
              ? "sticky top-0 border-b border-border-subtle bg-white dark:relative dark:border-white/5 dark:bg-[#15130F]/70 dark:backdrop-blur-xl dark:supports-[backdrop-filter]:bg-[#15130F]/50 dark:after:absolute dark:after:inset-x-0 dark:after:bottom-[-1px] dark:after:h-px dark:after:bg-gradient-to-r dark:after:from-transparent dark:after:via-accent/40 dark:after:to-transparent dark:after:content-['']"
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
            <span
              className={cn(
                "font-sans text-[1.0625rem] font-medium tracking-tight",
                onHero ? "text-white" : "text-foreground",
              )}
            >
              VAEL
            </span>
            <span className="sr-only"> — City home</span>
          </Link>
          {!inProduct ? (
            <nav
              className="hidden min-w-0 items-center gap-8 lg:absolute lg:left-1/2 lg:flex lg:-translate-x-1/2"
              aria-label="Site"
            >
              {cityEntryNav.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  className={cn(
                    "px-0 py-2 text-[0.9375rem] font-medium motion-safe:transition-colors motion-safe:duration-200",
                    onHero ? "text-white/85 hover:text-white" : "text-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <div className="ml-auto flex min-w-0 items-center gap-3">
            {inProduct ? (
              <>
                <form
                  role="search"
                  className="hidden min-w-0 items-center gap-2 rounded-full border border-border bg-white px-4 md:flex md:w-72 lg:w-[26rem] dark:border-white/10 dark:bg-white/[0.05] dark:backdrop-blur-md"
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
                {isDarkModeFlowPath(location.pathname) ? (
                  <>
                    <DarkModeToggle />
                    <AccentPicker />
                  </>
                ) : null}
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
                  />
                )}
                <Link
                  to={enterProductHref(true, session.handle)}
                  className={cn(
                    "hidden items-center justify-center rounded-full bg-[#FFC555] px-5 text-button font-medium text-[#0B0C0C] transition-opacity hover:opacity-90 sm:inline-flex",
                    onHero ? "h-11" : "h-12",
                  )}
                >
                  Open VAEL
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className={cn(
                    "hidden px-2 py-2 text-button font-medium sm:inline-flex",
                    onHero ? "text-white/85 hover:text-white" : "text-muted hover:text-foreground",
                  )}
                >
                  Sign in
                </Link>
                <Link
                  to={JOIN_ROUTE}
                  className={cn(
                    "hidden items-center justify-center rounded-full bg-[#FFC555] px-5 text-button font-medium text-[#0B0C0C] transition-opacity hover:opacity-90 sm:inline-flex",
                    onHero ? "h-11" : "h-12",
                  )}
                >
                  Join VAEL →
                </Link>
              </>
            )}
            <IconButton
              className={cn("lg:hidden", onHero && "text-white hover:bg-white/10")}
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
            <Link
              to={enterProductHref(session.signedIn, session.handle)}
              className={buttonClassName({ size: "lg", className: "mt-6 w-full" })}
              onClick={() => setMoreOpen(false)}
            >
              {session.signedIn ? "Open VAEL" : "Join VAEL"}
            </Link>
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
