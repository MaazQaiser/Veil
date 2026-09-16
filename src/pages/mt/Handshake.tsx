import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { Avatar } from "@/components/ui/avatar";
import { HandshakeStatus, ProfileCard } from "@/components/vael";
import { SkillChips } from "@/components/mt/BoardMatchCard";
import { RequireMember } from "@/components/mt/RequireMember";
import { IconChevronRight } from "@/components/ui/icons";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVael } from "@/lib/vaelCore";
import { isMtSampleHandle, type ConnectionRecord, type ProfileRecord } from "@/lib/vaelStore";
import { seedDemoConversation } from "@/lib/demoJourney";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/time";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import type { HandshakeKind } from "@/components/vael/status";

function kindOf(connection: ConnectionRecord, handle: string): HandshakeKind {
  if (connection.blocked) return "blocked";
  if (connection.status === "declined") return "declined";
  if (connection.status === "closed") return "closed";
  if (connection.status === "connected") return "connected";
  if (connection.counterpartHandle === handle && !connection.counterpartAccepted) return "accepted";
  return "pending";
}

export function ConnectionsPage() {
  return (
    <RequireMember title="Handshakes">
      <ConnectionsInner />
    </RequireMember>
  );
}

/** The one next action for a connection row, matched to what its detail page actually lets you do. */
function ctaFor(kind: HandshakeKind): { label: string; emphasis: "solid" | "outline" | "ghost" } {
  if (kind === "connected") return { label: "Message", emphasis: "solid" };
  if (kind === "accepted") return { label: "Respond", emphasis: "solid" };
  if (kind === "pending") return { label: "View Request", emphasis: "outline" };
  return { label: "View", emphasis: "ghost" };
}

type HandshakeTab = "connected" | "pending";

