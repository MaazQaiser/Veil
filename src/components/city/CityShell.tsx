import { useEffect, useId, useRef, useState, type ReactNode } from "react";
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
  IconGrid,
  IconHome,
  IconMenu,
  IconMessage,
  IconUsers,
} from "@/components/ui/icons";
import { CITY_CONTEXT, districtFromPath, primaryDistricts } from "@/lib/districts";
import { useCitySession } from "@/lib/citySession";
import { useVael } from "@/lib/vaelCore";
import { onboardingComplete, onboardingRoute } from "@/lib/onboarding";
import { PRODUCT_HOME } from "@/lib/providerJourney";

export const cityPrimaryNav = [
  { id: "home", label: "Home", to: PRODUCT_HOME },
  { id: "matches", label: "Matches", to: "/matches" },
  { id: "community", label: "Community", to: `${PRODUCT_HOME}/community` },
  { id: "messages", label: "Messages", to: "/messages" },
] as const;

/**
 * A signed-out visitor is on the public website, not in the product. Member tools
 * would either wall them or pull them away from the one decision that matters.
 */
const cityEntryNav = [
  { id: "explore", label: "Explore", to: "/explore" },
  { id: "how", label: "How VAEL Works", to: "/#how-it-works" },
  { id: "districts", label: "Districts", to: "/districts" },
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
  { id: "matches", label: "Matches", to: "/matches", icon: IconGrid, end: false },
  { id: "community", label: "Community", to: `${PRODUCT_HOME}/community`, icon: IconUsers, end: false },
  { id: "messages", label: "Messages", to: "/messages", icon: IconMessage, end: false },
] as const;

const moreLinks = [
  { label: "Feed", to: "/feed" },
  { label: "Districts", to: "/districts" },
  { label: "Notifications", to: "/notifications" },
  { label: "Today", to: "/today" },
  { label: "Concierge", to: "/concierge" },
] as const;

function navClass(active: boolean) {
  return cn(
    "px-0 py-2 text-button font-medium motion-safe:transition-colors motion-safe:duration-200",
    active ? "text-foreground" : "text-muted hover:text-foreground",
  );
}

function IconLink({
  to,
  label,
  children,
  className,
}: {
  to: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-surface-muted",
        className,
      )}
    >
      {children}
    </Link>
  );
}

const accountMenuItemClassName =
  "flex w-full rounded-sm px-3 py-2 text-left text-body-sm text-foreground hover:bg-surface-muted";

function profileHrefForHandle(handle: string, district: ReturnType<typeof districtFromPath>) {
  if (district) return `${district.route}/profile/${handle}`;
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
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground motion-safe:transition-colors motion-safe:duration-200 hover:bg-surface-muted"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={displayName} src={avatarUrl} size="sm" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-40 mt-2 w-[min(16rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-surface-elevated p-2 shadow-md"
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

export function CityShell() {
  const { session } = useCitySession();
  const vael = useVael();
  const unreadNotifications = vael.unreadNotices || session.unreadNotifications;
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const district = districtFromPath(location.pathname);
  const onSite = isSitePath(location.pathname);
  const inProduct = session.signedIn && !onSite;

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
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-background text-foreground">
        <div className="vael-container-wide flex h-nav min-w-0 items-center gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img src="/vael-medallion.png" alt="" className="h-8 w-8" />
            <span className="font-sans text-h4">VAEL</span>
            <span className="sr-only"> — City home</span>
          </Link>
          <nav
            className="hidden min-w-0 lg:flex items-center gap-7"
            aria-label={inProduct ? "Product" : "Site"}
          >
            {inProduct
              ? cityPrimaryNav.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    end={item.id === "home"}
                    className={({ isActive }) => navClass(isActive)}
                  >
                    {item.label}
                  </NavLink>
                ))
              : cityEntryNav.map((item) => (
                  <Link key={item.id} to={item.to} className={navClass(false)}>
                    {item.label}
                  </Link>
                ))}
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {inProduct ? (
              <>
                <IconLink to="/notifications" label="Notifications">
                  <IconBell />
                  {unreadNotifications > 0 ? (
                    <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1">
                      {unreadNotifications}
                      <span className="sr-only"> unread</span>
                    </Badge>
                  ) : null}
                </IconLink>
                <AccountMenu
                  handle={session.handle}
                  displayName={vael.profile(session.handle)?.displayName || session.handle}
                  avatarUrl={vael.profile(session.handle)?.avatarUrl}
                  profileHref={profileHrefForHandle(session.handle, district)}
                />
              </>
            ) : session.signedIn ? (
              <>
                <AccountMenu
                  handle={session.handle}
                  displayName={vael.profile(session.handle)?.displayName || session.handle}
                  avatarUrl={vael.profile(session.handle)?.avatarUrl}
                  profileHref={profileHrefForHandle(session.handle, district)}
                  className="hidden sm:block"
                />
                <Link
                  to={enterProductHref(true, session.handle)}
                  className={buttonClassName({ className: "hidden sm:inline-flex h-12 px-5" })}
                >
                  Open VAEL
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="hidden px-2 py-2 text-button font-medium text-muted hover:text-foreground sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link to={JOIN_ROUTE} className={buttonClassName({ className: "hidden sm:inline-flex h-12 px-5" })}>
                  Join VAEL
                </Link>
              </>
            )}
            <IconButton className="lg:hidden" label="More City destinations" onClick={() => setMoreOpen(true)}>
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
  const location = useLocation();
  if (!session.signedIn || isSitePath(location.pathname)) return <SiteFooter />;
  return (
    <footer className="mt-auto border-t border-border-subtle py-8 text-caption text-muted">
      <div className="vael-container-wide flex flex-wrap gap-x-4 gap-y-2">
        <span>THE CITY OF VAEL</span>
        <Link to="/legal/terms" className="hover:text-foreground">
          Terms
        </Link>
        <Link to="/legal/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <Link to="/legal/sms-terms" className="hover:text-foreground">
          SMS terms
        </Link>
        <Link to="/design-system" className="hover:text-foreground">
          Design system
        </Link>
      </div>
    </footer>
  );
}

const SITE_FOOTER_COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Marketplace", to: "/explore" },
      { label: "Districts", to: "/districts" },
      { label: "Community", to: "/feed" },
      { label: "How It Works", to: "/#how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/#how-it-works" },
      { label: "Terms", to: "/legal/terms" },
      { label: "Privacy", to: "/legal/privacy" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", to: "/sign-in" },
      { label: "Join VAEL", to: JOIN_ROUTE },
    ],
  },
] as const;

function SiteFooter() {
  return (
    <footer data-surface="site" className="mt-auto bg-background text-foreground">
      <div className="site-container border-t border-border py-14 md:py-20">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <p className="font-sans text-h3 font-medium tracking-tight">VAEL</p>
            <p className="mt-3 text-body-sm text-muted">See who's available. Find who fits. Make the connection.</p>
          </div>
          {SITE_FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="site-meta text-foreground">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-body-sm text-muted hover:text-foreground">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
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
