import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { FilterBar, FilterChip } from "@/components/ui/search";
import { Drawer, Dialog } from "@/components/ui/overlays";
import { Button, buttonClassName } from "@/components/ui/button";
import { IconCheck, IconChevronRight, IconFilter } from "@/components/ui/icons";
import { CityPage } from "@/components/city/CityShell";
import { HandshakeStatus } from "@/components/vael";
import { ProfileDocumentsSection } from "@/components/vael/trust";
import { BoardMatchCard, SkillChips } from "@/components/mt/BoardMatchCard";
import { Avatar } from "@/components/ui/avatar";
import { RequireMember } from "@/components/mt/RequireMember";
import { JourneyProgress } from "@/components/city/setup";
import { useVael } from "@/lib/vaelCore";
import { isLifecycleVisible, isMtSampleHandle, type RankedMatch, type VaelListing } from "@/lib/vaelStore";
import { isListingSaved, toggleSavedListing } from "@/lib/savedMatches";
import { seedDemoConversation } from "@/lib/demoJourney";
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
            <Link to="/media-technology/vael/active" className={buttonClassName({ variant: "outline" })}>
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
                <Link to="/media-technology/vael/active" className={buttonClassName({ variant: "outline" })}>
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
        <div key={row.label} className="rounded-xl border border-border bg-surface px-4 py-3.5">
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

