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
  CommercialCapabilityBadge,
  CommercialContextCard,
  CommercialLocationSummary,
  CommercialMatchBreakdown,
  CommercialMatchCard,
  CommercialNeedSummary,
  CommercialRequirementsCard,
  CommercialTimingSummary,
} from "@/components/commercial/CommercialCards";
import { RequireMember } from "@/components/mt/RequireMember";
import { useCommercial } from "@/lib/commercialCore";
import { cmCompleteness, getCmDocuments, hoursLeft, isCmVisible, type RankedCommercialMatch } from "@/lib/commercialStore";
import { matchBands } from "@/lib/tokens";
import type { HandshakeKind } from "@/components/vael/status";

const BASE = "/districts/commercial";

function kindFor(
  open: ReturnType<typeof useCommercial>["openWith"],
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

export function CommercialBoardPage() {
  return (
    <RequireMember title="Commercial Board">
      <BoardInner />
    </RequireMember>
  );
}

function BoardInner() {
  const { listing, matches, handle } = useCommercial();
  const [band, setBand] = useState<"all" | "strong" | "good" | "possible">("all");
  const [capability, setCapability] = useState("all");
  const [area, setArea] = useState("all");
  const [timing, setTiming] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const capabilities = useMemo(
    () => Array.from(new Set(matches.map((item) => item.listing.capability))),
    [matches],
  );
  const areas = useMemo(() => Array.from(new Set(matches.map((item) => item.listing.area).filter(Boolean))), [matches]);
  const timings = useMemo(
    () => Array.from(new Set(matches.map((item) => item.listing.availability).filter(Boolean))),
    [matches],
  );

  const filtered = matches.filter((item) => {
    if (band === "strong" && item.percent < matchBands.strong) return false;
    if (band === "good" && (item.percent < matchBands.good || item.percent >= matchBands.strong)) return false;
    if (band === "possible" && (item.percent < matchBands.possible || item.percent >= matchBands.good)) return false;
    if (capability !== "all" && item.listing.capability !== capability) return false;
    if (area !== "all" && item.listing.area !== area) return false;
    if (timing !== "all" && item.listing.availability !== timing) return false;
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
      <FilterChip label="All capabilities" active={capability === "all"} onClick={() => setCapability("all")} />
      {capabilities.map((item) => (
        <FilterChip key={item} label={item} active={capability === item} onClick={() => setCapability(item)} />
      ))}
      <FilterChip label="All locations" active={area === "all"} onClick={() => setArea("all")} />
      {areas.map((item) => (
        <FilterChip key={item} label={item} active={area === item} onClick={() => setArea(item)} />
      ))}
      <FilterChip label="Any timing" active={timing === "all"} onClick={() => setTiming("all")} />
      {timings.map((item) => (
        <FilterChip key={item} label={item} active={timing === item} onClick={() => setTiming(item)} />
      ))}
    </FilterBar>
  );

  return (
    <CityPage width="wide">
      <PageHeader
        kicker="Commercial"
        title="Matching Board"
        description="Who can fulfill this business need, and why they are relevant. This is not a company directory."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Commercial", href: BASE },
          { label: "Board" },
        ]}
        primaryAction={
          listing ? (
            <Link to={`${BASE}/veil`} className={buttonClassName({ variant: "outline" })}>
              Update need
            </Link>
          ) : (
            <Link to={`${BASE}/veil`} className={buttonClassName()}>
              Create a Need
            </Link>
          )
        }
      />

      {!listing ? (
        <EmptyState
          title="Create a need to see matches"
          description="The Board ranks companies and providers on the opposite side of your request."
          action={
            <Link to={`${BASE}/veil`} className={buttonClassName()}>
              Create a Need
            </Link>
          }
        />
      ) : (
        <>
          <p className="mt-6 text-body-sm text-muted">
            {listing.side === "out"
              ? `You need ${listing.capability} in ${listing.area}. Available companies and providers rank below.`
              : `You can fulfill ${listing.capability} in ${listing.area}. Business needs rank below.`}
          </p>
          <Alert tone="info" title="Commercial scoring" className="mt-4">
            Fit uses Commercial criteria (capability, location, timing, requirements, experience). It does not use Media
            & Technology, Construction, Trucking, or Residential weights. Owner has not locked this sibling table.
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
              description="Sample Commercial listings on this device may have expired, or nothing opposite your side is visible."
              action={
                <Link to={`${BASE}/veil`} className={buttonClassName({ variant: "outline" })}>
                  Edit VAEL
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No matches for these filters"
              description="Clear a band, capability, location, or timing filter to see more."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setBand("all");
                    setCapability("all");
                    setArea("all");
                    setTiming("all");
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
                  <CommercialMatchCard
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
  const { openWith } = useCommercial();
  const kind = kindFor(openWith, me, them);
  if (kind === "request") return null;
  return <HandshakeStatus kind={kind} />;
}

export function CommercialMatchDetailPage() {
  return (
    <RequireMember title="Commercial Match">
      <MatchDetailInner />
    </RequireMember>
  );
}

function MatchDetailInner() {
  const { listingId } = useParams();
  const { listing, matches, handle, handshake, openWith, profile } = useCommercial();
  const match: RankedCommercialMatch | undefined = matches.find((item) => item.listing.id === listingId);
  const other = match?.listing;
  const existing = other ? openWith(handle, other.handle) : undefined;
  const otherProfile = other ? profile(other.handle) : undefined;
  const docs = other ? getCmDocuments(other.handle) : [];

  if (!listing) {
    return (
      <CityPage>
        <EmptyState
          title="Create a need to open a match"
          action={
            <Link to={`${BASE}/veil`} className={buttonClassName()}>
              Create a Need
            </Link>
          }
        />
      </CityPage>
    );
  }

  if (!other || !isCmVisible(other)) {
    return (
      <CityPage>
        <ErrorState
          title="This match is not visible"
          description="The Commercial VAEL may have expired."
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
  const documentsListed = hasPublicDocuments(docs);

  return (
    <CityPage>
      <PageHeader
        kicker="Match"
        title={`${match.percent}% Match`}
        description={
          other.side === "in"
            ? `${otherProfile?.displayName ?? `@${other.handle}`} · ${other.capability} · ${other.area}`
            : `Needs ${other.capability} · ${other.area}`
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
              Relevance of Commercial criteria. Individual percentages are not shown.
            </p>
            <div className="mt-3">
              <CommercialMatchBreakdown
                items={match.breakdown.map((item) => ({ label: item.label, relevance: item.relevance }))}
              />
            </div>
          </section>
          <CommercialNeedSummary
            side={other.side}
            capability={other.capability}
            context={other.context}
            description={other.description}
          />
          <CommercialContextCard context={other.context} />
          <div className="grid gap-4 sm:grid-cols-2">
            <CommercialLocationSummary area={other.area} />
            <CommercialTimingSummary availability={other.availability} />
          </div>
          <CommercialRequirementsCard requirements={other.requirements} />
          <section>
            <p className="vael-kicker">What you know now</p>
            <p className="mt-2 text-body-sm text-muted">
              Company or handle, capability, location, timing, requirements, and match reasons. Contact, rates, and
              private documents stay closed until both parties accept.
            </p>
          </section>
          <section>
            <p className="vael-kicker">What happens next</p>
            <p className="mt-2 text-body-sm text-muted">
              Request Handshake. If they accept, the connection opens and you can start a conversation.
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
          <CommercialCapabilityBadge capability={other.capability} />
          <ProfileCard
            name={locked ? "Hidden until Handshake" : otherProfile?.displayName ?? other.handle}
            handle={other.handle}
            headline={other.description}
            locked={locked}
          />
          <HandshakeStatus kind={kind} />
          <MatchTrustNote
            credentialsListed={other.credentials.length > 0}
            documentsListed={documentsListed}
            listingFilled={cmCompleteness(other) === 1}
            profileHref={`${BASE}/profile/${other.handle}`}
          />
          <p className="text-caption text-muted">
            {other.area} · {other.availability} · {hoursLeft(other.expiresAt)}h left
          </p>
          <Alert tone="info" title="Sample on this device">
            Counterpart listings are local prototype records. They are not a live market.
          </Alert>
        </aside>
      </div>
    </CityPage>
  );
}
