import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import {
  IconBookmark,
  IconGrid,
  IconHandshake,
  IconHome,
  IconLifebuoy,
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
    { id: "saved", label: "Saved", to: "/feed/saved", end: false, icon: IconBookmark },
  ] as const;

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

  return (
    <aside className="sticky top-[4.5rem] hidden h-[calc(100vh-4.5rem)] w-72 shrink-0 flex-col overflow-y-auto border-r border-border-subtle bg-[#F7F7F8] px-4 py-4 lg:flex dark:border-white/5 dark:bg-white/[0.025] dark:backdrop-blur-3xl">
      <nav aria-label="Dashboard" className="flex flex-col gap-1">
        {sidebarNav(incomingCount).map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-body-sm font-medium motion-safe:transition-colors motion-safe:duration-150",
                isActive
                  ? "bg-white text-[#C99A28] shadow-sm dark:bg-gradient-to-br dark:from-accent-hover dark:to-accent dark:text-[#1A1410] dark:shadow-[0_4px_16px_-4px_rgba(255,138,61,0.5)] dark:ring-1 dark:ring-inset dark:ring-white/25"
                  : "text-muted hover:bg-white/70 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-[#F5F3EE]",
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0 motion-safe:transition-transform motion-safe:duration-150 dark:group-hover:scale-110" />
            <span className="flex-1 truncate">{item.label}</span>
            {"badge" in item && item.badge ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFC555] px-1.5 text-caption font-semibold text-[#0B0C0C] dark:bg-gradient-to-br dark:from-accent-hover dark:to-accent dark:text-[#1A1410]">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4 pt-6">
        {percent < 100 ? (
          <div className="rounded-2xl bg-[#0B0C0C] p-5 text-white dark:border dark:border-white/10 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.06] dark:via-white/[0.02] dark:to-transparent dark:backdrop-blur-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]">
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
                : "Complete your profile to apply for matches and get seen faster."}
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
          className="flex items-center gap-2 px-4 py-2 text-body-sm font-medium text-muted motion-safe:transition-colors motion-safe:duration-150 hover:text-foreground dark:hover:text-accent-hover"
        >
          <IconLifebuoy className="h-4 w-4" />
          Help Center
        </Link>
      </div>
    </aside>
  );
}
