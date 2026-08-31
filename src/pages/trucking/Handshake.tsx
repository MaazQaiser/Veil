import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { HandshakeStatus, ProfileCard, MessageThread } from "@/components/vael";
import { EquipmentBadge } from "@/components/trucking/TruckingCards";
import { RequireMember } from "@/components/mt/RequireMember";
import { useTrucking } from "@/lib/truckingCore";
import { TRUCKING_SAMPLE_HANDLES, type ConnectionRecord } from "@/lib/vaelStore";
import type { HandshakeKind } from "@/components/vael/status";

const BASE = "/districts/trucking";

function kindOf(connection: ConnectionRecord, handle: string): HandshakeKind {
  if (connection.blocked) return "blocked";
  if (connection.status === "declined") return "declined";
  if (connection.status === "closed") return "closed";
  if (connection.status === "connected") return "connected";
  if (connection.counterpartHandle === handle && !connection.counterpartAccepted) return "accepted";
  return "pending";
}

export function TruckingConnectionsPage() {
  return (
    <RequireMember title="Trucking Handshakes">
      <ConnectionsInner />
    </RequireMember>
  );
}

function ConnectionsInner() {
  const { myConnections, handle, otherParty } = useTrucking();
  return (
    <CityPage>
      <PageHeader
        kicker="Trucking Exchange"
        title="Handshakes"
        description="The same VAEL lock. Full Trucking profiles stay closed until both parties accept."
        crumbs={[
          { label: "Trucking", href: BASE },
          { label: "Handshakes" },
        ]}
      />
      {myConnections.length === 0 ? (
        <EmptyState
          title="No Handshakes yet"
          description="Request one from a Trucking match or profile."
          action={
            <Link to={`${BASE}/board`} className={buttonClassName()}>
              View Matches
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
                    {item.source === "board_match" ? "From the Trucking Board" : "From a Trucking profile"}
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

export function TruckingConnectionDetailPage() {
  return (
    <RequireMember title="Trucking Handshake">
      <DetailInner />
    </RequireMember>
  );
}

function DetailInner() {
  const { id } = useParams();
  const tx = useTrucking();
  const connection = id ? tx.connection(id) : undefined;
  const messages = connection ? tx.thread(connection.id) : [];
  const revealed = Boolean(connection && connection.status === "connected" && !connection.blocked);

  useEffect(() => {
    if (revealed && connection) tx.readThread(connection.id, tx.handle);
  }, [connection?.id, revealed, tx.handle, messages.length]);

  if (!connection || (connection.district && connection.district !== "trucking")) {
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

  const other = tx.otherParty(connection, tx.handle);
  const kind = kindOf(connection, tx.handle);
  const incoming = kind === "accepted";
  const profile = tx.profile(other);
  const listing = connection.listingId ? tx.listingById(connection.listingId) : undefined;

  return (
    <CityPage>
      <PageHeader
        kicker="Handshake Room"
        title={revealed ? "Private connection" : "Handshake"}
        description={
          revealed
            ? "The Handshake worked. This is now a private Trucking connection."
            : "Full Trucking profile information becomes available only after both parties accept."
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
            headline={revealed ? profile?.headline ?? "" : "Accept to open the Trucking profile."}
            locked={!revealed}
          />
          {revealed && profile ? (
            <div className="space-y-2 text-body-sm">
              {profile.equipment ? <EquipmentBadge equipment={profile.equipment} /> : null}
              <p>{profile.about}</p>
              <p className="text-muted">{profile.serviceLanes}</p>
              {listing ? (
                <p className="text-muted">
                  {listing.side === "in" ? "Capacity" : "Load"} · {listing.origin} → {listing.destination} ·{" "}
                  {listing.availability}
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
              Both sides see Trucking profile details, relevant lane context, and can message. Decline closes the door
              without a room. This prototype cannot complete a Handshake with another real device.
            </Alert>
          )}
        </section>

        <section className="space-y-4">
          {incoming ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => tx.accept(connection.id, tx.handle)}>Accept Handshake</Button>
              <Button variant="outline" onClick={() => tx.decline(connection.id)}>
                Decline
              </Button>
            </div>
          ) : null}
          {kind === "pending" ? (
            <div className="space-y-3">
              <p className="text-body-sm text-muted">Waiting for @{other} to accept.</p>
              {TRUCKING_SAMPLE_HANDLES.includes(other as (typeof TRUCKING_SAMPLE_HANDLES)[number]) ? (
                <Button variant="outline" onClick={() => tx.simulateAccept(connection.id, tx.handle)}>
                  Simulate counterpart accept (this device only)
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => tx.decline(connection.id)}>
                Withdraw
              </Button>
            </div>
          ) : null}
          {kind === "connected" ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => tx.close(connection.id)}>
                Close connection
              </Button>
              <Button variant="ghost" onClick={() => tx.block(connection.id)}>
                Block
              </Button>
            </div>
          ) : null}
          <MessageThread
            handle={tx.handle}
            messages={messages}
            enabled={revealed}
            onSend={(body, attachmentName) => tx.send(connection.id, tx.handle, body, attachmentName)}
          />
        </section>
      </div>
    </CityPage>
  );
}
