import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { HandshakeStatus, ProfileCard, MessageThread } from "@/components/vael";
import { ResidentialServiceBadge } from "@/components/residential/ResidentialCards";
import { RequireMember } from "@/components/mt/RequireMember";
import { useResidential } from "@/lib/residentialCore";
import { RESIDENTIAL_SAMPLE_HANDLES, type ConnectionRecord } from "@/lib/vaelStore";
import type { HandshakeKind } from "@/components/vael/status";

const BASE = "/districts/residential";

function kindOf(connection: ConnectionRecord, handle: string): HandshakeKind {
  if (connection.blocked) return "blocked";
  if (connection.status === "declined") return "declined";
  if (connection.status === "closed") return "closed";
  if (connection.status === "connected") return "connected";
  if (connection.counterpartHandle === handle && !connection.counterpartAccepted) return "accepted";
  return "pending";
}

export function ResidentialConnectionsPage() {
  return (
    <RequireMember title="Residential Handshakes">
      <ConnectionsInner />
    </RequireMember>
  );
}

function ConnectionsInner() {
  const { myConnections, handle, otherParty } = useResidential();
  return (
    <CityPage>
      <PageHeader
        kicker="Residential"
        title="Handshakes"
        description="The same VAEL lock. Full provider details stay closed until both parties accept."
        crumbs={[
          { label: "Residential", href: BASE },
          { label: "Handshakes" },
        ]}
      />
      {myConnections.length === 0 ? (
        <EmptyState
          title="No Handshakes yet"
          description="Request one from a Residential match or profile."
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
                    {item.source === "board_match" ? "From the Residential Board" : "From a Residential profile"}
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

export function ResidentialConnectionDetailPage() {
  return (
    <RequireMember title="Residential Handshake">
      <DetailInner />
    </RequireMember>
  );
}

function DetailInner() {
  const { id } = useParams();
  const rx = useResidential();
  const connection = id ? rx.connection(id) : undefined;
  const messages = connection ? rx.thread(connection.id) : [];
  const revealed = Boolean(connection && connection.status === "connected" && !connection.blocked);

  useEffect(() => {
    if (revealed && connection) rx.readThread(connection.id, rx.handle);
  }, [connection?.id, revealed, rx.handle, messages.length]);

  if (!connection || (connection.district && connection.district !== "residential")) {
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

  const other = rx.otherParty(connection, rx.handle);
  const kind = kindOf(connection, rx.handle);
  const incoming = kind === "accepted";
  const profile = rx.profile(other);
  const listing = connection.listingId ? rx.listingById(connection.listingId) : undefined;
  const mine = rx.listing;

  return (
    <CityPage>
      <PageHeader
        kicker="Handshake Room"
        title={revealed ? "Private connection" : "Handshake"}
        description={
          revealed
            ? "The Handshake worked. You can now see provider details and message."
            : "Full provider information becomes available only after both parties accept."
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
            headline={revealed ? profile?.headline ?? "" : "Accept to open the Residential profile."}
            locked={!revealed}
          />
          {revealed && profile ? (
            <div className="space-y-2 text-body-sm">
              {profile.service ? <ResidentialServiceBadge service={profile.service} /> : null}
              <p>{profile.about}</p>
              <p className="text-muted">{profile.area}</p>
              {listing ? (
                <p className="text-muted">
                  {listing.side === "in" ? "Available" : "Needs someone"} · {listing.service} · {listing.area} ·{" "}
                  {listing.availability}
                </p>
              ) : null}
              {mine ? (
                <p className="text-muted">
                  Your request: {mine.service} · {mine.area} · {mine.availability}
                </p>
              ) : null}
              <p className="text-muted">{profile.rates}</p>
              <p className="text-caption text-muted">
                Connected is not verification. Identity remains Unverified until a real workflow exists.
              </p>
              <Link to={`${BASE}/profile/${other}`} className={buttonClassName({ variant: "outline", size: "sm" })}>
                Full profile
              </Link>
            </div>
          ) : (
            <Alert tone="info" title="What happens if you accept?">
              Both sides see Residential profile details, the relevant need, and can message. Decline closes the door
              without a room. This prototype cannot complete a Handshake with another real device.
            </Alert>
          )}
        </section>

        <section className="space-y-4">
          {incoming ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => rx.accept(connection.id, rx.handle)}>Accept Handshake</Button>
              <Button variant="outline" onClick={() => rx.decline(connection.id)}>
                Decline
              </Button>
            </div>
          ) : null}
          {kind === "pending" ? (
            <div className="space-y-3">
              <p className="text-body-sm text-muted">Waiting for @{other} to accept.</p>
              {RESIDENTIAL_SAMPLE_HANDLES.includes(other as (typeof RESIDENTIAL_SAMPLE_HANDLES)[number]) ? (
                <Button variant="outline" onClick={() => rx.simulateAccept(connection.id, rx.handle)}>
                  Simulate counterpart accept (this device only)
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => rx.decline(connection.id)}>
                Withdraw
              </Button>
            </div>
          ) : null}
          {kind === "connected" ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => rx.close(connection.id)}>
                Close connection
              </Button>
              <Button variant="ghost" onClick={() => rx.block(connection.id)}>
                Block
              </Button>
            </div>
          ) : null}
          <MessageThread
            handle={rx.handle}
            messages={messages}
            enabled={revealed}
            onSend={(body, attachmentName) => rx.send(connection.id, rx.handle, body, attachmentName)}
          />
        </section>
      </div>
    </CityPage>
  );
}
