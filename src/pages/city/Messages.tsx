import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { RequireMember } from "@/components/mt/RequireMember";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Avatar } from "@/components/ui/avatar";
import { IconChevronLeft, IconMessage } from "@/components/ui/icons";
import { FilterChip, SearchInput } from "@/components/ui/search";
import { MessageThread } from "@/components/vael";
import { useCommercial } from "@/lib/commercialCore";
import { useConstruction } from "@/lib/constructionCore";
import { cn } from "@/lib/cn";
import { useResidential } from "@/lib/residentialCore";
import { relativeTime } from "@/lib/time";
import { useTrucking } from "@/lib/truckingCore";
import { useVael } from "@/lib/vaelCore";

type InboxTab = "all" | "unread" | "connections";

export function MessagesPage() {
  return (
    <RequireMember title="Messages">
      <MessagesInner />
    </RequireMember>
  );
}

function BackToMatches() {
  return (
    <Link
      to="/media-technology/matches"
      aria-label="Back to Matches"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-black/5 dark:hover:bg-white/10"
    >
      <IconChevronLeft className="h-5 w-5" />
    </Link>
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
      avatarUrl: profile?.avatarUrl,
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

  const readThread = mt.readThread;
  useEffect(() => {
    if (selected && handle) readThread(selected.item.id, handle);
  }, [selected?.item.id, handle, readThread, selected?.last?.id]);

  function select(id: string) {
    const next = new URLSearchParams(params);
    next.set("c", id);
    setParams(next, { replace: true });
  }

  return (
    <CityPage width="full" className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {rooms.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="flex min-h-[16rem] w-full flex-col border-b border-border lg:min-h-0 lg:w-[22rem] lg:shrink-0 lg:border-b-0 lg:border-r">
            <InboxHeader />
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon={<IconMessage className="h-6 w-6" />}
                title="No conversations"
                description="Threads open here after a Handshake is accepted."
              />
            </div>
          </aside>
          <div className="flex flex-1 items-center justify-center bg-[#F7F5F2] p-6 dark:bg-transparent md:p-10">
            <EmptyState
              icon={<InboxIllustration />}
              title="Your inbox is empty"
              description="You haven't started any conversations yet. Once a Handshake is accepted, you'll find them here."
              action={
                <Link to="/media-technology/matches" className={buttonClassName()}>
                  View matches
                </Link>
              }
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <aside className="flex min-h-0 w-full flex-col border-b border-border lg:w-[22rem] lg:shrink-0 lg:border-b-0 lg:border-r">
            <InboxHeader />
            <div className="space-y-2.5 px-3 py-2">
              <SearchInput
                id="messages-search"
                placeholder="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 rounded-lg"
              />
              <div className="flex flex-wrap gap-1.5">
                <FilterChip label="All" active={tab === "all"} onClick={() => setTab("all")} />
                <FilterChip label="Unread" active={tab === "unread"} onClick={() => setTab("unread")} />
                <FilterChip label="Connections" active={tab === "connections"} onClick={() => setTab("connections")} />
              </div>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {visible.length === 0 ? (
                <li className="px-5 py-8 text-body-sm text-muted">No conversations match this filter.</li>
              ) : (
                visible.map((row) => {
                  const active = selected?.item.id === row.item.id;
                  return (
                    <li key={row.item.id}>
                      <button
                        type="button"
                        onClick={() => select(row.item.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-muted",
                          active && "bg-surface-muted",
                        )}
                      >
                        <Avatar name={row.name} src={row.avatarUrl} size="lg" className="h-12 w-12" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-body-sm font-semibold text-foreground">{row.name}</span>
                            <span className="shrink-0 text-caption text-quiet">
                              {row.last ? relativeTime(row.last.createdAt) : ""}
                            </span>
                          </span>
                          <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="truncate text-caption text-muted">
                              {row.last?.body || "No messages yet"}
                            </span>
                            {row.unread > 0 ? (
                              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#22C55E] px-1.5 text-caption font-medium text-white">
                                {row.unread}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F7F5F2] dark:bg-transparent">
            {selected ? (
              <ChatPane
                handle={handle}
                name={selected.name}
                role={selected.role}
                avatarUrl={selected.avatarUrl}
                messages={mt.thread(selected.item.id)}
                onSend={(body, attachmentName) => mt.send(selected.item.id, handle, body, attachmentName)}
              />
            ) : (
              <div className="flex h-full min-h-[18rem] flex-col items-center justify-center p-6 text-center md:p-8">
                <p className="text-body font-medium">Select a conversation</p>
                <p className="mt-2 max-w-sm text-body-sm text-muted">Your private conversations after a Handshake.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </CityPage>
  );
}

function InboxHeader() {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-2.5">
      <BackToMatches />
      <h1 className="text-h4 font-semibold text-foreground">Messages</h1>
    </div>
  );
}

/** Envelope line-art, matching the site's icon stroke weight, with a VAEL-yellow accent. */
function InboxIllustration() {
  return (
    <svg viewBox="0 0 96 96" fill="none" className="h-16 w-16 text-quiet" aria-hidden>
      <rect x="14" y="26" width="68" height="46" rx="8" stroke="currentColor" strokeWidth="2.25" />
      <path
        d="M18 30l30 24 30-24"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="73" cy="23" r="6" className="fill-[#FFC555] dark:fill-accent" />
    </svg>
  );
}

function ChatPane({
  handle,
  name,
  role,
  avatarUrl,
  messages,
  onSend,
}: {
  handle: string;
  name: string;
  role: string;
  avatarUrl?: string;
  messages: ReturnType<ReturnType<typeof useVael>["thread"]>;
  onSend: (body: string, attachmentName?: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-white px-4 py-2.5 dark:bg-white/[0.04] dark:backdrop-blur-xl">
        <Avatar name={name} src={avatarUrl} size="md" />
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-foreground">{name}</p>
          <p className="truncate text-caption text-muted">{role} · Connected</p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 md:px-6">
        <MessageThread
          handle={handle}
          messages={messages}
          enabled
          compact
          onSend={onSend}
          placeholder="Write a message..."
        />
      </div>
    </div>
  );
}
