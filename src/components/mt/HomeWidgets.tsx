import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { buttonClassName } from "@/components/ui/button";
import {
  IconBriefcase,
  IconChevronRight,
  IconClock,
  IconEdit,
  IconHandshake,
  IconHash,
  IconMessage,
  IconMessageCircle,
  IconUsers,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import {
  communityDistrictLabel,
  communityPostKind,
  communityPostKindLabel,
  formatCommunityTime,
  type CommunityPostKind,
  type CommunityPostView,
} from "@/lib/communityStore";
import { resolveCommunityAuthor } from "@/lib/communityPresent";
import { documentChecklist } from "@/lib/profileFields";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import {
  getProfile,
  type ConnectionRecord,
  type LocalNotice,
  type ProfileRecord,
  type RankedMatch,
  type ThreadMessage,
} from "@/lib/vaelStore";

/** Shared elevation/wash for the light dashboard cards. */
export const GLOW_CARD =
  "relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white p-5 " +
  "shadow-[0_1px_2px_rgba(11,12,12,0.04),0_14px_30px_-8px_rgba(17,17,17,0.12)] motion-safe:transition-shadow motion-safe:duration-200 " +
  "hover:shadow-[0_1px_2px_rgba(11,12,12,0.06),0_22px_40px_-10px_rgba(17,17,17,0.16)] md:rounded-2xl md:p-6";

export function WidgetIcon({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
        tone === "dark"
          ? "border-white/10 bg-white/5 text-[#FFC555]"
          : "border-[#C99A28]/20 bg-gradient-to-br from-[#FFC555]/20 to-[#FFC555]/5 text-[#C99A28] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]",
      )}
    >
      {children}
    </span>
  );
}

export function CornerLink({ to, tone = "light" }: { to: string; tone?: "light" | "dark" }) {
  return (
    <Link
      to={to}
      aria-label="Open"
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border motion-safe:transition-colors motion-safe:duration-150",
        tone === "dark"
          ? "border-white/15 bg-white/5 text-white/70 hover:border-[#FFC555]/50 hover:bg-[#FFC555]/10 hover:text-[#FFC555]"
          : "border-border bg-white/60 text-muted hover:border-[#C99A28]/40 hover:bg-[#FFC555]/10 hover:text-[#C99A28]",
      )}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function GhostLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={buttonClassName({
        variant: "outline",
        className: "h-9 self-start rounded-full px-4 text-body-sm",
      })}
    >
      {children}
    </Link>
  );
}

const remoteLabel: Record<string, string> = { remote: "Remote", onsite: "On-site", hybrid: "Hybrid" };

const DISTRICT_RAIL_IMAGE: Record<string, string> = {
  "media-technology": "/districts/media-technology.jpg",
  construction: "/districts/construction.jpg",
  trucking: "/districts/trucking.jpg",
  residential: "/districts/residential.jpg",
  commercial: "/districts/commercial.jpg",
};

const railScrollClassName =
  "flex snap-x gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const railEmptyClassName =
  "rounded-xl border border-dashed border-[#C99A28]/25 bg-[#FFC555]/[0.05] px-5 py-8 text-center text-body-sm text-muted dark:border-accent/25 dark:bg-accent/[0.05]";

