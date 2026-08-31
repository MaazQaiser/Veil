import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatCommunityTime, type CommunityPostView } from "@/lib/communityStore";
import { documentChecklist } from "@/lib/profileFields";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { relativeTime } from "@/lib/time";
import {
  getProfile,
  type ConnectionRecord,
  type LocalNotice,
  type ProfileDocument,
  type ProfileRecord,
  type RankedMatch,
  type ThreadMessage,
} from "@/lib/vaelStore";

export function HomeWidget({
  title,
  href,
  cta,
  children,
  className,
}: {
  title: string;
  href: string;
  cta: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <h2 className="vael-h4">{title}</h2>
      <div className="mt-5 min-w-0 flex-1">{children}</div>
      <Link to={href} className={buttonClassName({ variant: "outline", className: "mt-6 self-start" })}>
        {cta}
      </Link>
    </Card>
  );
}

export function MatchesWidget({ matches, visible }: { matches: RankedMatch[]; visible: boolean }) {
  const top = matches.slice(0, 3);
  return (
    <HomeWidget title="Your best matches" href="/matches" cta="View all matches →">
      {!visible ? (
        <p className="text-body-sm text-muted">Veil In to see matches.</p>
      ) : top.length === 0 ? (
        <p className="text-body-sm text-muted">No matches yet against your current availability.</p>
      ) : (
        <ul className="space-y-4">
          {top.map((match) => {
            const profile = getProfile(match.listing.handle);
            const role =
              profile?.headline || match.listing.discipline || match.listing.category || profile?.displayName;
            return (
              <li key={match.listing.id}>
                <Link to={`${PRODUCT_HOME}/board/${match.listing.id}`} className="block min-w-0">
                  <p className="text-body font-medium">{Math.round(match.percent)}% Match</p>
                  <p className="mt-0.5 truncate text-body-sm text-muted">{role}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </HomeWidget>
  );
}

export function HandshakesWidget({
  incoming,
  connected,
}: {
  incoming: ConnectionRecord[];
  connected: ConnectionRecord[];
}) {
  const requests = incoming.length;
  const active = connected.length;
  return (
    <HomeWidget title="Handshake activity" href={`${PRODUCT_HOME}/connections`} cta="View Handshakes →">
      {requests === 0 && active === 0 ? (
        <p className="text-body-sm text-muted">
          No Handshakes yet. Your matches will appear here when there's mutual interest.
        </p>
      ) : (
        <ul className="space-y-2 text-body-sm">
          <li>
            {requests} new {requests === 1 ? "request" : "requests"}
          </li>
          <li>
            {active} active {active === 1 ? "connection" : "connections"}
          </li>
        </ul>
      )}
    </HomeWidget>
  );
}

export function MessagesWidget({
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
      const other =
        connection.requesterHandle === handle ? connection.counterpartHandle : connection.requesterHandle;
      const last = lastMessage(connection.id);
      return { connection, other, last };
    })
    .sort((a, b) => Date.parse(b.last?.createdAt ?? "0") - Date.parse(a.last?.createdAt ?? "0"))
    .slice(0, 2);

  return (
    <HomeWidget title="Recent conversations" href="/messages" cta="View messages →">
      {recent.length === 0 ? (
        <p className="text-body-sm text-muted">A thread opens after both people accept a Handshake.</p>
      ) : (
        <ul className="space-y-4">
          {recent.map(({ connection, other, last }) => {
            const person = getProfile(other);
            return (
              <li key={connection.id}>
                <Link to={`${PRODUCT_HOME}/connections/${connection.id}`} className="block min-w-0">
                  <p className="text-body-sm font-medium">{person?.displayName || `@${other}`}</p>
                  <p className="mt-1 truncate text-body-sm text-muted">
                    {last?.body ? `“${last.body}”` : "Open conversation"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </HomeWidget>
  );
}

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
  const discipline = profile?.headline || profile?.disciplines[0];
  return (
    <HomeWidget title="Your profile" href={`${PRODUCT_HOME}/profile/${handle}`} cta="View profile →">
      <div className="flex items-center gap-3">
        <Avatar name={name} src={profile?.avatarUrl} size="lg" />
        <div className="min-w-0">
          <p className="text-body font-medium truncate">{name}</p>
          {discipline ? <p className="mt-0.5 truncate text-body-sm text-muted">{discipline}</p> : null}
          {profile?.location ? <p className="truncate text-body-sm text-muted">{profile.location}</p> : null}
        </div>
      </div>
      <p className="mt-5 text-body-sm">
        <span className="font-medium tabular-nums">{percent}% complete</span>
      </p>
    </HomeWidget>
  );
}

export function CommunityWidget({ posts }: { posts: CommunityPostView[] }) {
  return (
    <HomeWidget title="From Media & Technology" href={`${PRODUCT_HOME}/community`} cta="Explore community →">
      {posts.length === 0 ? (
        <p className="text-body-sm text-muted">No posts in Media & Technology yet.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((item) => {
            const author = getProfile(item.post.handle);
            return (
              <li key={item.post.id}>
                <Link to={`/feed/${item.post.id}`} className="block min-w-0">
                  <p className="text-body-sm font-medium">{author?.displayName || `@${item.post.handle}`}</p>
                  <p className="mt-1 line-clamp-2 text-body-sm text-muted">{item.post.body}</p>
                  <p className="mt-1 text-caption text-quiet">{formatCommunityTime(item.post.createdAt)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </HomeWidget>
  );
}

export { documentChecklist };

export function DocumentsWidget({
  handle,
  profile,
  documents,
}: {
  handle: string;
  profile: ProfileRecord | undefined;
  documents: ProfileDocument[];
}) {
  const items = documentChecklist(profile, documents);
  return (
    <HomeWidget title="Your documents" href={`${PRODUCT_HOME}/profile/${handle}/edit`} cta="Manage documents →">
      <ul className="space-y-2 text-body-sm">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className={item.done ? "text-foreground" : "text-muted"} aria-hidden>
              {item.done ? "✓" : "○"}
            </span>
            <span className={item.done ? "text-foreground" : "text-muted"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </HomeWidget>
  );
}

export function ActivityWidget({ notices }: { notices: LocalNotice[] }) {
  const recent = [...notices].reverse().slice(0, 4);
  return (
    <HomeWidget title="Recent activity" href="/notifications" cta="View all activity →">
      {recent.length === 0 ? (
        <p className="text-body-sm text-muted">Handshake and community activity on this device will appear here.</p>
      ) : (
        <ul className="space-y-3">
          {recent.map((item) => (
            <li key={item.id}>
              {item.href ? (
                <Link to={item.href} className="block min-w-0">
                  <p className="text-body-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 truncate text-body-sm text-muted">{item.body}</p>
                  <p className="mt-1 text-caption text-quiet">{relativeTime(item.createdAt)}</p>
                </Link>
              ) : (
                <div>
                  <p className="text-body-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 truncate text-body-sm text-muted">{item.body}</p>
                  <p className="mt-1 text-caption text-quiet">{relativeTime(item.createdAt)}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </HomeWidget>
  );
}
