import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState, ErrorState } from "@/components/ui/feedback";
import { FilterBar, FilterChip } from "@/components/ui/search";
import { Drawer } from "@/components/ui/overlays";
import { Button, buttonClassName } from "@/components/ui/button";
import { IconFilter } from "@/components/ui/icons";
import { CityPage } from "@/components/city/CityShell";
import { MatchPercent } from "@/components/vael/match";
import { HandshakeStatus, ProfileCard } from "@/components/vael";
import { MatchTrustNote } from "@/components/vael/trust";
import { hasPublicDocuments } from "@/lib/profileTrust";
import {
  ConstructionMatchBreakdown,
  ConstructionMatchCard,
  ConstructionProjectSummary,
  ConstructionRequirementCard,
  ConstructionTradeBadge,
} from "@/components/construction/ConstructionCards";
import { RequireMember } from "@/components/mt/RequireMember";
import { useConstruction } from "@/lib/constructionCore";
import { cxCompleteness, hoursLeft, isCxVisible, type RankedConstructionMatch } from "@/lib/constructionStore";
import { matchBands } from "@/lib/tokens";
import type { HandshakeKind } from "@/components/vael/status";

const BASE = "/districts/contractor";

function kindFor(
  open: ReturnType<typeof useConstruction>["openWith"],
  me: string,
  them: string,
): HandshakeKind {
  const conn = open(me, them);
  if (!conn) return "request";
  if (conn.blocked) return "blocked";
  if (conn.status === "declined") return "declined";
  if (conn.status === "closed") return "closed";
  if (conn.status === "connected") return "connected";
  if (conn.counterpartHandle === me && !conn.counterpartAccepted) return "accepted";
  return "pending";
}

export function ConstructionBoardPage() {
  return (
    <RequireMember title="Construction Board">
      <BoardInner />
    </RequireMember>
  );
}

