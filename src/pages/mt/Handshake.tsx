import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CityPage } from "@/components/city/CityShell";
import { Avatar } from "@/components/ui/avatar";
import { HandshakeStatus, ProfileCard } from "@/components/vael";
import { SkillChips } from "@/components/mt/BoardMatchCard";
import { RequireMember } from "@/components/mt/RequireMember";
import { useVael } from "@/lib/vaelCore";
import { isMtSampleHandle, type ConnectionRecord } from "@/lib/vaelStore";
import { seedDemoConversation } from "@/lib/demoJourney";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/time";
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
    <RequireMember title="Connections">
      <ConnectionsInner />
    </RequireMember>
  );
}

function ConnectionsInner() {
  const { myConnections, handle, otherParty, profile, thread } = useVael();
  return (
    <CityPage>
      <PageHeader
        kicker="Media & Technology"
        title="Connections"
        description="Handshakes and private conversations on this device."
        crumbs={[
          { label: "Media & Technology", href: "/media-technology" },
          { label: "Connections" },
        ]}
      />
      {myConnections.length === 0 ? (
        <EmptyState
          title="No connections yet"
          description="Request a Handshake from a match."
          action={
            <Link to="/matches" className={buttonClassName()}>
              View matches
            </Link>
          }
        />
      ) : (
        <ul className="mt-8 grid gap-4">
          {myConnections.map((item) => {
            const other = otherParty(item, handle);
            const otherProfile = profile(other);
            const messages = thread(item.id);
            const last = messages[messages.length - 1];
            const kind = kindOf(item, handle);
            return (
              <li key={item.id}>
                <Card
                  className={cn(
                    "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
                    item.status === "connected" && "border-accent/40 bg-accent-muted/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={otherProfile?.displayName ?? other} src={otherProfile?.avatarUrl} size="lg" />
                    <div className="min-w-0">
                      <p className="text-body font-medium">{otherProfile?.displayName ?? `@${other}`}</p>
                      <p className="mt-1 text-label text-muted">{otherProfile?.headline || "Media & Technology"}</p>
                      {last ? (
                        <p className="mt-2 truncate text-body-sm text-muted">
                          {last.body}
                          {last.createdAt ? ` · ${relativeTime(last.createdAt)}` : ""}
                        </p>
                      ) : (
                        <p className="mt-2 text-body-sm text-quiet">No messages yet</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <HandshakeStatus kind={kind} />
                    {item.status === "connected" ? (
                      <Link to={`/messages?c=${item.id}`} className={buttonClassName()}>
                        Message
                      </Link>
                    ) : (
                      <Link to={`/media-technology/connections/${item.id}`} className={buttonClassName()}>
                        View Handshake
                      </Link>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
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
  const opportunityHref = listing ? `/media-technology/board/${listing.id}` : "/matches";

  if (kind === "pending") {
    return (
      <CityPage width="narrow">
        <PageHeader
          title="Handshake sent"
          description="Your request is waiting for a response."
          crumbs={[
            { label: "Matches", href: "/matches" },
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
            { label: "Matches", href: "/matches" },
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
        <Link to="/matches" className={buttonClassName({ className: "mt-8", variant: "outline" })}>
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
          { label: "Matches", href: "/matches" },
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
