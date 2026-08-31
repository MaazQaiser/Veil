import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { FilterBar, FilterChip } from "@/components/ui/search";
import { Drawer, Dialog } from "@/components/ui/overlays";
import { Button, buttonClassName } from "@/components/ui/button";
import { IconFilter } from "@/components/ui/icons";
import { CityPage } from "@/components/city/CityShell";
import { MatchPercent, MatchBreakdown } from "@/components/vael/match";
import { HandshakeStatus, ProfileCard } from "@/components/vael";
import { AvailabilityPill } from "@/components/vael/visibility";
import { MatchTrustNote } from "@/components/vael/trust";
import { hasPublicDocuments } from "@/lib/profileTrust";
import { BoardMatchCard, SkillChips } from "@/components/mt/BoardMatchCard";
import { Avatar } from "@/components/ui/avatar";
import { RequireMember } from "@/components/mt/RequireMember";
import { JourneyProgress } from "@/components/city/setup";
import { useVael } from "@/lib/vaelCore";
import { hoursLeft, isLifecycleVisible, listingCompleteness, type RankedMatch } from "@/lib/vaelStore";
import { isListingSaved, toggleSavedListing } from "@/lib/savedMatches";
import { matchBands } from "@/lib/tokens";
import type { HandshakeKind } from "@/components/vael/status";

function kindFor(open: ReturnType<typeof useVael>["openWith"], me: string, them: string): HandshakeKind {
  const conn = open(me, them);
  if (!conn) return "request";
  if (conn.blocked) return "blocked";
  if (conn.status === "declined") return "declined";
  if (conn.status === "closed") return "closed";
  if (conn.status === "connected") return "connected";
  if (conn.counterpartHandle === me && !conn.counterpartAccepted) return "accepted";
  return "pending";
}

export function BoardPage() {
  return (
    <RequireMember title="Your matches">
      <BoardInner />
    </RequireMember>
  );
}