function BoardInner() {
  const { listing, matches, handle } = useConstruction();
  const [band, setBand] = useState<"all" | "strong" | "good" | "possible">("all");
  const [trade, setTrade] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const trades = useMemo(() => Array.from(new Set(matches.map((item) => item.listing.trade))), [matches]);

  const filtered = matches.filter((item) => {
    if (band === "strong" && item.percent < matchBands.strong) return false;
    if (band === "good" && (item.percent < matchBands.good || item.percent >= matchBands.strong)) return false;
    if (band === "possible" && (item.percent < matchBands.possible || item.percent >= matchBands.good)) return false;
    if (trade !== "all" && item.listing.trade !== trade) return false;
    return true;
  });

  const filters = (
    <FilterBar count={filtered.length}>
      {(["all", "strong", "good", "possible"] as const).map((item) => (
        <FilterChip
          key={item}
          label={item === "all" ? "All bands" : item.charAt(0).toUpperCase() + item.slice(1)}
          active={band === item}
          onClick={() => setBand(item)}
        />
      ))}
      <FilterChip label="All trades" active={trade === "all"} onClick={() => setTrade("all")} />
      {trades.map((item) => (
        <FilterChip key={item} label={item} active={trade === item} onClick={() => setTrade(item)} />
      ))}
    </FilterBar>
  );

  return (
    <CityPage width="wide">
      <PageHeader
        kicker="Construction Exchange"
        title="Matching Board"
        description="Percentage fit of available construction work against a construction need. This is not a contractor directory."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Construction", href: BASE },
          { label: "Board" },
        ]}
        primaryAction={
          listing ? (
            <Link to={`${BASE}/vael`} className={buttonClassName({ variant: "outline" })}>
              Edit VAEL
            </Link>
          ) : (
            <Link to={`${BASE}/vael`} className={buttonClassName()}>
              Create VAEL
            </Link>
          )
        }
      />

      {!listing ? (
        <EmptyState
          title="Vael to see matches"
          description="The Board ranks the opposite side of your Construction VAEL."
          action={
            <Link to={`${BASE}/vael`} className={buttonClassName()}>
              Create VAEL
            </Link>
          }
        />
      ) : (
        <>
          <p className="mt-6 text-body-sm text-muted">
            You vaeled {listing.side === "in" ? "in (available for construction work)" : "out (need construction capability)"}.
            Opposite-side VAELs rank below.
          </p>
          <Alert tone="info" title="Construction scoring" className="mt-4">
            Fit uses Construction criteria (trade, job type, capabilities, service area, availability, credentials,
            experience). It does not use Media & Technology weights. Owner has not locked this sibling table.
          </Alert>
          <div className="mt-4 hidden md:block">{filters}</div>
          <div className="mt-4 md:hidden">
            <Button variant="outline" onClick={() => setFiltersOpen(true)}>
              <IconFilter /> Filters
            </Button>
            <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" side="right">
              {filters}
            </Drawer>
          </div>
          {matches.length === 0 ? (
            <EmptyState
              title="No matches yet"
              description="Sample Construction VAELs on this device may have expired, or nothing opposite your side is visible."
              action={
                <Link to={`${BASE}/vael`} className={buttonClassName({ variant: "outline" })}>
                  Edit VAEL
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No matches for these filters"
              description="Clear a band or trade to see more."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setBand("all");
                    setTrade("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {filtered.map((match) => (
                <li key={match.listing.id}>
                  <ConstructionMatchCard
                    match={match}
                    action={
                      <>
                        <Link to={`${BASE}/board/${match.listing.id}`} className={buttonClassName()}>
                          See Match
                        </Link>
                        <HandshakeHint me={handle} them={match.listing.handle} />
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </CityPage>
  );
}

function HandshakeHint({ me, them }: { me: string; them: string }) {
  const { openWith } = useConstruction();
  const kind = kindFor(openWith, me, them);
  if (kind === "request") return null;
  return <HandshakeStatus kind={kind} />;
}

export function ConstructionMatchDetailPage() {
  return (
    <RequireMember title="Construction Match">
      <MatchDetailInner />
    </RequireMember>
  );
}

function MatchDetailInner() {
  const { listingId } = useParams();
  const { listing, matches, handle, handshake, openWith, documents } = useConstruction();
  const match: RankedConstructionMatch | undefined = matches.find((item) => item.listing.id === listingId);
  const other = match?.listing;
  const existing = other ? openWith(handle, other.handle) : undefined;

  if (!listing) {
    return (
      <CityPage>
        <EmptyState
          title="Vael to open a match"
          action={
            <Link to={`${BASE}/vael`} className={buttonClassName()}>
              Create VAEL
            </Link>
          }
        />
      </CityPage>
    );
  }

  if (!other || !isCxVisible(other)) {
    return (
      <CityPage>
        <ErrorState
          title="This match is not visible"
          description="The Construction VAEL may have expired."
          action={
            <Link to={`${BASE}/board`} className={buttonClassName({ variant: "outline" })}>
              Board
            </Link>
          }
        />
      </CityPage>
    );
  }

  const kind = kindFor(openWith, handle, other.handle);
  const locked = kind !== "connected";

  return (
    <CityPage>
      <PageHeader
        kicker="Match"
        title={`${match.percent}% Match`}
        description={`${other.side === "in" ? "Available for construction work" : "Needs construction capability"} · ${other.trade} · ${other.serviceArea}`}
        crumbs={[
          { label: "Board", href: `${BASE}/board` },
          { label: `${match.percent}%` },
        ]}
        actions={<MatchPercent value={match.percent} size="lg" />}
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-6">
          <section>
            <p className="vael-kicker">Why this is a match</p>
            <p className="mt-2 text-caption text-muted">
              Relevance of Construction criteria. Individual percentages are not shown — this sibling engine does not
              expose Framing §8 scores.
            </p>
            <div className="mt-3">
              <ConstructionMatchBreakdown items={match.breakdown.map((item) => ({ label: item.label, relevance: item.relevance }))} />
            </div>
          </section>
          <ConstructionProjectSummary
            jobType={other.jobType}
            timeline={other.timeline || other.availability}
            description={other.description}
          />
          <ConstructionRequirementCard body={other.requirements} />
          <section>
            <p className="vael-kicker">What you know now</p>
            <p className="mt-2 text-body-sm text-muted">
              Handle, side, trade, job type, service area, and match reasons. Contact, rates, and full Construction
              profile stay closed until both parties accept.
            </p>
          </section>
          {kind === "request" ? (
            <Button
              onClick={() =>
                handshake({
                  fromHandle: handle,
                  toHandle: other.handle,
                  source: "board_match",
                  listingId: other.id,
                })
              }
            >
              Request Handshake
            </Button>
          ) : existing ? (
            <Link to={`${BASE}/connections/${existing.id}`} className={buttonClassName()}>
              Open Handshake
            </Link>
          ) : null}
        </div>
        <aside className="space-y-4">
          <ConstructionTradeBadge trade={other.trade} />
          <ProfileCard
            name={locked ? "Hidden until Handshake" : other.handle}
            handle={other.handle}
            headline={other.description}
            locked={locked}
          />
          <HandshakeStatus kind={kind} />
          <MatchTrustNote
            credentialsListed={other.credentials.length > 0}
            documentsListed={hasPublicDocuments(documents(other.handle))}
            listingFilled={cxCompleteness(other) === 1}
            profileHref={`${BASE}/profile/${other.handle}`}
          />
          <p className="text-caption text-muted">
            {other.serviceArea} · {other.availability} · {hoursLeft(other.expiresAt)}h left
          </p>
          <Alert tone="info" title="Sample on this device">
            Counterpart listings are local prototype records. They are not a live market.
          </Alert>
        </aside>
      </div>
    </CityPage>
  );
}
