import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { FilterBar, FilterChip } from "@/components/ui/search";
import { Drawer, Dialog } from "@/components/ui/overlays";
import { Button, buttonClassName } from "@/components/ui/button";
import { IconCheck, IconChevronLeft, IconChevronRight, IconFilter } from "@/components/ui/icons";
import { CityPage } from "@/components/city/CityShell";
import { HandshakeStatus } from "@/components/vael";
import { ProfileDocumentsSection } from "@/components/vael/trust";
import { BoardMatchCard, SkillChips } from "@/components/mt/BoardMatchCard";
import { DashboardSidebar } from "@/components/mt/DashboardSidebar";
import { Avatar } from "@/components/ui/avatar";
import { RequireMember } from "@/components/mt/RequireMember";
import { JourneyProgress } from "@/components/city/setup";
import { findAccountByHandle } from "@/lib/accounts";
import { useVael } from "@/lib/vaelCore";
import { isLifecycleVisible, type RankedMatch, type VaelListing, type VaelSide } from "@/lib/vaelStore";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { visibilityKindFromListing } from "@/lib/visibilityPlans";
import { isListingSaved, toggleSavedListing } from "@/lib/savedMatches";
import { matchBand, matchBandLabel, matchBands } from "@/lib/tokens";
import { cn } from "@/lib/cn";
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
            <Link to={PRODUCT_HOME} className={buttonClassName({ variant: "outline" })}>
              Manage availability
            </Link>
          ) : (
            <Link to="/media-technology/vael?create=1" className={buttonClassName()}>
              Set availability
            </Link>
          )
        }
      />

      {!listing ? (
        <EmptyState
          title="Vael In to see matches"
          description="Matches appear once you are visible this cycle."
          action={
            <Link to="/media-technology/vael?create=1" className={buttonClassName()}>
              Set availability
            </Link>
          }
        />
      ) : (
        <>
          <p className="mt-6 text-body-sm text-muted">
            You vaeled {listing.side === "in" ? "in — available" : "out — need someone"}. Matches below are the other side of that signal.
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
                <Link to={PRODUCT_HOME} className={buttonClassName({ variant: "outline" })}>
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

/** Short public intro — the rest of About waits until Handshake. */
function aboutPreview(bio: string) {
  const text = bio.trim();
  if (!text) return "No bio listed yet.";
  const sentence = text.match(/^[\s\S]{20,180}?[.!?]/);
  if (sentence) return sentence[0].trim();
  if (text.length <= 180) return text;
  return `${text.slice(0, 180).replace(/\s+\S*$/, "")}…`;
}

/** "Why You Match" — a few matching factors, visible before Handshake. */
function MatchFactors({ mine, counterpart }: { mine: VaelListing; counterpart: VaelListing }) {
  const mySkills = new Set(mine.skills.map((item) => item.toLowerCase()));
  const overlap = counterpart.skills.filter((item) => mySkills.has(item.toLowerCase()));
  const skillsLine = (overlap.length > 0 ? overlap : counterpart.skills.slice(0, 3)).join(" · ");

  const rows: { label: string; value: string }[] = [];
  if (skillsLine) rows.push({ label: "Skills", value: skillsLine });
  if (counterpart.experienceYears) {
    rows.push({ label: "Experience", value: `${counterpart.experienceYears}+ years` });
  }
  rows.push({ label: "District", value: "Media & Technology" });
  rows.push({
    label: "Availability",
    value: counterpart.side === "in" ? "Available now" : "Needs someone",
  });

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-border bg-white px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.03]">
          <dt className="text-caption font-medium uppercase tracking-[0.06em] text-quiet">{row.label}</dt>
          <dd className="mt-1 text-body-sm text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MatchDetailPage() {
  return (
    <RequireMember title="Match">
      <MatchDetailInner />
    </RequireMember>
  );
}

const DASHBOARD_CARD =
  "rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-10px_rgba(17,17,17,0.1)] dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]";

function MatchDetailInner() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const {
    listing,
    latestListing,
    matches,
    myConnections,
    handle,
    signedIn,
    openWith,
    documents,
    profile,
    handshake,
    accept,
    decline,
  } = useVael();
  const mine = signedIn ? profile(handle) : undefined;
  const myDocs = signedIn ? documents(handle) : [];
  const incoming = myConnections.filter(
    (connection) =>
      connection.status === "pending" && connection.counterpartHandle === handle && !connection.counterpartAccepted,
  );
  const kind = visibilityKindFromListing(latestListing);
  const vaeledOut = kind === "out" || ((kind === "in" || kind === "expiring") && latestListing?.side === "out");
  const side: VaelSide = vaeledOut ? "out" : "in";
  const [saved, setSaved] = useState(() => (listingId ? isListingSaved(handle, listingId) : false));
  const match: RankedMatch | undefined = matches.find((item) => item.listing.id === listingId);
  const other = match?.listing;
  const existing = other ? openWith(handle, other.handle) : undefined;
  const otherProfile = other ? profile(other.handle) : undefined;
  const hydrated = useRef(false);

  const [connectionId, setConnectionId] = useState<string | undefined>(existing?.id);
  const [phase, setPhase] = useState<"idle" | "requested" | "incoming" | "connected">("idle");
  const [revealed, setRevealed] = useState(false);
  const [requestedOpen, setRequestedOpen] = useState(false);

  // Returning to a match you already connected with should stay on the full profile —
  // Request Handshake is gone once the Handshake is complete.
  useEffect(() => {
    if (hydrated.current || !existing) return;
    hydrated.current = true;
    setConnectionId(existing.id);
    if (existing.status === "connected") {
      setPhase("connected");
      setRevealed(true);
    } else if (existing.status === "pending") {
      const theyAskedMe = existing.counterpartHandle === handle && !existing.counterpartAccepted;
      setPhase(theyAskedMe ? "incoming" : "requested");
    }
  }, [existing, handle]);

  if (!listing) {
    return (
      <CityPage width="full">
        <div className="flex w-full items-start">
          <DashboardSidebar handle={handle} profile={mine} documents={myDocs} incomingCount={incoming.length} side={side} />
          <div className="min-w-0 flex-1 bg-white px-4 py-8 sm:px-8 lg:px-10 dark:bg-white/[0.02]">
            <EmptyState
              title="Vael to open a match"
              action={
                <Link to={`/media-technology/vael?create=1&side=${side}`} className={buttonClassName()}>
                  {side === "out" ? "Say what you need" : "Set availability"}
                </Link>
              }
            />
          </div>
        </div>
      </CityPage>
    );
  }

  if (!other || !isLifecycleVisible(other) || !match) {
    return (
      <CityPage width="full">
        <div className="flex w-full items-start">
          <DashboardSidebar handle={handle} profile={mine} documents={myDocs} incomingCount={incoming.length} side={side} />
          <div className="min-w-0 flex-1 bg-white px-4 py-8 sm:px-8 lg:px-10 dark:bg-white/[0.02]">
            <ErrorState
              title="This match is not visible"
              description="Their availability may have ended."
              action={
                <Link to="/media-technology/matches" className={buttonClassName({ variant: "outline" })}>
                  Back to matches
                </Link>
              }
            />
          </div>
        </div>
      </CityPage>
    );
  }

  const counterpart = other;
  const locked = !revealed;
  const name = otherProfile?.displayName ?? `@${counterpart.handle}`;
  const firstName = name.split(" ")[0];
  const role = otherProfile?.headline || counterpart.category || counterpart.discipline;
  const location = otherProfile?.location || counterpart.location;
  const availableNow = counterpart.side === "in";
  const availabilityLabel = availableNow ? "Available now" : "Needs someone";
  const headerImage = otherProfile?.avatarUrl || otherProfile?.coverUrl;
  const bio = otherProfile?.bio || "No bio listed yet.";
  const tools = otherProfile?.tools.length ? otherProfile.tools : counterpart.tools;
  const websiteUrls = Array.from(
    new Set((otherProfile?.portfolio ?? []).map((item) => item.url).filter(Boolean)),
  );
  const docs = documents(counterpart.handle);

  function sendHandshake() {
    const record = handshake({
      fromHandle: handle,
      toHandle: counterpart.handle,
      source: "board_match",
      listingId: counterpart.id,
    });
    setConnectionId(record.id);
    setPhase("requested");
    setRequestedOpen(true);
  }

  function acceptIncoming() {
    const id = connectionId ?? existing?.id;
    if (!id) return;
    accept(id, handle);
    setPhase("connected");
    setRevealed(true);
  }

  function declineIncoming() {
    const id = connectionId ?? existing?.id;
    if (!id) return;
    decline(id);
    setConnectionId(undefined);
    setPhase("idle");
  }

  function openFullProfile() {
    setRevealed(true);
  }

  function openMessages() {
    if (!connectionId) return;
    navigate(`/messages?c=${connectionId}`);
  }

  const availabilityDot = (
    <span className="inline-flex items-center gap-1.5 text-body-sm text-foreground">
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", availableNow ? "bg-[#22C55E]" : "bg-[#C99A28] dark:bg-accent")} />
      {availabilityLabel}
    </span>
  );

  return (
    <CityPage width="full">
      <div className="flex w-full items-start">
        <DashboardSidebar handle={handle} profile={mine} documents={myDocs} incomingCount={incoming.length} side={side} />

        <div className="min-w-0 flex-1 space-y-6 bg-white px-4 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-6 lg:px-10 dark:bg-white/[0.02] dark:backdrop-blur-3xl">
          <Link
            to="/media-technology/matches"
            className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
          >
            <IconChevronLeft className="h-3.5 w-3.5" />
            Back to Matches
          </Link>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="min-w-0 space-y-6">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar
                  name={name}
                  src={headerImage}
                  size="xl"
                  locked={locked}
                  className="h-16 w-16 shrink-0 ring-1 ring-border sm:h-20 sm:w-20"
                />
                <div className="min-w-0">
                  <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
                    {name}
                  </h1>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {role ? (
                      <li>
                        <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-3 py-1 text-caption font-medium text-foreground">
                          {role}
                        </span>
                      </li>
                    ) : null}
                    <li>
                      <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-3 py-1 text-caption font-medium text-foreground">
                        Media &amp; Technology
                      </span>
                    </li>
                    {location ? (
                      <li>
                        <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-3 py-1 text-caption font-medium text-foreground">
                          {location}
                        </span>
                      </li>
                    ) : null}
                  </ul>
                  {phase === "connected" ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-foreground">
                      <IconCheck className="h-4 w-4 text-[#22C55E]" />
                      Connected
                    </p>
                  ) : null}
                </div>
              </div>

              <section className={cn(DASHBOARD_CARD, "p-5 sm:p-6")}>
                <p className="flex items-center gap-2 text-body font-medium text-foreground">
                  <span aria-hidden className="text-[#C99A28] dark:text-accent">
                    ✦
                  </span>
                  Why You Match
                </p>
                <p className="mt-2 text-body-sm text-muted">
                  Strong fit based on your profile, district, skills, and availability.
                </p>
                <div className="mt-4">
                  <MatchFactors mine={listing} counterpart={counterpart} />
                </div>
              </section>

              <div className={cn(DASHBOARD_CARD, "space-y-8 p-5 sm:p-6")}>
                <section>
                  <p className="text-body font-medium text-foreground">About</p>
                  {revealed ? (
                    <p className="mt-2 text-body-sm text-muted">{bio}</p>
                  ) : counterpart.side === "in" ? (
                    <p className="mt-2 text-body-sm text-muted">Opens after a Handshake.</p>
                  ) : (
                    <>
                      <p className="mt-2 text-body-sm text-muted">{aboutPreview(bio)}</p>
                      <p className="mt-2 text-caption font-medium text-quiet">View after Handshake</p>
                    </>
                  )}
                </section>

                <section>
                  <p className="text-body font-medium text-foreground">
                    {counterpart.side === "in" ? "Availability" : "What They’re Looking For"}
                  </p>
                  {counterpart.side === "in" && !revealed ? (
                    <p className="mt-2 text-body-sm text-muted">
                      {availabilityLabel}
                      {counterpart.timing ? ` · ${counterpart.timing}` : ""}
                    </p>
                  ) : (
                    <>
                  <p className="mt-2 text-body-sm text-muted">
                    {counterpart.description || "No engagement details listed yet."}
                  </p>
                    {counterpart.skills.length ? (
                    <>
                      <p className="mt-4 text-caption font-medium uppercase tracking-[0.06em] text-quiet">
                        Relevant areas
                      </p>
                      <SkillChips
                        skills={counterpart.skills}
                        max={6}
                        chipClassName="border-border bg-surface-muted text-foreground"
                      />
                    </>
                  ) : null}
                  {counterpart.side === "out" && counterpart.requirements ? (
                    <p className="mt-3 text-body-sm text-muted">Requirements: {counterpart.requirements}</p>
                  ) : null}
                    </>
                  )}
                </section>

                {revealed ? (
                  <>
                    <section>
                      <p className="text-body font-medium text-foreground">Experience</p>
                      <div className="mt-2 space-y-1.5">
                        {counterpart.experienceYears ? (
                          <p className="text-body font-medium text-foreground">
                            {counterpart.experienceYears}+ years
                          </p>
                        ) : null}
                        <p className="text-body-sm text-muted">
                          {otherProfile?.disciplines.length ? otherProfile.disciplines.join(", ") : counterpart.discipline}
                        </p>
                        {otherProfile?.experience ? (
                          <p className="text-body-sm text-muted">{otherProfile.experience}</p>
                        ) : null}
                      </div>
                    </section>

                    <section>
                      <p className="text-body font-medium text-foreground">Skills &amp; Expertise</p>
                      <div className="mt-3">
                        <SkillChips
                          skills={counterpart.skills}
                          max={12}
                          chipClassName="border-border bg-surface-muted text-foreground"
                        />
                      </div>
                      {counterpart.certifications.length ? (
                        <div className="mt-4">
                          <p className="text-caption font-medium uppercase tracking-[0.06em] text-quiet">
                            Certifications
                          </p>
                          <div className="mt-2">
                            <SkillChips
                              skills={counterpart.certifications}
                              max={12}
                              chipClassName="border-border bg-surface-muted text-foreground"
                            />
                          </div>
                        </div>
                      ) : null}
                    </section>

                    {tools.length ? (
                      <section>
                        <p className="text-body font-medium text-foreground">Tools</p>
                        <div className="mt-3">
                          <SkillChips
                            skills={tools}
                            max={12}
                            chipClassName="border-border bg-surface-muted text-foreground"
                          />
                        </div>
                      </section>
                    ) : null}

                    <section>
                      <p className="text-body font-medium text-foreground">Portfolio</p>
                      {otherProfile?.portfolio.length ? (
                        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                          {otherProfile.portfolio.map((item) => (
                            <li
                              key={`${item.label}-${item.url}`}
                              className="rounded-xl border border-border bg-white px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.03]"
                            >
                              <p className="text-body font-medium text-foreground">{item.label || "Untitled project"}</p>
                              {item.note ? <p className="mt-1 text-body-sm text-muted">{item.note}</p> : null}
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-body-sm font-medium text-[#C99A28] dark:text-accent"
                                >
                                  View work <IconChevronRight className="h-3 w-3" />
                                </a>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-body-sm text-muted">No work samples listed yet.</p>
                      )}
                    </section>

                    {websiteUrls.length ? (
                      <section>
                        <p className="text-body font-medium text-foreground">Website</p>
                        <ul className="mt-2 space-y-1.5">
                          {websiteUrls.map((url) => (
                            <li key={url}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-body-sm font-medium text-[#C99A28] dark:text-accent"
                              >
                                {url.replace(/^https?:\/\//, "")}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}

                    {counterpart.side === "in" && otherProfile ? (
                      <section>
                        <p className="text-body font-medium text-foreground">Professional information</p>
                        <ul className="mt-2 space-y-1.5 text-body-sm text-muted">
                          <li>Profile: {otherProfile.profileType === "business" ? "Business" : "Individual"}</li>
                          <li>Employment: {counterpart.engagement || "Not listed."}</li>
                          <li>Categories: {(otherProfile.offers ?? []).join(", ") || counterpart.category || "Not listed."}</li>
                          <li>Participation: {otherProfile.specialization || "Not listed."}</li>
                          <li>Work: {counterpart.remoteOnsite}</li>
                          <li>Service area: {counterpart.location || otherProfile.location || "Not listed."}</li>
                          <li>{otherProfile.profileType === "business" ? "Workstation" : "Own gear"}: {counterpart.requirements || "Not listed."}</li>
                          <li>
                            Available today: {counterpart.timeline?.includes("today") ? "Yes" : "No"} · Available right now:{" "}
                            {counterpart.timeline?.includes("now") ? "Yes" : "No"}
                          </li>
                        </ul>
                      </section>
                    ) : null}

                    <section>
                      <p className="text-body font-medium text-foreground">Contact</p>
                      <p className="mt-2 text-body-sm text-muted">
                        {[
                          findAccountByHandle(counterpart.handle)?.email,
                          findAccountByHandle(counterpart.handle)?.phone,
                          counterpart.contact,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "No contact listed."}
                      </p>
                    </section>

                    {otherProfile?.credentials || docs.length ? (
                      <section>
                        <p className="text-body font-medium text-foreground">Credentials</p>
                        {otherProfile?.credentials ? (
                          <p className="mt-2 text-body-sm text-muted">{otherProfile.credentials}</p>
                        ) : null}
                        {docs.length ? (
                          <div className="mt-3">
                            <ProfileDocumentsSection docs={docs} mine={false} revealed />
                          </div>
                        ) : null}
                      </section>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            <div className="lg:sticky lg:top-24">
              <div className={cn(DASHBOARD_CARD, "p-5 sm:p-6")}>
                <div className="flex items-center gap-3">
                  <Avatar name={name} src={headerImage} size="md" locked={locked} />
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium text-foreground">{name}</p>
                    <p className="truncate text-body-sm text-muted">{role}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-[2.25rem] font-medium leading-none tracking-tight text-foreground">
                    {Math.round(match.percent)}%
                  </p>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFC555]/15 px-3 py-1 text-caption font-semibold text-[#C99A28] dark:bg-[#4ADE80]/15 dark:text-[#4ADE80]">
                    {matchBandLabel[matchBand(match.percent)]} fit
                  </span>
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                  <div
                    className="h-full rounded-full bg-[#FFC555] dark:bg-gradient-to-r dark:from-accent-hover dark:to-accent"
                    style={{ width: `${Math.max(0, Math.min(100, match.percent))}%` }}
                  />
                </div>

                <ul className="mt-5 space-y-2.5 border-t border-border-subtle pt-5 text-body-sm">
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-muted">Availability</span>
                    {availabilityDot}
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-muted">District</span>
                    <span className="font-medium text-foreground">Media &amp; Technology</span>
                  </li>
                  {location ? (
                    <li className="flex items-center justify-between gap-3">
                      <span className="text-muted">Location</span>
                      <span className="truncate font-medium text-foreground">{location}</span>
                    </li>
                  ) : null}
                </ul>

                <div className="mt-5 border-t border-border-subtle pt-5">
                  {phase === "idle" ? (
                    <>
                      <p className="text-body font-medium text-foreground">Interested in connecting?</p>
                      <p className="mt-1 text-body-sm text-muted">
                        Request a Handshake to connect and access the full profile.
                      </p>
                      <Button className="mt-4 w-full" onClick={sendHandshake}>
                        Request Handshake
                      </Button>
                    </>
                  ) : phase === "incoming" ? (
                    <>
                      <p className="text-body font-medium text-foreground">Handshake request</p>
                      <p className="mt-1 text-body-sm text-muted">
                        {firstName} asked to connect. Accept to open the private connection.
                      </p>
                      <div className="mt-4 flex flex-col gap-2.5">
                        <Button className="w-full" onClick={acceptIncoming}>
                          Accept Handshake
                        </Button>
                        <Button className="w-full" variant="outline" onClick={declineIncoming}>
                          Decline
                        </Button>
                      </div>
                    </>
                  ) : phase === "requested" ? (
                    <>
                      <p className="text-body font-medium text-foreground">Handshake request sent</p>
                      <p className="mt-1 text-body-sm text-muted">Your request has been sent to {firstName}.</p>
                      <Button className="mt-4 w-full" disabled>
                        Handshake Requested
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="inline-flex items-center gap-1.5 text-body font-medium text-foreground">
                        <IconCheck className="h-4 w-4 text-[#22C55E]" />
                        Connected
                      </p>
                      <p className="mt-1 text-body-sm text-muted">You&rsquo;re connected with {firstName}.</p>
                      <div className="mt-4 flex flex-col gap-2.5">
                        {!revealed ? (
                          <Button className="w-full" onClick={openFullProfile}>
                            View Full Profile
                          </Button>
                        ) : null}
                        <Button
                          className="w-full"
                          variant={revealed ? "primary" : "outline"}
                          onClick={openMessages}
                        >
                          Send Message
                        </Button>
                      </div>
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="mt-2.5 w-full"
                    onClick={() => setSaved(toggleSavedListing(handle, counterpart.id))}
                  >
                    {saved ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={requestedOpen}
        onClose={() => setRequestedOpen(false)}
        title="Handshake requested"
        footer={
          <Button onClick={() => setRequestedOpen(false)}>Got it</Button>
        }
      >
        <p>Your handshake will be accepted when {firstName} agrees.</p>
        <p className="mt-2 text-body text-muted">
          You&rsquo;ll be able to message and view the full profile once they accept.
        </p>
      </Dialog>
    </CityPage>
  );
}

export function HandshakeRequestPage() {
  const { listingId } = useParams();
  return <Navigate to={`/media-technology/board/${listingId ?? ""}`} replace />;
}