function BoardInner() {
  const { listing, matches, handle } = useVael();
  const [band, setBand] = useState<"all" | "strong" | "good" | "possible">("all");
  const [discipline, setDiscipline] = useState("all");
  const [location, setLocation] = useState("all");
  const [availability, setAvailability] = useState<"all" | "in" | "out">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const disciplines = useMemo(
    () => Array.from(new Set(matches.map((item) => item.listing.discipline))),
    [matches],
  );
  const locations = useMemo(
    () => Array.from(new Set(matches.map((item) => item.listing.location).filter(Boolean))),
    [matches],
  );

  const filtered = matches.filter((item) => {
    if (band === "strong" && item.percent < matchBands.strong) return false;
    if (band === "good" && (item.percent < matchBands.good || item.percent >= matchBands.strong)) return false;
    if (band === "possible" && (item.percent < matchBands.possible || item.percent >= matchBands.good)) return false;
    if (discipline !== "all" && item.listing.discipline !== discipline) return false;
    if (location !== "all" && item.listing.location !== location) return false;
    if (availability !== "all" && item.listing.side !== availability) return false;
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
      <FilterChip label="All disciplines" active={discipline === "all"} onClick={() => setDiscipline("all")} />
      {disciplines.map((item) => (
        <FilterChip key={item} label={item} active={discipline === item} onClick={() => setDiscipline(item)} />
      ))}
      <FilterChip label="All locations" active={location === "all"} onClick={() => setLocation("all")} />
      {locations.map((item) => (
        <FilterChip key={item} label={item} active={location === item} onClick={() => setLocation(item)} />
      ))}
      <FilterChip label="All availability" active={availability === "all"} onClick={() => setAvailability("all")} />
      <FilterChip label="Available" active={availability === "in"} onClick={() => setAvailability("in")} />
      <FilterChip label="Needs someone" active={availability === "out"} onClick={() => setAvailability("out")} />
    </FilterBar>
  );

  return (
    <CityPage width="wide">
      <JourneyProgress step="Matches" />
      <PageHeader
        kicker="Media & Technology"
        title="Your matches"
        description="People whose availability aligns with yours."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Media & Technology", href: "/media-technology" },
          { label: "Matches" },
        ]}
        primaryAction={
          listing ? (
            <Link to="/media-technology/veil/active" className={buttonClassName({ variant: "outline" })}>
              Manage availability
            </Link>
          ) : (
            <Link to="/media-technology/veil?create=1" className={buttonClassName()}>
              Set availability
            </Link>
          )
        }
      />

      {!listing ? (
        <EmptyState
          title="Veil In to see matches"
          description="Matches appear once you are visible this cycle."
          action={
            <Link to="/media-technology/veil?create=1" className={buttonClassName()}>
              Set availability
            </Link>
          }
        />
      ) : (
        <>
          <p className="mt-6 text-body-sm text-muted">
            You veiled {listing.side === "in" ? "in — available" : "out — need someone"}. Matches below are the other side of that signal.
          </p>
          <div className="mt-4 hidden md:block">{filters}</div>
          <div className="mt-4 md:hidden">
            <Button variant="outline" onClick={() => setFiltersOpen(true)}>
              <IconFilter /> Filters
            </Button>
            <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" side="right">
              {filters}
              <Button className="mt-6" onClick={() => setFiltersOpen(false)}>
                Apply
              </Button>
            </Drawer>
          </div>
          {matches.length === 0 ? (
            <EmptyState
              title="No matches yet"
              description="Nothing opposite your availability is visible this cycle."
              action={
                <Link to="/media-technology/veil/active" className={buttonClassName({ variant: "outline" })}>
                  Manage availability
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No matches for these filters"
              description="Clear a band or discipline to see more."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setBand("all");
                    setDiscipline("all");
                    setLocation("all");
                    setAvailability("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {filtered.map((match) => (
                <li key={match.listing.id}>
                  <BoardMatchCard
                    match={match}
                    action={
                      <>
                        <Link to={`/media-technology/board/${match.listing.id}`} className={buttonClassName()}>
                          View match
                        </Link>
                        <Link
                          to={`/media-technology/profile/${match.listing.handle}?from=match`}
                          className={buttonClassName({ variant: "outline" })}
                        >
                          View profile
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
  const { openWith } = useVael();
  const kind = kindFor(openWith, me, them);
  if (kind === "request") return null;
  return <HandshakeStatus kind={kind} />;
}

export function MatchDetailPage() {
  return (
    <RequireMember title="Match">
      <MatchDetailInner />
    </RequireMember>
  );
}

function MatchDetailInner() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { listing, matches, handle, openWith, documents, profile, handshake } = useVael();
  const [askOpen, setAskOpen] = useState(false);
  const [saved, setSaved] = useState(() => (listingId ? isListingSaved(handle, listingId) : false));
  const match: RankedMatch | undefined = matches.find((item) => item.listing.id === listingId);
  const other = match?.listing;
  const existing = other ? openWith(handle, other.handle) : undefined;
  const otherProfile = other ? profile(other.handle) : undefined;

  if (!listing) {
    return (
      <CityPage>
        <EmptyState
          title="Veil to open a match"
          action={
            <Link to="/media-technology/veil?create=1" className={buttonClassName()}>
              Set availability
            </Link>
          }
        />
      </CityPage>
    );
  }

  if (!other || !isLifecycleVisible(other) || !match) {
    return (
      <CityPage>
        <ErrorState
          title="This match is not visible"
          description="Their availability may have ended."
          action={
            <Link to="/matches" className={buttonClassName({ variant: "outline" })}>
              Back to matches
            </Link>
          }
        />
      </CityPage>
    );
  }

  const counterpart = other;
  const kind = kindFor(openWith, handle, counterpart.handle);
  const locked = kind !== "connected";
  const name = otherProfile?.displayName ?? `@${counterpart.handle}`;
  const role = otherProfile?.headline || counterpart.category || counterpart.discipline;
  const remote =
    counterpart.remoteOnsite === "remote" ? "Remote" : counterpart.remoteOnsite === "onsite" ? "On-site" : "Hybrid";
  const connectionHref = existing ? `/media-technology/connections/${existing.id}` : undefined;

  function sendHandshake() {
    const record = handshake({
      fromHandle: handle,
      toHandle: counterpart.handle,
      source: "board_match",
      listingId: counterpart.id,
    });
    setAskOpen(false);
    navigate(`/media-technology/connections/${record.id}`);
  }

  return (
    <CityPage>
      <PageHeader
        title={name}
        description={`${role} · ${match.percent}% match`}
        crumbs={[
          { label: "Matches", href: "/matches" },
          { label: name },
        ]}
        actions={<MatchPercent value={match.percent} size="lg" />}
      />

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Avatar name={name} src={otherProfile?.avatarUrl} size="xl" locked={locked} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <AvailabilityPill side={counterpart.side} />
            <span className="text-caption text-muted">{hoursLeft(counterpart.expiresAt)}h left</span>
          </div>
          <p className="mt-2 text-body-sm text-muted">
            {remote} · {counterpart.location} · {counterpart.timing}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-8">
          <blockquote className="border-l-2 border-accent pl-5 text-body">
            {counterpart.description}
          </blockquote>
          {counterpart.requirements ? (
            <section>
              <p className="vael-kicker">Requirements</p>
              <p className="mt-2 text-body-sm">{counterpart.requirements}</p>
            </section>
          ) : null}
          <SkillChips skills={counterpart.skills} max={8} />
          <section>
            <p className="vael-kicker">Why this match</p>
            <p className="mt-1 text-body-sm text-muted">How each listed criterion scored against your availability.</p>
            <div className="mt-4">
              <MatchBreakdown
                items={match.breakdown
                  .filter((item) => item.applied)
                  .map((item) => ({ label: item.label, score: item.ratio }))}
              />
            </div>
          </section>
          <p className="text-body-sm text-muted">
            Contact, rates, and full bio stay closed until both people accept.
          </p>
          <div className="sticky bottom-4 z-10 flex flex-wrap gap-3 rounded-xl border border-border bg-background/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            {kind === "request" ? (
              <Button onClick={() => setAskOpen(true)}>Request Handshake</Button>
            ) : connectionHref ? (
              <Link to={connectionHref} className={buttonClassName()}>
                {kind === "connected" ? "Open connection" : "View Handshake"}
              </Link>
            ) : null}
            <Button
              variant="outline"
              onClick={() => setSaved(toggleSavedListing(handle, counterpart.id))}
            >
              {saved ? "Saved" : "Save"}
            </Button>
            <Link to="/matches" className={buttonClassName({ variant: "outline" })}>
              Back to matches
            </Link>
          </div>
        </div>
        <aside className="space-y-4">
          <p className="vael-kicker">{locked ? "Limited until Handshake" : "Profile"}</p>
          <ProfileCard
            name={locked ? name : otherProfile?.displayName ?? counterpart.handle}
            handle={counterpart.handle}
            headline={locked ? "Full profile after Handshake" : role}
            locked={locked}
            avatarUrl={otherProfile?.avatarUrl}
            photoLocked={locked}
          />
          <HandshakeStatus kind={kind} />
          <MatchTrustNote
            credentialsListed={counterpart.certifications.length > 0}
            documentsListed={hasPublicDocuments(documents(counterpart.handle))}
            listingFilled={listingCompleteness(counterpart) === 1}
            profileHref={`/media-technology/profile/${counterpart.handle}?from=match`}
          />
        </aside>
      </div>

      <Dialog
        open={askOpen}
        onClose={() => setAskOpen(false)}
        title="Request a Handshake?"
        footer={
          <>
            <Button variant="outline" onClick={() => setAskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendHandshake}>Send Handshake</Button>
          </>
        }
      >
        <p>Send a request to connect with this person. A private connection will open when they accept.</p>
      </Dialog>
    </CityPage>
  );
}

export function HandshakeRequestPage() {
  const { listingId } = useParams();
  return <Navigate to={`/media-technology/board/${listingId ?? ""}`} replace />;
}
