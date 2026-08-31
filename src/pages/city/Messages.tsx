import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { RequireMember } from "@/components/mt/RequireMember";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/headers";
import { FilterChip, SearchInput } from "@/components/ui/search";
import { MessageThread } from "@/components/vael";
import { useCommercial } from "@/lib/commercialCore";
import { useConstruction } from "@/lib/constructionCore";
import { cn } from "@/lib/cn";
import { useResidential } from "@/lib/residentialCore";
import { relativeTime } from "@/lib/time";
import { useTrucking } from "@/lib/truckingCore";
import { useVael } from "@/lib/vaelCore";
import { connectionDistrict, connectionHref, type ConnectionRecord } from "@/lib/vaelStore";

type InboxTab = "all" | "unread" | "connections";

export function MessagesPage() {
  return (
    <RequireMember title="Messages">
      <MessagesInner />
    </RequireMember>
  );
}

function MessagesInner() {
  const mt = useVael();
  const cx = useConstruction();
  const tx = useTrucking();
  const rx = useResidential();
  const cm = useCommercial();
  const handle = mt.handle || cx.handle || tx.handle || rx.handle || cm.handle;
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<InboxTab>("all");
  const selectedId = params.get("c");

  const rooms = useMemo(() => {
    const all = [...mt.myConnections, ...cx.myConnections, ...tx.myConnections, ...rx.myConnections, ...cm.myConnections];
    const seen = new Set<string>();
    return all.filter((item) => {
      if (item.status !== "connected" || item.blocked) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [mt.myConnections, cx.myConnections, tx.myConnections, rx.myConnections, cm.myConnections]);

  const rows = rooms.map((item) => {
    const other = mt.otherParty(item, handle);
    const profile = mt.profile(other);
    const messages = mt.thread(item.id);
    const last = messages[messages.length - 1];
    const unread = messages.filter((msg) => !msg.readBy.includes(handle)).length;
    const listing = item.listingId ? mt.listingById(item.listingId) : undefined;
    const match = listing ? mt.matches.find((entry) => entry.listing.id === listing.id) : undefined;
    return {
      item,
      other,
      name: profile?.displayName ?? `@${other}`,
      role: profile?.headline || listing?.category || listing?.discipline || "Connected",
      percent: match?.percent,
      last,
      unread,
    };
  });

  const searched = rows.filter((row) => {
    if (!query.trim()) return true;
    const hay = `${row.name} ${row.role} ${row.last?.body ?? ""} ${row.other}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  const visible = searched
    .filter((row) => (tab === "unread" ? row.unread > 0 : true))
    .sort((a, b) => {
      if (tab === "connections") return a.name.localeCompare(b.name);
      const aTime = a.last ? Date.parse(a.last.createdAt) : Date.parse(a.item.createdAt);
      const bTime = b.last ? Date.parse(b.last.createdAt) : Date.parse(b.item.createdAt);
      return bTime - aTime;
    });

  const selected = visible.find((row) => row.item.id === selectedId) ?? rows.find((row) => row.item.id === selectedId);

  useEffect(() => {
    if (selected && handle) mt.readThread(selected.item.id, handle);
  }, [selected?.item.id, handle, mt, selected?.last?.id]);

  function select(id: string) {
    const next = new URLSearchParams(params);
    next.set("c", id);
    setParams(next, { replace: true });
  }

  return (
    <CityPage width="wide">
      <PageHeader
        title="Messages"
        description="Your private conversations and connections."
        actions={
          <div className="w-full max-w-xs">
            <SearchInput
              id="messages-search"
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        }
      />

      {rooms.length === 0 ? (
        <EmptyState
          title="No private conversations yet"
          description="A thread opens after a Handshake is accepted. You cannot message from a match."
          action={
            <Link to="/matches" className={buttonClassName()}>
              View matches
            </Link>
          }
        />
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            <FilterChip label="All" active={tab === "all"} onClick={() => setTab("all")} />
            <FilterChip label="Unread" active={tab === "unread"} onClick={() => setTab("unread")} />
            <FilterChip label="Connections" active={tab === "connections"} onClick={() => setTab("connections")} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
            <ul className="divide-y divide-border-subtle rounded-xl border border-border bg-surface">
              {visible.length === 0 ? (
                <li className="px-4 py-8 text-body-sm text-muted">No conversations match this filter.</li>
              ) : (
                visible.map((row) => (
                  <li key={row.item.id}>
                    <button
                      type="button"
                      onClick={() => select(row.item.id)}
                      className={cn(
                        "flex w-full flex-col gap-1 px-4 py-4 text-left hover:bg-surface-muted",
                        selected?.item.id === row.item.id && "bg-surface-muted",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-body-sm font-medium">{row.name}</span>
                        <span className="shrink-0 text-caption text-quiet">
                          {row.last ? relativeTime(row.last.createdAt) : ""}
                        </span>
                      </span>
                      <span className="truncate text-caption text-muted">
                        {row.role}
                        {typeof row.percent === "number" ? ` · ${Math.round(row.percent)}% Match` : ""}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-body-sm text-muted">
                          {row.last?.body || "No messages yet"}
                        </span>
                        {row.unread > 0 ? (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-caption text-background">
                            {row.unread}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>

            <div className="min-h-[22rem] rounded-xl border border-border bg-surface p-5 md:p-6">
              {selected ? (
                <ChatPane
                  handle={handle}
                  connection={selected.item}
                  name={selected.name}
                  other={selected.other}
                  percent={selected.percent}
                  messages={mt.thread(selected.item.id)}
                  onSend={(body, attachmentName) => mt.send(selected.item.id, handle, body, attachmentName)}
                />
              ) : (
                <div className="flex h-full min-h-[18rem] flex-col items-center justify-center text-center">
                  <p className="text-body font-medium">Select a conversation</p>
                  <p className="mt-2 max-w-sm text-body-sm text-muted">Your private conversations after a Handshake.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </CityPage>
  );
}

function ChatPane({
  handle,
  connection,
  name,
  other,
  percent,
  messages,
  onSend,
}: {
  handle: string;
  connection: ConnectionRecord;
  name: string;
  other: string;
  percent?: number;
  messages: ReturnType<ReturnType<typeof useVael>["thread"]>;
  onSend: (body: string, attachmentName?: string) => void;
}) {
  const href = connectionHref(connectionDistrict(connection), connection.id);
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <p className="text-body font-medium">{name}</p>
          <p className="mt-1 text-caption text-muted">
            {typeof percent === "number" ? `${Math.round(percent)}% Match · ` : ""}
            Connected
          </p>
        </div>
        <Link to={href} className={buttonClassName({ variant: "outline", size: "sm" })}>
          View connection
        </Link>
      </div>
      <MessageThread handle={handle} messages={messages} enabled onSend={onSend} />
      <p className="mt-3 text-caption text-quiet">
        <Link to={`/media-technology/profile/${other}`} className="underline underline-offset-4">
          View profile
        </Link>
      </p>
    </div>
  );
}