function MatchDetailInner() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { listing, matches, handle, openWith, documents, profile, handshake, simulateAccept } = useVael();
  const [saved, setSaved] = useState(() => (listingId ? isListingSaved(handle, listingId) : false));
  const match: RankedMatch | undefined = matches.find((item) => item.listing.id === listingId);
  const other = match?.listing;
  const existing = other ? openWith(handle, other.handle) : undefined;
  const otherProfile = other ? profile(other.handle) : undefined;
  const hydrated = useRef(false);

  const [connectionId, setConnectionId] = useState<string | undefined>(existing?.id);
  const [phase, setPhase] = useState<"idle" | "requested" | "connected">("idle");
  const [revealed, setRevealed] = useState(false);
  const [acceptedOpen, setAcceptedOpen] = useState(false);

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
      setPhase("requested");
    }
  }, [existing]);

  // Demo-only: sample counterparts auto-accept a couple seconds after a request.
  useEffect(() => {
    if (phase !== "requested" || !connectionId || !other) return;
    if (!isMtSampleHandle(other.handle)) return;
    const timer = setTimeout(() => {
      simulateAccept(connectionId, handle);
      seedDemoConversation(connectionId);
      setPhase("connected");
      setAcceptedOpen(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [phase, connectionId, other, handle, simulateAccept]);

  if (!listing) {
    return (
      <CityPage>
        <EmptyState
          title="Vael to open a match"
          action={
            <Link to="/media-technology/vael?create=1" className={buttonClassName()}>
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
            <Link to="/media-technology/matches" className={buttonClassName({ variant: "outline" })}>
              Back to matches
            </Link>
          }
        />
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
  }

  function openFullProfile() {
    setRevealed(true);
    setAcceptedOpen(false);
  }

  function openMessages() {
    if (!connectionId) return;
    setAcceptedOpen(false);
    navigate(`/messages?c=${connectionId}`);
  }

  const availabilityDot = (
    <span className="inline-flex items-center gap-1.5 text-body-sm text-foreground">
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", availableNow ? "bg-[#22C55E]" : "bg-[#C99A28] dark:bg-accent")} />
      {availabilityLabel}
    </span>
  );

  return (
    <CityPage width="wide" className="-mt-4 sm:-mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-body-sm text-quiet">
        <Link to="/media-technology/matches" className="font-medium text-muted hover:text-foreground">
          ← Back to Matches
        </Link>
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* LEFT — limited until Handshake, then the full profile */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-start gap-5">
            <Avatar
              name={name}
              src={headerImage}
              size="xl"
              locked={locked}
              className="h-24 w-24 shrink-0 ring-1 ring-border"
            />
            <div className="min-w-0">
              <h1 className="font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-foreground">
                {name}
              </h1>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {role ? (
                  <li>
                    <span className="inline-flex h-7 items-center rounded-full bg-[#FFC555]/15 px-2.5 text-caption font-medium text-[#C99A28] dark:bg-accent/15 dark:text-accent">
                      {role}
                    </span>
                  </li>
                ) : null}
                <li>
                  <span className="inline-flex h-7 items-center rounded-full bg-[#FFC555]/15 px-2.5 text-caption font-medium text-[#C99A28] dark:bg-accent/15 dark:text-accent">
                    Media &amp; Technology
                  </span>
                </li>
                {location ? (
                  <li>
                    <span className="inline-flex h-7 items-center rounded-full bg-[#FFC555]/15 px-2.5 text-caption font-medium text-[#C99A28] dark:bg-accent/15 dark:text-accent">
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

          <section className="mt-8 rounded-2xl border border-border bg-[#F7F7F8] p-6 dark:border-white/10 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.06] dark:via-white/[0.02] dark:to-transparent dark:backdrop-blur-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]">
            <p className="flex items-center gap-2 text-body font-semibold text-foreground">
              <span aria-hidden className="text-[#C99A28] dark:text-accent">
                ✦
              </span>
              Why You Match
            </p>
            <p className="mt-2 text-body text-foreground">
              Strong fit based on your profile, district, skills, and availability.
            </p>
            <div className="mt-4">
              <MatchFactors mine={listing} counterpart={counterpart} />
            </div>
          </section>

          <div className="mt-10 space-y-10">
            <section>
              <p className="text-body font-semibold text-foreground">About</p>
              {revealed ? (
                <p className="mt-2 text-body text-foreground">{bio}</p>
              ) : (
                <>
                  <p className="mt-2 text-body text-foreground">{aboutPreview(bio)}</p>
                  <p className="mt-2 text-body-sm font-medium text-quiet">View after Handshake</p>
                </>
              )}
            </section>

            <section>
              <p className="text-body font-semibold text-foreground">What They&rsquo;re Looking For</p>
              <p className="mt-2 text-body text-foreground">
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
                    chipClassName="border-transparent bg-[#FFC555]/15 text-[#C99A28] dark:bg-accent/15 dark:text-accent"
                  />
                </>
              ) : null}
            </section>

            {revealed ? (
              <>
                <section>
                  <p className="text-body font-semibold text-foreground">Experience</p>
                  <div className="mt-2 space-y-1.5">
                    {counterpart.experienceYears ? (
                      <p className="text-h4 font-medium text-foreground">
                        {counterpart.experienceYears}+ years
                      </p>
                    ) : null}
                    <p className="text-body text-foreground">
                      {otherProfile?.disciplines.length ? otherProfile.disciplines.join(", ") : counterpart.discipline}
                    </p>
                    {otherProfile?.experience ? (
                      <p className="text-body text-muted">{otherProfile.experience}</p>
                    ) : null}
                  </div>
                </section>

                <section>
                  <p className="text-body font-semibold text-foreground">Skills &amp; Expertise</p>
                  <div className="mt-3">
                    <SkillChips
                      skills={counterpart.skills}
                      max={12}
                      chipClassName="border-transparent bg-[#FFC555]/15 text-[#C99A28] dark:bg-accent/15 dark:text-accent"
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
                          chipClassName="border-transparent bg-[#FFC555]/15 text-[#C99A28] dark:bg-accent/15 dark:text-accent"
                        />
                      </div>
                    </div>
                  ) : null}
                </section>

                {tools.length ? (
                  <section>
                    <p className="text-body font-semibold text-foreground">Tools</p>
                    <div className="mt-3">
                      <SkillChips
                        skills={tools}
                        max={12}
                        chipClassName="border-transparent bg-[#FFC555]/15 text-[#C99A28] dark:bg-accent/15 dark:text-accent"
                      />
                    </div>
                  </section>
                ) : null}

                <section>
                  <p className="text-body font-semibold text-foreground">Portfolio</p>
                  {otherProfile?.portfolio.length ? (
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                      {otherProfile.portfolio.map((item) => (
                        <li
                          key={`${item.label}-${item.url}`}
                          className="rounded-xl border border-border bg-surface px-4 py-3.5"
                        >
                          <p className="text-body font-medium text-foreground">{item.label || "Untitled project"}</p>
                          {item.note ? <p className="mt-1 text-body-sm text-muted">{item.note}</p> : null}
                          {item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-body-sm font-medium text-accent"
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
                    <p className="text-body font-semibold text-foreground">Website</p>
                    <ul className="mt-2 space-y-1.5">
                      {websiteUrls.map((url) => (
                        <li key={url}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-body-sm font-medium text-accent"
                          >
                            {url.replace(/^https?:\/\//, "")}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {otherProfile?.credentials || docs.length ? (
                  <section>
                    <p className="text-body font-semibold text-foreground">Credentials</p>
                    {otherProfile?.credentials ? (
                      <p className="mt-2 text-body text-foreground">{otherProfile.credentials}</p>
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

        {/* RIGHT — sticky action card */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-white p-7 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_24px_48px_-18px_rgba(17,17,17,0.18)] dark:border-white/10 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.07] dark:via-white/[0.02] dark:to-transparent dark:backdrop-blur-2xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.2),0_20px_50px_-16px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-3">
              <Avatar name={name} src={headerImage} size="md" locked={locked} />
              <div className="min-w-0">
                <p className="truncate text-body font-semibold text-foreground">{name}</p>
                <p className="truncate text-caption text-muted">{role}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-[2.5rem] font-semibold leading-none tracking-[-0.03em] text-foreground">
                {Math.round(match.percent)}%
              </p>
              <span className="shrink-0 rounded-full bg-[#FFC555]/15 px-3 py-1 text-caption font-semibold text-[#C99A28] dark:bg-[#4ADE80]/15 dark:text-[#4ADE80]">
                {matchBandLabel[matchBand(match.percent)]} fit
              </span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
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
                  <p className="text-body font-semibold text-foreground">Interested in connecting?</p>
                  <p className="mt-1 text-body-sm text-muted">
                    Request a Handshake to connect and access the full profile.
                  </p>
                  <Button className="mt-4 h-12 w-full rounded-full text-body" onClick={sendHandshake}>
                    Request Handshake
                  </Button>
                </>
              ) : phase === "requested" ? (
                <>
                  <p className="text-body font-medium text-foreground">Handshake request sent</p>
                  <p className="mt-1 text-body-sm text-muted">Your request has been sent to {firstName}.</p>
                  <Button className="mt-4 h-12 w-full rounded-full text-body" disabled>
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
                      <Button className="h-12 w-full rounded-full text-body" onClick={openFullProfile}>
                        View Full Profile
                      </Button>
                    ) : null}
                    <Button
                      className="h-12 w-full rounded-full text-body"
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
                className="mt-2.5 h-12 w-full rounded-full text-body"
                onClick={() => setSaved(toggleSavedListing(handle, counterpart.id))}
              >
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={acceptedOpen}
        onClose={() => setAcceptedOpen(false)}
        title="Handshake Accepted"
        footer={
          <>
            <Button variant="outline" className="rounded-full" onClick={openMessages}>
              Send Message
            </Button>
            <Button className="rounded-full" onClick={openFullProfile}>
              View Full Profile
            </Button>
          </>
        }
      >
        <p>You&rsquo;re connected with {firstName}.</p>
        <p className="mt-2 text-body text-muted">
          You can now view the full profile and start a conversation.
        </p>
      </Dialog>
    </CityPage>
  );
}

export function HandshakeRequestPage() {
  const { listingId } = useParams();
  return <Navigate to={`/media-technology/board/${listingId ?? ""}`} replace />;
}
