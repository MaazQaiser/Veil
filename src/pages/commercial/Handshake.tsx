import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { HandshakeStatus, ProfileCard, MessageThread } from "@/components/vael";
import { CommercialCapabilityBadge } from "@/components/commercial/CommercialCards";
import { RequireMember } from "@/components/mt/RequireMember";
import { useCommercial } from "@/lib/commercialCore";
import { COMMERCIAL_SAMPLE_HANDLES, type ConnectionRecord } from "@/lib/vaelStore";
import type { HandshakeKind } from "@/components/vael/status";

const BASE = "/districts/commercial";

function kindOf(connection: ConnectionRecord, handle: string): HandshakeKind {
  if (connection.blocked) return "blocked";
  if (connection.status === "declined") return "declined";
  if (connection.status === "closed") return "closed";
  if (connection.status === "connected") return "connected";
  if (connection.counterpartHandle === handle && !connection.counterpartAccepted) return "accepted";
  return "pending";
}

export function CommercialConnectionsPage() {
  return (
    <RequireMember title="Commercial Handshakes">
      <ConnectionsInner />
    </RequireMember>
  );
}

function ConnectionsInner() {
  const { myConnections, handle, otherParty } = useCommercial();
  return (
    <CityPage>
      <PageHeader
        kicker="Commercial"
        title="Handshakes"
        description="The same VAEL lock. Company details stay closed until both parties accept."
        crumbs={[
          { label: "Commercial", href: BASE },
          { label: "Handshakes" },
        ]}
      />
      {myConnections.length === 0 ? (
        <EmptyState
          title="No Handshakes yet"
          description="Request one from a Commercial match or profile."
          action={
            <Link to={`${BASE}/board`} className={buttonClassName()}>
              Find Matches
            </Link>
          }
        />
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {myConnections.map((item) => {
            const other = otherParty(item, handle);
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-body-sm font-semibold">@{other}</p>
                  <p className="text-caption text-muted">
                    {item.source === "board_match" ? "From the Commercial Board" : "From a Commercial profile"}
                  </p>
                </div>
                <HandshakeStatus kind={kindOf(item, handle)} />
                <Link to={`${BASE}/connections/${item.id}`} className={buttonClassName({ size: "sm", variant: "outline" })}>
                  Open Handshake
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </CityPage>
  );
}

export function CommercialConnectionDetailPage() {
  return (
    <RequireMember title="Commercial Handshake">
      <DetailInner />
    </RequireMember>
  );
}

function DetailInner() {
  const { id } = useParams();
  const cm = useCommercial();
  const connection = id ? cm.connection(id) : undefined;
  const messages = connection ? cm.thread(connection.id) : [];
  const revealed = Boolean(connection && connection.status === "connected" && !connection.blocked);

  useEffect(() => {
    if (revealed && connection) cm.readThread(connection.id, cm.handle);
  }, [connection?.id, revealed, cm.handle, messages.length]);

  if (!connection || (connection.district && connection.district !== "commercial")) {
    return (
      <CityPage>
        <ErrorState
          title="Handshake not found"
          action={
            <Link to={`${BASE}/connections`} className={buttonClassName({ variant: "outline" })}>
              Handshakes
            </Link>
          }
        />
      </CityPage>
    );
  }

  const other = cm.otherParty(connection, cm.handle);
  const kind = kindOf(connection, cm.handle);
  const incoming = kind === "accepted";
  const profile = cm.profile(other);
  const listing = connection.listingId ? cm.listingById(connection.listingId) : undefined;
  const mine = cm.listing;
  const docs = revealed ? cm.documents(other) : [];

  return (
    <CityPage>
      <PageHeader
        kicker="Handshake Room"
        title={revealed ? "Private connection" : "Handshake"}
        description={
          revealed
            ? "The Handshake worked. You can now see company details and message."
            : "Company information becomes available only after both parties accept."
        }
        crumbs={[
          { label: "Handshakes", href: `${BASE}/connections` },
          { label: `@${other}` },
        ]}
        actions={<HandshakeStatus kind={kind} />}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <p className="vael-kicker">Counterpart</p>
          <ProfileCard
            name={revealed ? profile?.displayName ?? other : "Hidden until Handshake"}
            handle={other}
            headline={revealed ? profile?.headline ?? "" : "Accept to open the Commercial profile."}
            locked={!revealed}
          />
          {revealed && profile ? (
            <div className="space-y-2 text-body-sm">
              {profile.capability ? <CommercialCapabilityBadge capability={profile.capability} /> : null}
              <p>{profile.about}</p>
              <p className="text-muted">{profile.area}</p>
              {listing ? (
                <p className="text-muted">
                  {listing.side === "in" ? "Available" : "Needs someone"} · {listing.capability} · {listing.area} ·{" "}
                  {listing.availability}
                  {listing.context ? ` · ${listing.context}` : ""}
                </p>
              ) : null}
              {mine ? (
                <p className="text-muted">
                  Your request: {mine.capability} · {mine.area} · {mine.availability}
                  {mine.context ? ` · ${mine.context}` : ""}
                </p>
              ) : null}
              {docs.length ? (
                <p className="text-muted">
                  Documents now available: {docs.map((doc) => doc.title).join(", ")}
                </p>
              ) : null}
              <p className="text-muted">{profile.rates}</p>
              <p className="text-caption text-muted">
                Connected is not verification. Identity remains Unverified until a real workflow exists.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to={`${BASE}/profile/${other}`} className={buttonClassName({ variant: "outline", size: "sm" })}>
                  Full profile
                </Link>
              </div>
            </div>
          ) : (
            <Alert tone="info" title="What happens if you accept?">
              Both sides see Commercial profile details, the relevant need, and can message. Decline closes the door
              without a room. This prototype cannot complete a Handshake with another real device.
            </Alert>
          )}
        </section>

        <section className="space-y-4">
          {incoming ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => cm.accept(connection.id, cm.handle)}>Accept Handshake</Button>
              <Button variant="outline" onClick={() => cm.decline(connection.id)}>
                Decline
              </Button>
            </div>
          ) : null}
          {kind === "pending" ? (
            <div className="space-y-3">
              <p className="text-body-sm text-muted">Waiting for @{other} to accept.</p>
              {COMMERCIAL_SAMPLE_HANDLES.includes(other as (typeof COMMERCIAL_SAMPLE_HANDLES)[number]) ? (
                <Button variant="outline" onClick={() => cm.simulateAccept(connection.id, cm.handle)}>
                  Simulate counterpart accept (this device only)
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => cm.decline(connection.id)}>
                Withdraw
              </Button>
            </div>
          ) : null}
          {kind === "connected" ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => cm.close(connection.id)}>
                Close connection
              </Button>
              <Button variant="ghost" onClick={() => cm.block(connection.id)}>
                Block
              </Button>
            </div>
          ) : null}
          <MessageThread
            handle={cm.handle}
            messages={messages}
            enabled={revealed}
            onSend={(body, attachmentName) => cm.send(connection.id, cm.handle, body, attachmentName)}
          />
        </section>
      </div>
    </CityPage>
  );
}