/** Same card language as the Matches cards — circle photo, badge row, info, footer CTA. */
function HandshakeCard({
  connection,
  otherHandle,
  otherProfile,
  lastBody,
  lastAt,
  kind,
}: {
  connection: ConnectionRecord;
  otherHandle: string;
  otherProfile: ProfileRecord | undefined;
  lastBody?: string;
  lastAt?: string;
  kind: HandshakeKind;
}) {
  const connected = connection.status === "connected";
  const cta = ctaFor(kind);
  const name = otherProfile?.displayName ?? `@${otherHandle}`;
  const initial = name.trim().charAt(0).toUpperCase() || "V";
  const image = otherProfile?.avatarUrl || otherProfile?.coverUrl;

  return (
    <Link
      to={connected ? `/messages?c=${connection.id}` : `/media-technology/connections/${connection.id}`}
      className="group flex w-80 shrink-0 snap-start flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-10px_rgba(17,17,17,0.1)] motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:border-[#C99A28]/30 hover:shadow-[0_1px_2px_rgba(11,12,12,0.06),0_20px_36px_-12px_rgba(17,17,17,0.18)] dark:border-white/10 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.06] dark:via-white/[0.02] dark:to-transparent dark:backdrop-blur-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:border-accent/30 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.2),0_20px_40px_-12px_rgba(255,157,69,0.2)]"
    >
      {image ? (
        <img src={image} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFC555] text-body font-semibold text-[#0B0C0C] dark:bg-gradient-to-br dark:from-accent-hover dark:to-accent dark:text-[#1A1410] dark:shadow-[0_2px_4px_-1px_rgba(255,138,61,0.4),0_10px_22px_-8px_rgba(255,138,61,0.45)] dark:ring-1 dark:ring-inset dark:ring-white/25">
          {initial}
        </span>
      )}

      <HandshakeStatus kind={kind} />

      <div className="min-w-0">
        <p className="truncate text-body font-medium text-foreground">{name}</p>
        <p className="truncate text-body-sm text-muted">{otherProfile?.headline || "Media & Technology"}</p>
        {lastBody ? (
          <p className="mt-1 line-clamp-1 text-body-sm text-quiet">
            {lastBody}
            {lastAt ? ` · ${relativeTime(lastAt)}` : ""}
          </p>
        ) : (
          <p className="mt-1 text-body-sm text-quiet">No messages yet</p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-end border-t border-border-subtle pt-3">
        <span
          className={cn(
            "flex items-center gap-1 text-body-sm font-medium motion-safe:transition-colors motion-safe:duration-150",
            cta.emphasis === "solid"
              ? "text-[#C99A28] group-hover:text-foreground dark:text-accent"
              : "text-quiet group-hover:text-foreground",
          )}
        >
          {cta.label}
          <IconChevronRight className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-150 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function ConnectionsInner() {
  const { myConnections, handle, otherParty, profile, thread } = useVael();
  const [tab, setTab] = useState<HandshakeTab>("connected");

  const rows = useMemo(
    () =>
      myConnections.map((item) => {
        const other = otherParty(item, handle);
        const otherProfile = profile(other);
        const messages = thread(item.id);
        const last = messages[messages.length - 1];
        const kind = kindOf(item, handle);
        return { item, other, otherProfile, last, kind };
      }),
    [myConnections, handle, otherParty, profile, thread],
  );

  const counts = {
    connected: rows.filter((row) => row.kind === "connected").length,
    pending: rows.filter((row) => row.kind !== "connected").length,
  };

  const filtered = useMemo(
    () => rows.filter((row) => (tab === "connected" ? row.kind === "connected" : row.kind !== "connected")),
    [rows, tab],
  );

  return (
    <CityPage width="full" className="-mt-4 sm:-mt-6">
      <div className="mx-auto w-full max-w-[92rem] px-5 py-12 md:px-6 lg:px-8">
        <Link to={PRODUCT_HOME} className="text-body-sm font-medium text-muted hover:text-foreground">
          ← Back to Dashboard
        </Link>

        <h1 className="mt-4 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-foreground">
          Handshakes
        </h1>
        <p className="mt-2 text-body text-muted">Handshakes and private conversations on this device.</p>

        {myConnections.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No Handshakes yet"
              description="Request a Handshake from a match."
              action={
                <Link to="/media-technology/matches" className={buttonClassName()}>
                  View matches
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-8 overflow-x-auto">
              <Tabs value={tab} onValueChange={(next) => setTab(next as HandshakeTab)} defaultValue="connected">
                <TabsList>
                  <TabsTrigger value="connected">Connected ({counts.connected})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {filtered.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title={tab === "connected" ? "No connected Handshakes" : "No pending Handshakes"}
                  description="Nothing here yet."
                />
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap gap-4">
                {filtered.map((row) => (
                  <HandshakeCard
                    key={row.item.id}
                    connection={row.item}
                    otherHandle={row.other}
                    otherProfile={row.otherProfile}
                    lastBody={row.last?.body}
                    lastAt={row.last?.createdAt}
                    kind={row.kind}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </CityPage>
  );
}

export function ConnectionDetailPage() {
  return (
    <RequireMember title="Connection">
      <DetailInner />
    </RequireMember>
  );
}

function DetailInner() {
  const { id } = useParams();
  const vael = useVael();
  const connection = id ? vael.connection(id) : undefined;
  const messages = connection ? vael.thread(connection.id) : [];

  useEffect(() => {
    if (!connection || connection.status !== "connected") return;
    if (messages.length === 0 && isMtSampleHandle(vael.otherParty(connection, vael.handle))) {
      seedDemoConversation(connection.id);
    }
  }, [connection, messages.length, vael]);

  if (!connection) {
    return (
      <CityPage>
        <ErrorState
          title="Connection not found"
          action={
            <Link to="/media-technology/connections" className={buttonClassName({ variant: "outline" })}>
              Connections
            </Link>
          }
        />
      </CityPage>
    );
  }

  const other = vael.otherParty(connection, vael.handle);
  const kind = kindOf(connection, vael.handle);
  const otherProfile = vael.profile(other);
  const otherName = otherProfile?.displayName ?? `@${other}`;
  const listing = connection.listingId ? vael.listingById(connection.listingId) : undefined;
  const match = listing ? vael.matches.find((item) => item.listing.id === listing.id) : undefined;
  const role = otherProfile?.headline || listing?.category || listing?.discipline || "Media & Technology";
  const docs = vael.documents(other);
  const opportunityHref = listing ? `/media-technology/board/${listing.id}` : "/media-technology/matches";

  if (kind === "pending") {
    return (
      <CityPage width="narrow">
        <PageHeader
          title="Handshake sent"
          description="Your request is waiting for a response."
          crumbs={[
            { label: "Matches", href: "/media-technology/matches" },
            { label: otherName },
          ]}
          actions={<HandshakeStatus kind="pending" />}
        />
        <p className="mt-6 text-body-sm text-muted">No chat yet. A private conversation opens when they accept.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={opportunityHref} className={buttonClassName({ variant: "outline" })}>
            View Opportunity
          </Link>
          <Button variant="ghost" onClick={() => vael.decline(connection.id)}>
            Withdraw Request
          </Button>
          {isMtSampleHandle(other) ? (
            <Button
              variant="outline"
              onClick={() => {
                vael.simulateAccept(connection.id, vael.handle);
                seedDemoConversation(connection.id);
              }}
            >
              Simulate accept
            </Button>
          ) : null}
        </div>
      </CityPage>
    );
  }

  if (kind === "accepted") {
    return (
      <CityPage width="narrow">
        <PageHeader
          title="Handshake request"
          description={`${otherName} asked to connect. Accept to open the private connection.`}
          crumbs={[
            { label: "Matches", href: "/media-technology/matches" },
            { label: otherName },
          ]}
          actions={<HandshakeStatus kind="accepted" />}
        />
        <div className="mt-8">
          <ProfileCard
            name={otherName}
            handle={other}
            headline="Limited until you accept."
            locked
            avatarUrl={otherProfile?.avatarUrl}
            photoLocked
          />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              vael.accept(connection.id, vael.handle);
              if (isMtSampleHandle(other)) seedDemoConversation(connection.id);
            }}
          >
            Accept
          </Button>
          <Button variant="outline" onClick={() => vael.decline(connection.id)}>
            Decline
          </Button>
          <Link to={opportunityHref} className={buttonClassName({ variant: "ghost" })}>
            View Opportunity
          </Link>
        </div>
      </CityPage>
    );
  }

  if (kind === "declined" || kind === "closed" || kind === "blocked") {
    return (
      <CityPage width="narrow">
        <PageHeader
          title={otherName}
          description="This Handshake is not open."
          actions={<HandshakeStatus kind={kind} />}
        />
        <Link to="/media-technology/matches" className={buttonClassName({ className: "mt-8", variant: "outline" })}>
          Back to matches
        </Link>
      </CityPage>
    );
  }

  return (
    <CityPage>
      <PageHeader
        kicker="You're connected"
        title={otherName}
        description={`${role}${match ? ` · ${Math.round(match.percent)}% Match` : ""}`}
        crumbs={[
          { label: "Matches", href: "/media-technology/matches" },
          { label: otherName },
        ]}
        actions={<HandshakeStatus kind="connected" />}
        primaryAction={
          <Link to={`/messages?c=${connection.id}`} className={buttonClassName()}>
            Message
          </Link>
        }
      />

      <p className="mt-6 text-body-sm text-muted">
        Your Handshake was accepted. You can now view the connection and start a private conversation.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Avatar name={otherName} src={otherProfile?.avatarUrl} size="xl" />
        <div>
          <p className="text-body font-medium">{role}</p>
          {listing ? (
            <p className="mt-1 text-body-sm text-muted">
              {listing.discipline} · {listing.location}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-10 space-y-8">
        {otherProfile?.bio ? (
          <section>
            <p className="vael-kicker">About</p>
            <p className="mt-2 max-w-2xl text-body-sm">{otherProfile.bio}</p>
          </section>
        ) : null}
        {otherProfile?.skills.length ? (
          <section>
            <p className="vael-kicker">Skills</p>
            <SkillChips skills={otherProfile.skills} max={12} />
          </section>
        ) : null}
        {otherProfile?.experience ? (
          <section>
            <p className="vael-kicker">Experience</p>
            <p className="mt-2 max-w-2xl text-body-sm">{otherProfile.experience}</p>
          </section>
        ) : null}
        {otherProfile?.portfolio.length ? (
          <section>
            <p className="vael-kicker">Portfolio</p>
            <ul className="mt-2 space-y-1 text-body-sm">
              {otherProfile.portfolio.map((item) => (
                <li key={item.url}>
                  <a href={item.url} className="underline underline-offset-4" target="_blank" rel="noreferrer">
                    {item.label || item.url}
                  </a>
                  {item.note ? <span className="text-muted"> — {item.note}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {docs.length ? (
          <section>
            <p className="vael-kicker">Documents</p>
            <ul className="mt-2 space-y-1 text-body-sm">
              {docs.map((item) => (
                <li key={item.id}>
                  {item.title}
                  <span className="text-muted"> · {item.type}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <Link to={`/media-technology/profile/${other}`} className={buttonClassName({ variant: "outline" })}>
          View full profile
        </Link>
      </div>
    </CityPage>
  );
}
