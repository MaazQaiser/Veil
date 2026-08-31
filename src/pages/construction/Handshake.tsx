import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { HandshakeStatus, ProfileCard, MessageThread } from "@/components/vael";
import { ConstructionTradeBadge } from "@/components/construction/ConstructionCards";
import { RequireMember } from "@/components/mt/RequireMember";
import { useConstruction } from "@/lib/constructionCore";
import { CONSTRUCTION_SAMPLE_HANDLES, type ConnectionRecord } from "@/lib/vaelStore";
import type { HandshakeKind } from "@/components/vael/status";

const BASE = "/districts/contractor";

function kindOf(connection: ConnectionRecord, handle: string): HandshakeKind {
  if (connection.blocked) return "blocked";
  if (connection.status === "declined") return "declined";
  if (connection.status === "closed") return "closed";
  if (connection.status === "connected") return "connected";
  if (connection.counterpartHandle === handle && !connection.counterpartAccepted) return "accepted";
  return "pending";
}

export function ConstructionConnectionsPage() {
  return (
    <RequireMember title="Construction Handshakes">
      <ConnectionsInner />
    </RequireMember>
  );
}

function ConnectionsInner() {
  const { myConnections, handle, otherParty } = useConstruction();
  return (
    <CityPage>
      <PageHeader
        kicker="Construction Exchange"
        title="Handshakes"
        description="The same VAEL lock. Full Construction profiles stay closed until both parties accept."
        crumbs={[
          { label: "Construction", href: BASE },
          { label: "Handshakes" },
        ]}
      />
      {myConnections.length === 0 ? (
        <EmptyState
          title="No Handshakes yet"
          description="Request one from a Construction match or profile."
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
                    {item.source === "board_match" ? "From the Construction Board" : "From a Construction profile"}
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

export function ConstructionConnectionDetailPage() {
  return (
    <RequireMember title="Construction Handshake">
      <DetailInner />
    </RequireMember>
  );
}

function DetailInner() {
  const { id } = useParams();
  const cx = useConstruction();
  const connection = id ? cx.connection(id) : undefined;
  const messages = connection ? cx.thread(connection.id) : [];
  const revealed = Boolean(connection && connection.status === "connected" && !connection.blocked);

  useEffect(() => {
    if (revealed && connection) cx.readThread(connection.id, cx.handle);
  }, [connection?.id, revealed, cx.handle, messages.length]);

  if (!connection || (connection.district && connection.district !== "construction")) {
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

  const other = cx.otherParty(connection, cx.handle);
  const kind = kindOf(connection, cx.handle);
  const incoming = kind === "accepted";
  const profile = cx.profile(other);

  return (
    <CityPage>
      <PageHeader
        kicker="Handshake Room"
        title={revealed ? "Private connection" : "Handshake"}
        description={
          revealed
            ? "The Handshake worked. This is now a private Construction connection."
            : "Full Construction profile information becomes available only after both parties accept."
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
            headline={revealed ? profile?.headline ?? "" : "Accept to open the Construction profile."}
            locked={!revealed}
          />
          {revealed && profile ? (
            <div className="space-y-2 text-body-sm">
              {profile.trade ? <ConstructionTradeBadge trade={profile.trade} /> : null}
              <p>{profile.about}</p>
              <p className="text-muted">{profile.serviceArea}</p>
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
              Both sides see Construction profile details and can message. Decline closes the door without a room. This
              prototype cannot complete a Handshake with another real device.
            </Alert>
          )}
        </section>

        <section className="space-y-4">
          {incoming ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => cx.accept(connection.id, cx.handle)}>Accept Handshake</Button>
              <Button variant="outline" onClick={() => cx.decline(connection.id)}>
                Decline
              </Button>
            </div>
          ) : null}
          {kind === "pending" ? (
            <div className="space-y-3">
              <p className="text-body-sm text-muted">Waiting for @{other} to accept.</p>
              {CONSTRUCTION_SAMPLE_HANDLES.includes(other as (typeof CONSTRUCTION_SAMPLE_HANDLES)[number]) ? (
                <Button variant="outline" onClick={() => cx.simulateAccept(connection.id, cx.handle)}>
                  Simulate counterpart accept (this device only)
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => cx.decline(connection.id)}>
                Withdraw
              </Button>
            </div>
          ) : null}
          {kind === "connected" ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => cx.close(connection.id)}>
                Close connection
              </Button>
              <Button variant="ghost" onClick={() => cx.block(connection.id)}>
                Block
              </Button>
            </div>
          ) : null}
          <MessageThread
            handle={cx.handle}
            messages={messages}
            enabled={revealed}
            onSend={(body, attachmentName) => cx.send(connection.id, cx.handle, body, attachmentName)}
          />
        </section>
      </div>
    </CityPage>
  );
}
