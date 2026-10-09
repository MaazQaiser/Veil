import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import {
  IconChevronLeft,
  IconChevronRight,
  IconGrid,
  IconHandshake,
  IconHome,
  IconLifebuoy,
  IconMapPin,
  IconUsers,
} from "@/components/ui/icons";
import { profileFieldsFor, type ProfileFieldId, type ProfileSectionId } from "@/lib/profileFields";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import type { ProfileDocument, ProfileRecord, VaelSide } from "@/lib/vaelStore";

const FIELD_SHORT_LABEL: Record<ProfileFieldId, string> = {
  displayName: "your name",
  location: "a location",
  avatarUrl: "a profile photo",
  disciplines: "a discipline",
  skills: "your skills",
  tools: "your tools",
  bio: "a short bio",
  experience: "your experience",
  portfolio: "your portfolio",
  credentials: "certifications",
  documents: "documents",
  hiringFor: "what you're hiring for",
  need: "a description of what you need",
};

function fieldShortLabel(id: ProfileFieldId, side: VaelSide) {
  if (id === "credentials" && side === "out") return "requirements";
  if (id === "portfolio" && side === "out") return "links";
  return FIELD_SHORT_LABEL[id];
}

/** The profile-edit page's actual anchor ids — the "credentials" section renders under id="documents". */
const SECTION_ANCHOR: Record<ProfileSectionId, string> = {
  identity: "identity",
  expertise: "expertise",
  work: "work",
  credentials: "documents",
};

const sidebarNav = (connectionBadge: number) =>
  [
    { id: "home", label: "Home", to: PRODUCT_HOME, end: true, icon: IconHome },
    { id: "matches", label: "Matches", to: `${PRODUCT_HOME}/matches`, end: false, icon: IconGrid },
    {
      id: "handshakes",
      label: "Handshakes",
      to: `${PRODUCT_HOME}/connections`,
      end: false,
      icon: IconHandshake,
      badge: connectionBadge,
    },
    { id: "community", label: "Community", to: `${PRODUCT_HOME}/community`, end: false, icon: IconUsers },
  ] as const;

const COLLAPSED_KEY = "vael_sidebar_collapsed_v1";

function readCollapsed(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Left rail of the signed-in Home dashboard — nav + a live profile-completion checklist, all real data. */
export function DashboardSidebar({
  handle,
  profile,
  documents,
  incomingCount,
  side = "in",
}: {
  handle: string;
  profile: ProfileRecord | undefined;
  documents: ProfileDocument[];
  incomingCount: number;
  side?: VaelSide;
}) {
  const fields = profileFieldsFor(side);
  const filled = profile ? fields.filter((field) => field.filled(profile, documents)).length : 0;
  const percent = profile ? Math.round((filled / fields.length) * 100) : 0;
  const missing = fields.filter((field) => !profile || !field.filled(profile, documents));
  const weight = Math.round(100 / fields.length);
  const location = useLocation();
  const base = sidebarNav(incomingCount);
  const nav = [
    base[0],
    { id: "districts", label: "Districts", to: `${PRODUCT_HOME}/districts`, end: false, icon: IconMapPin },
    ...base.slice(1),
  ];
  const [collapsed, setCollapsed] = useState(readCollapsed);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore — collapse state just won't persist across visits
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-[4.5rem] hidden h-[calc(100vh-4.5rem)] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-border-subtle bg-[#F7F7F8] py-4 motion-safe:transition-[width] motion-safe:duration-200 lg:flex dark:border-white/5 dark:bg-white/[0.025] dark:backdrop-blur-3xl",
        collapsed ? "w-[4.5rem] px-2" : "w-72 px-4",
      )}
    >
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-pressed={collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted motion-safe:transition-colors hover:bg-white/70 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-[#F5F3EE]",
          collapsed ? "self-center" : "self-end",
        )}
      >
        {collapsed ? <IconChevronRight className="h-4 w-4" /> : <IconChevronLeft className="h-4 w-4" />}
      </button>

      <nav aria-label="Dashboard" className="flex flex-col gap-1">
        {nav.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => {
              const active =
                isActive || (item.id === "matches" && /\/board\//.test(location.pathname));
              return cn(
                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-body-sm font-medium motion-safe:transition-colors motion-safe:duration-150",
                collapsed && "justify-center px-0",
                active
                  ? "bg-white text-[#C99A28] shadow-sm dark:bg-accent dark:text-[#0B0C0C]"
                  : "text-muted hover:bg-white/70 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-[#F5F3EE]",
              );
            }}
          >
            <item.icon className="h-5 w-5 shrink-0 motion-safe:transition-transform motion-safe:duration-150 dark:group-hover:scale-110" />
            {collapsed ? (
              <span className="sr-only">{item.label}</span>
            ) : (
              <span className="flex-1 truncate">{item.label}</span>
            )}
            {"badge" in item && item.badge ? (
              <span
                className={cn(
                  "flex items-center justify-center rounded-full bg-[#FFC555] font-semibold text-[#0B0C0C] dark:bg-accent dark:text-[#0B0C0C]",
                  collapsed
                    ? "absolute right-1 top-1 h-2 w-2 p-0"
                    : "h-5 min-w-5 px-1.5 text-caption",
                )}
              >
                {collapsed ? null : item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4 pt-6">
        {percent < 100 && !collapsed ? (
          <div className="rounded-2xl bg-[#0B0C0C] p-5 text-white dark:border dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]">
            <p className="text-body-sm font-medium">
              Your profile is <span className="tabular-nums">{percent}%</span> complete
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#FFC555] motion-safe:transition-[width] motion-safe:duration-300 dark:bg-gradient-to-r dark:from-accent-hover dark:to-accent dark:shadow-[0_0_12px_1px_rgba(255,138,61,0.6)]"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-3 text-caption text-white/60">
              {side === "out"
                ? "Complete your profile to get matched with the right candidates faster."
                : "Complete your profile so people can see what you offer."}
            </p>
            <ul className="mt-4 space-y-2 border-t border-white/10 pt-3">
              {missing.slice(0, 5).map((field) => (
                <li key={field.id} className="flex items-center justify-between gap-2 text-caption">
                  <Link
                    to={`${PRODUCT_HOME}/profile/${handle}/edit#${SECTION_ANCHOR[field.section]}`}
                    className="truncate text-white/80 underline underline-offset-2 hover:text-white dark:hover:text-accent-hover"
                  >
                    Add {fieldShortLabel(field.id, side)}
                  </Link>
                  <span className="shrink-0 tabular-nums text-white/40">{weight}%</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Link
          to={`${PRODUCT_HOME}/how-it-works`}
          title={collapsed ? "Help Center" : undefined}
          className={cn(
            "flex items-center gap-2 py-2 text-body-sm font-medium text-muted motion-safe:transition-colors motion-safe:duration-150 hover:text-foreground dark:hover:text-accent-hover",
            collapsed ? "justify-center px-0" : "px-4",
          )}
        >
          <IconLifebuoy className="h-4 w-4 shrink-0" />
          {collapsed ? <span className="sr-only">Help Center</span> : "Help Center"}
        </Link>
      </div>
    </aside>
  );
}
