import { useEffect } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  IconBookmark,
  IconDocument,
  IconFlag,
  IconGrid,
  IconLifebuoy,
  IconMoon,
  IconSun,
  IconUsers,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { ADMIN_EMAIL, ADMIN_NAME, adminOverview, adminSignOut, isAdminSignedIn } from "@/lib/adminStore";
import { seedAdminDemo } from "@/lib/adminDemo";
import { useTheme } from "@/lib/theme";
import { useAdmin } from "@/lib/useAdmin";

const NAV = [
  { to: "/admin", label: "Overview", icon: IconGrid, end: true },
  { to: "/admin/reports", label: "Reports", icon: IconFlag, badge: true },
  { to: "/admin/founding", label: "Founding", icon: IconBookmark },
  { to: "/admin/resources", label: "Resources", icon: IconDocument },
  { to: "/admin/help", label: "Help and services", icon: IconLifebuoy },
  { to: "/admin/accounts", label: "Accounts", icon: IconUsers },
] as const;

/** The admin console. Its own shell, separate from the member site, and only open to the admin sign-in. */
export function AdminLayout() {
  useAdmin();
  // A first look at the demo should not be empty: add the sample members and activity once.
  useEffect(() => {
    if (isAdminSignedIn()) seedAdminDemo();
  }, []);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  if (!isAdminSignedIn()) return <Navigate to="/sign-in?admin=1" replace />;
  const waiting = adminOverview().reportsWaiting;

  function signOut() {
    adminSignOut();
    navigate("/sign-in", { replace: true });
  }

  return (
    <div
      data-theme={theme}
      data-accent="orange"
      className="min-h-dvh bg-background text-foreground dark:bg-[#0B0C0C] dark:text-[#F5F3EE] lg:flex"
    >
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border-subtle bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="px-6 pb-4 pt-7">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-foreground">The City of Vael</p>
          <span className="mt-2 inline-flex h-6 items-center rounded-full bg-accent/15 px-2.5 text-caption font-medium text-accent">
            Admin
          </span>
        </div>
        <nav aria-label="Admin" className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item ? item.end : false}
              className={({ isActive }) =>
                cn(
                  "relative flex h-11 items-center gap-3 rounded-xl px-3 text-body-sm font-medium motion-safe:transition-colors",
                  isActive
                    ? "bg-accent/15 text-accent before:absolute before:-left-3 before:top-2.5 before:h-6 before:w-[3px] before:rounded-full before:bg-accent"
                    : "text-muted hover:bg-surface-muted hover:text-foreground",
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {"badge" in item && waiting > 0 ? (
                <span className="rounded-full bg-accent px-2 py-0.5 text-caption font-semibold text-[#1A1410]">{waiting}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border-subtle p-4">
          <p className="truncate text-body-sm font-medium text-foreground">{ADMIN_NAME}</p>
          <p className="truncate text-caption text-muted">{ADMIN_EMAIL}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={signOut}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border text-body-sm font-medium text-foreground hover:bg-surface-muted"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted hover:bg-surface-muted hover:text-foreground"
            >
              {theme === "dark" ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>

      <div className="relative min-w-0 flex-1">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(70%_100%_at_25%_0%,rgba(238,138,74,0.09),transparent)]" />
        <div className="sticky top-0 z-20 border-b border-border-subtle bg-background/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <p className="text-caption font-semibold uppercase tracking-[0.16em]">
              The City of Vael <span className="ml-1.5 rounded-full bg-accent/15 px-2 py-0.5 text-accent">Admin</span>
            </p>
            <button type="button" onClick={signOut} className="text-body-sm font-medium text-accent">
              Sign out
            </button>
          </div>
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 py-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : false}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-body-sm font-medium",
                    isActive ? "bg-accent/15 text-accent" : "text-muted",
                  )
                }
              >
                {item.label}
                {"badge" in item && waiting > 0 ? <span className="text-caption">({waiting})</span> : null}
              </NavLink>
            ))}
          </nav>
        </div>
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