/** Section heading shared by every horizontal card rail — eyebrow, title, description, "Show all" + scroll arrows. */
function RailHeader({
  eyebrow,
  title,
  description,
  viewAllTo,
  viewAllLabel = "Show all",
  onScroll,
}: {
  eyebrow: string;
  title: string;
  description: string;
  viewAllTo: string;
  viewAllLabel?: string;
  onScroll: (direction: -1 | 1) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-2 text-caption font-medium uppercase tracking-[0.1em] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FFC555]" aria-hidden />
          {eyebrow}
        </span>
        <h2 className="vael-h3 mt-2 text-foreground">{title}</h2>
        <p className="mt-1 text-body-sm text-muted">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Link
          to={viewAllTo}
          className="text-body-sm font-medium text-[#C99A28] underline underline-offset-4 hover:text-foreground"
        >
          {viewAllLabel}
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => onScroll(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted motion-safe:transition-colors motion-safe:duration-150 hover:border-[#C99A28]/30 hover:text-foreground"
          >
            <IconChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => onScroll(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted motion-safe:transition-colors motion-safe:duration-150 hover:border-[#C99A28]/30 hover:text-foreground"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** LARGE — the primary reason a user opens Home. Percentage-fit opportunities, not job listings. */
export function BestMatchesRail({ matches, visible }: { matches: RankedMatch[]; visible: boolean }) {
  const railRef = useRef<HTMLDivElement>(null);
  const top = matches.slice(0, 8);
  return (
    <section>
      <RailHeader
        eyebrow="Opportunities"
        title="Best matches for you"
        description="Opportunities that fit your skills, experience, and availability right now."
        viewAllTo="/matches"
        onScroll={(direction) => railRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" })}
      />
      <div className="relative mt-6">
        {!visible ? (
          <p className={railEmptyClassName}>Vael In to become visible to relevant opportunities.</p>
        ) : top.length === 0 ? (
          <p className={railEmptyClassName}>No strong matches yet. Check back once more availability opens in your district.</p>
        ) : (
          <div ref={railRef} className={railScrollClassName}>
            {top.map((match) => {
              const profile = getProfile(match.listing.handle);
              const title = profile?.headline || match.listing.discipline || match.listing.category;
              const image = profile?.coverUrl || profile?.avatarUrl || DISTRICT_RAIL_IMAGE["media-technology"];
              return (
                <Link
                  key={match.listing.id}
                  to={`${PRODUCT_HOME}/board/${match.listing.id}`}
                  className="group w-64 shrink-0 snap-start sm:w-72"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-muted">
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.04]"
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-caption font-medium text-[#C99A28] backdrop-blur">
                      <span className="tabular-nums">{Math.round(match.percent)}%</span>&nbsp;Match
                    </span>
                    <Avatar
                      name={profile?.displayName || match.listing.handle}
                      src={profile?.avatarUrl}
                      size="sm"
                      className="absolute -bottom-4 left-3 ring-2 ring-white"
                    />
                  </div>
                  <div className="mt-6 px-0.5">
                    <p className="truncate text-body font-medium text-foreground">{title}</p>
                    <p className="mt-1 truncate text-body-sm text-muted">
                      {[match.listing.category, remoteLabel[match.listing.remoteOnsite], match.listing.timing]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/** SMALL supporting widget — not a hero tile. */
export function ProfileWidget({
  handle,
  profile,
  percent,
}: {
  handle: string;
  profile: ProfileRecord | undefined;
  percent: number;
}) {
  const name = profile?.displayName || handle;
  return (
    <article className={GLOW_CARD}>
      <div className="relative flex items-center gap-3">
        <Avatar name={name} src={profile?.avatarUrl} size="sm" className="ring-2 ring-[#FFC555]/30" />
        <div className="min-w-0">
          <p className="text-caption font-medium uppercase tracking-[0.06em] text-quiet">Your profile</p>
          <p className="truncate text-body-sm font-medium text-foreground">{name}</p>
        </div>
      </div>
      <p className="relative mt-3 text-body-sm text-foreground">
        Profile <span className="font-medium tabular-nums text-[#C99A28]">{percent}%</span> complete
      </p>
      <p className="relative mt-1 text-body-sm text-muted">Complete your profile to improve your matching quality.</p>
      <div className="relative mt-4">
        <GhostLink to={`${PRODUCT_HOME}/profile/${handle}`}>View Profile</GhostLink>
      </div>
    </article>
  );
}

export function HandshakesRail({ incoming }: { incoming: ConnectionRecord[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const top = incoming.slice(0, 8);
  return (
    <section>
      <RailHeader
        eyebrow="Requests"
        title="Handshakes"
        description="People who want to connect with you right now."
        viewAllTo={`${PRODUCT_HOME}/connections`}
        onScroll={(direction) => railRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" })}
      />
      <div className="relative mt-6">
        {top.length === 0 ? (
          <p className={railEmptyClassName}>No Handshakes yet. Your matches will appear here.</p>
        ) : (
          <div ref={railRef} className={railScrollClassName}>
            {top.map((connection) => {
              const person = getProfile(connection.requesterHandle);
              const image = person?.coverUrl || person?.avatarUrl || "/scenes/handshake.jpg";
              return (
                <Link
                  key={connection.id}
                  to={`${PRODUCT_HOME}/connections`}
                  className="group w-64 shrink-0 snap-start sm:w-72"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-muted">
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.04]"
                    />
                    <Avatar
                      name={person?.displayName || connection.requesterHandle}
                      src={person?.avatarUrl}
                      size="sm"
                      className="absolute -bottom-4 left-3 ring-2 ring-white"
                    />
                  </div>
                  <div className="mt-6 px-0.5">
                    <p className="truncate text-body font-medium text-foreground">
                      {person?.displayName || `@${connection.requesterHandle}`}
                    </p>
                    <p className="mt-1 truncate text-body-sm text-muted">Wants to connect with you</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/** Compact — pending incoming requests. Same shell as ConnectionsCard, distinct from the marketing-hero HandshakesRail. */
export function HandshakesCard({ incoming }: { incoming: ConnectionRecord[] }) {
  return (
    <article className={GLOW_CARD}>
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WidgetIcon>
            <IconHandshake className="h-4 w-4" />
          </WidgetIcon>
          <h2 className="vael-h4">Handshakes</h2>
        </div>
        <CornerLink to={`${PRODUCT_HOME}/connections`} />
      </div>
      {incoming.length === 0 ? (
        <p className="relative mt-5 text-body-sm text-muted">No pending requests. Your matches will appear here.</p>
      ) : (
        <ul className="relative mt-4 space-y-3">
          {incoming.slice(0, 3).map((connection) => {
            const person = getProfile(connection.requesterHandle);
            return (
              <li key={connection.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    name={person?.displayName || connection.requesterHandle}
                    src={person?.avatarUrl}
                    size="sm"
                    className="ring-2 ring-[#FFC555]/30"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-medium">{person?.displayName || `@${connection.requesterHandle}`}</p>
                    <p className="truncate text-body-sm text-muted">Wants to connect</p>
                  </div>
                </div>
                <GhostLink to={`${PRODUCT_HOME}/connections/${connection.id}`}>Review</GhostLink>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

export function ConnectionsCard({ handle, connected }: { handle: string; connected: ConnectionRecord[] }) {
  const rows = connected.map((connection) => {
    const other = connection.requesterHandle === handle ? connection.counterpartHandle : connection.requesterHandle;
    return { connection, other, profile: getProfile(other) };
  });
  return (
    <article className={GLOW_CARD}>
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WidgetIcon>
            <IconUsers className="h-4 w-4" />
          </WidgetIcon>
          <h2 className="vael-h4">Connections</h2>
        </div>
        <CornerLink to={`${PRODUCT_HOME}/connections`} />
      </div>
      {rows.length === 0 ? (
        <p className="relative mt-5 text-body-sm text-muted">No connections yet. Accept a Handshake to start building your network.</p>
      ) : (
        <ul className="relative mt-4 space-y-3">
          {rows.slice(0, 3).map(({ connection, other, profile }) => (
            <li key={connection.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={profile?.displayName || other} src={profile?.avatarUrl} size="sm" className="ring-2 ring-[#FFC555]/30" />
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-medium">{profile?.displayName || `@${other}`}</p>
                  <p className="truncate text-body-sm text-muted">{profile?.headline || "Connected"}</p>
                </div>
              </div>
              <GhostLink to={`${PRODUCT_HOME}/connections/${connection.id}`}>View</GhostLink>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function ConversationsCard({
  handle,
  connected,
  lastMessage,
}: {
  handle: string;
  connected: ConnectionRecord[];
  lastMessage: (connectionId: string) => ThreadMessage | undefined;
}) {
  const recent = connected
    .map((connection) => {
      const other = connection.requesterHandle === handle ? connection.counterpartHandle : connection.requesterHandle;
      const last = lastMessage(connection.id);
      return { connection, other, last };
    })
    .sort((a, b) => Date.parse(b.last?.createdAt ?? "0") - Date.parse(a.last?.createdAt ?? "0"))
    .slice(0, 2);

  return (
    <article className={GLOW_CARD}>
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WidgetIcon>
            <IconMessage className="h-4 w-4" />
          </WidgetIcon>
          <h2 className="vael-h4">Conversations</h2>
        </div>
        <CornerLink to="/messages" />
      </div>
      {recent.length === 0 ? (
        <p className="relative mt-5 text-body-sm text-muted">A thread opens after both people accept a Handshake.</p>
      ) : (
        <ul className="relative mt-4 space-y-3">
          {recent.map(({ connection, other, last }) => {
            const person = getProfile(other);
            return (
              <li key={connection.id}>
                <Link to={`${PRODUCT_HOME}/connections/${connection.id}`} className="flex min-w-0 items-center gap-3">
                  <Avatar name={person?.displayName || other} src={person?.avatarUrl} size="sm" className="ring-2 ring-[#FFC555]/30" />
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium">{person?.displayName || `@${other}`}</p>
                    <p className="mt-0.5 truncate text-body-sm text-muted">{last?.body ? `“${last.body}”` : "Open conversation"}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

const POST_KIND_ICON: Record<CommunityPostKind, typeof IconEdit> = {
  update: IconEdit,
  opportunity: IconBriefcase,
  "looking-for": IconUsers,
  offering: IconUsers,
  collaboration: IconHash,
  discussion: IconMessageCircle,
};

/** Same card language as the Community feed (kind chip, author, snippet) so the dashboard preview matches. */
function CommunityPostPreviewCard({ view }: { view: CommunityPostView }) {
  const { post } = view;
  const author = resolveCommunityAuthor(post.handle, post.districtId);
  const kind = communityPostKind(post);
  const kindLabel = kind === "collaboration" ? "Highlight" : communityPostKindLabel(kind);
  const KindIcon = POST_KIND_ICON[kind];
  const districtLabel = communityDistrictLabel(post.districtId);
  return (
    <Link
      to={`/feed/${post.id}`}
      className="group flex w-[22rem] shrink-0 snap-start flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-10px_rgba(17,17,17,0.1)] motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:border-[#C99A28]/30 hover:shadow-[0_1px_2px_rgba(11,12,12,0.06),0_20px_36px_-12px_rgba(17,17,17,0.18)] sm:w-96 dark:border-white/10 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.06] dark:via-white/[0.02] dark:to-transparent dark:backdrop-blur-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:border-accent/30 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.2),0_20px_40px_-12px_rgba(255,157,69,0.2)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-caption font-medium text-muted">{districtLabel}</span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFC555]/15 px-2.5 py-1 text-caption font-semibold text-[#C99A28] dark:bg-accent/15 dark:text-accent">
          <KindIcon className="h-3.5 w-3.5" aria-hidden />
          {kindLabel}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <Avatar name={author.name} src={author.avatarUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-body-sm font-medium text-foreground">{author.name}</p>
          <p className="text-caption text-muted">{formatCommunityTime(post.createdAt)}</p>
        </div>
      </div>
      {post.title ? (
        <p className="line-clamp-1 text-body-sm font-semibold text-foreground">{post.title}</p>
      ) : null}
      <p className="line-clamp-2 text-body-sm text-muted">{post.body}</p>
      <span className="mt-auto flex items-center gap-1 border-t border-border-subtle pt-3 text-body-sm font-medium text-[#C99A28] motion-safe:transition-colors motion-safe:duration-150 group-hover:text-foreground dark:text-accent">
        Open
        <IconChevronRight className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-150 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function CommunityRail({ posts }: { posts: CommunityPostView[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const recent = posts.slice(0, 3);
  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-h4 font-medium text-foreground">From the Community</p>
          <p className="mt-1 text-body-sm text-muted">Recent posts from across VAEL.</p>
        </div>
        <Link
          to={`${PRODUCT_HOME}/community`}
          className="text-body-sm font-medium text-[#C99A28] underline underline-offset-4 hover:text-foreground dark:text-accent"
        >
          Show all →
        </Link>
      </div>
      <div className="relative mt-6">
        {recent.length === 0 ? (
          <p className={railEmptyClassName}>Nothing being shared across VAEL yet.</p>
        ) : (
          <div ref={railRef} className={`${railScrollClassName} px-1 pb-8 pt-1`}>
            {recent.map((view) => (
              <CommunityPostPreviewCard key={view.post.id} view={view} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export { documentChecklist };

/** A curated, deduplicated read of what actually happened, not a raw event log. */
export function ActivityWidget({ notices }: { notices: LocalNotice[] }) {
  const seen = new Set<string>();
  const recent: LocalNotice[] = [];
  for (const item of [...notices].reverse()) {
    const key = `${item.title}·${item.body}`;
    if (seen.has(key)) continue;
    seen.add(key);
    recent.push(item);
    if (recent.length === 4) break;
  }
  return (
    <article className={GLOW_CARD}>
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WidgetIcon>
            <IconClock className="h-4 w-4" />
          </WidgetIcon>
          <h2 className="vael-h4">Activity</h2>
        </div>
        <CornerLink to="/notifications" />
      </div>
      {recent.length === 0 ? (
        <p className="relative mt-5 text-body-sm text-muted">Handshake and community activity will appear here.</p>
      ) : (
        <ul className="relative mt-4 space-y-3">
          {recent.map((item) => (
            <li key={item.id} className="flex gap-2.5">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C99A28]" />
              <div className="min-w-0">
                <p className="text-body-sm font-medium">{item.title}</p>
                <p className="mt-0.5 truncate text-body-sm text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
