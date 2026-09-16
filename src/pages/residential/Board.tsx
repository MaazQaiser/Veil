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
  ResidentialLocationSummary,
  ResidentialMatchBreakdown,
  ResidentialMatchCard,
  ResidentialNeedSummary,
  ResidentialServiceBadge,
  ResidentialTimingSummary,
} from "@/components/residential/ResidentialCards";
import { RequireMember } from "@/components/mt/RequireMember";
import { useResidential } from "@/lib/residentialCore";
import { getRxDocuments, hoursLeft, isRxVisible, placeLabel, rxCompleteness, type RankedResidentialMatch } from "@/lib/residentialStore";
import { matchBands } from "@/lib/tokens";
import type { HandshakeKind } from "@/components/vael/status";

const BASE = "/districts/residential";

function kindFor(
  open: ReturnType<typeof useResidential>["openWith"],
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

export function ResidentialBoardPage() {
  return (
    <RequireMember title="Residential Board">
      <BoardInner />
    </RequireMember>
  );
}

function BoardInner() {
  const { listing, matches, handle } = useResidential();
  const [band, setBand] = useState<"all" | "strong" | "good" | "possible">("all");
  const [service, setService] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const services = useMemo(() => Array.from(new Set(matches.map((item) => item.listing.service))), [matches]);

  const filtered = matches.filter((item) => {
    if (band === "strong" && item.percent < matchBands.strong) return false;
    if (band === "good" && (item.percent < matchBands.good || item.percent >= matchBands.strong)) return false;
    if (band === "possible" && (item.percent < matchBands.possible || item.percent >= matchBands.good)) return false;
    if (service !== "all" && item.listing.service !== service) return false;
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
      <FilterChip label="All services" active={service === "all"} onClick={() => setService("all")} />
      {services.map((item) => (
        <FilterChip key={item} label={item} active={service === item} onClick={() => setService(item)} />
      ))}
    </FilterBar>
  );

  return (
    <CityPage width="wide">
      <PageHeader
        kicker="Residential"
        title="Matching Board"
        description="Who is available and relevant to your need. This is not a list of ads."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Residential", href: BASE },
          { label: "Board" },
        ]}
        primaryAction={
          listing ? (
            <Link to={`${BASE}/vael`} className={buttonClassName({ variant: "outline" })}>
              Update need
            </Link>
          ) : (
            <Link to={`${BASE}/vael`} className={buttonClassName()}>
              Post a Need
            </Link>
          )
        }
      />

      {!listing ? (
        <EmptyState
          title="Post a need to see matches"
          description="The Board ranks people available for the opposite side of your request."
          action={
            <Link to={`${BASE}/vael`} className={buttonClassName()}>
              Post a Need
            </Link>
          }
        />
      ) : (
        <>
          <p className="mt-6 text-body-sm text-muted">
            {listing.side === "out"
              ? `You need ${listing.service} in ${listing.area}. Available people rank below.`
              : `You are available for ${listing.service} in ${listing.area}. Homeowner needs rank below.`}
          </p>
          <Alert tone="info" title="Residential scoring" className="mt-4">
            Fit uses Residential criteria (service, location, timing, capability, experience). It does not use Media
            & Technology, Construction, or Trucking weights. Owner has not locked this sibling table.
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
              description="Sample Residential listings on this device may have expired, or nothing opposite your side is visible."
              action={
                <Link to={`${BASE}/vael`} className={buttonClassName({ variant: "outline" })}>
                  Edit VAEL
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No matches for these filters"
              description="Clear a band or service filter to see more."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setBand("all");
                    setService("all");
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
                  <ResidentialMatchCard
                    match={match}
                    viewerSide={listing.side}
                    action={
                      <>
                        <Link to={`${BASE}/board/${match.listing.id}`} className={buttonClassName()}>
                          View Match
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
  const { openWith } = useResidential();
  const kind = kindFor(openWith, me, them);
  if (kind === "request") return null;
  return <HandshakeStatus kind={kind} />;
}

export function ResidentialMatchDetailPage() {
  return (
    <RequireMember title="Residential Match">
      <MatchDetailInner />
    </RequireMember>
  );
}

function MatchDetailInner() {
  const { listingId } = useParams();
  const { listing, matches, handle, handshake, openWith, profile } = useResidential();
  const match: RankedResidentialMatch | undefined = matches.find((item) => item.listing.id === listingId);
  const other = match?.listing;
  const existing = other ? openWith(handle, other.handle) : undefined;
  const otherProfile = other ? profile(other.handle) : undefined;
  const docs = other ? getRxDocuments(other.handle) : [];

  if (!listing) {
    return (
      <CityPage>
        <EmptyState
          title="Post a need to open a match"
          action={
            <Link to={`${BASE}/vael`} className={buttonClassName()}>
              Post a Need
            </Link>
          }
        />
      </CityPage>
    );
  }

  if (!other || !isRxVisible(other)) {
    return (
      <CityPage>
        <ErrorState
          title="This match is not visible"
          description="The Residential VAEL may have expired."
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
        description={
          other.side === "in"
            ? `${otherProfile?.displayName ? "" : "@"}${other.handle} · ${other.service} · ${placeLabel(other.area, other.postalCode)}`
            : `Needs ${other.service} · ${placeLabel(other.area, other.postalCode)}`
        }
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
              Relevance of Residential criteria. Individual percentages are not shown.
            </p>
            <div className="mt-3">
              <ResidentialMatchBreakdown items={match.breakdown.map((item) => ({ label: item.label, relevance: item.relevance }))} />
            </div>
          </section>
          <ResidentialNeedSummary side={other.side} service={other.service} description={other.description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <ResidentialLocationSummary area={other.area} postalCode={other.postalCode} />
            <ResidentialTimingSummary availability={other.availability} />
          </div>
          <section>
            <p className="vael-kicker">What you know now</p>
            <p className="mt-2 text-body-sm text-muted">
              Handle, service, area, timing, and match reasons. Contact, rates, and full provider details stay closed
              until both parties accept.
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
          <ResidentialServiceBadge service={other.service} />
          <ProfileCard
            name={locked ? "Hidden until Handshake" : otherProfile?.displayName ?? other.handle}
            handle={other.handle}
            headline={other.description}
            locked={locked}
          />
          <HandshakeStatus kind={kind} />
          <MatchTrustNote
            credentialsListed={other.credentials.length > 0}
            documentsListed={hasPublicDocuments(docs)}
            listingFilled={rxCompleteness(other) === 1}
            profileHref={`${BASE}/profile/${other.handle}`}
          />
          <p className="text-caption text-muted">
            {placeLabel(other.area, other.postalCode)} · {other.availability} · {hoursLeft(other.expiresAt)}h left
          </p>
          <Alert tone="info" title="Sample on this device">
            Counterpart listings are local prototype records. They are not a live market.
          </Alert>
        </aside>
      </div>
    </CityPage>
  );
}
