import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClassName } from "@/components/ui/button";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/icons";
import { CityPage } from "@/components/city/CityShell";
import { DashboardShell, dashboardSideFromListing } from "@/components/mt/DashboardShell";
import { PostCard } from "@/components/community/PostCard";
import { DistrictStatus } from "@/components/vael/status";
import { communityComposerDefaultKind, communityComposerPlaceholder } from "@/lib/vaelCopy";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { useCitySession } from "@/lib/citySession";
import { useCommunity } from "@/lib/communityCore";
import { resolveCommunityAuthor } from "@/lib/communityPresent";
import { useVael } from "@/lib/vaelCore";
import { getSavedListingIds, toggleSavedListing } from "@/lib/savedMatches";
import {
  communityDistrictFromLot,
  communityDistrictLabel,
  communityPostKind,
  formatCommunityTime,
  type CommunityDistrictId,
  type CommunityPostKind,
  type CommunityPostView,
  type CommunityReactionKind,
} from "@/lib/communityStore";
import { districtBySlug, districtFromPath, isDistrictEnterable } from "@/lib/districts";

export function FeedPage() {
  return <DistrictFeedPage />;
}

/** Same card language as Matches/Handshakes — circle photo, badge row, info, footer CTA. */
function SavedCard({
  avatarName,
  avatarSrc,
  title,
  subtitle,
  meta,
  badge,
  primaryHref,
  primaryLabel,
  onRemove,
}: {
  avatarName: string;
  avatarSrc?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: ReactNode;
  primaryHref: string;
  primaryLabel: string;
  onRemove: () => void;
}) {
  const initial = avatarName.trim().charAt(0).toUpperCase() || "V";
  return (
    <div className="group flex w-80 shrink-0 flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-10px_rgba(17,17,17,0.1)] motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:border-[#C99A28]/30 hover:shadow-[0_1px_2px_rgba(11,12,12,0.06),0_20px_36px_-12px_rgba(17,17,17,0.18)] dark:border-white/10 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.06] dark:via-white/[0.02] dark:to-transparent dark:backdrop-blur-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:border-accent/30 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.2),0_20px_40px_-12px_rgba(255,157,69,0.2)]">
      {avatarSrc ? (
        <img src={avatarSrc} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFC555] text-body font-semibold text-[#0B0C0C] dark:bg-gradient-to-br dark:from-accent-hover dark:to-accent dark:text-[#1A1410] dark:shadow-[0_2px_4px_-1px_rgba(255,138,61,0.4),0_10px_22px_-8px_rgba(255,138,61,0.45)] dark:ring-1 dark:ring-inset dark:ring-white/25">
          {initial}
        </span>
      )}

      {badge}

      <div className="min-w-0">
        <p className="truncate text-body font-medium text-foreground">{title}</p>
        {subtitle ? <p className="truncate text-body-sm text-muted">{subtitle}</p> : null}
        {meta ? <p className="mt-1 line-clamp-1 text-body-sm text-quiet">{meta}</p> : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
        <button
          type="button"
          onClick={onRemove}
          className="text-body-sm font-medium text-quiet hover:text-foreground motion-safe:transition-colors motion-safe:duration-150"
        >
          Remove
        </button>
        <Link
          to={primaryHref}
          className="flex items-center gap-1 text-body-sm font-medium text-[#C99A28] hover:text-foreground dark:text-accent"
        >
          {primaryLabel}
          <IconChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

type SavedTab = "matches" | "posts";

export function SavedPostsPage() {
  const community = useCommunity();
  const { session } = useCitySession();
  const vael = useVael();
  const items = useMemo(() => community.saved(), [community]);
  const [refreshTick, forceRefresh] = useState(0);
  const [tab, setTab] = useState<SavedTab>("matches");

  const savedMatches = useMemo(() => {
    if (!vael.handle) return [];
    return getSavedListingIds(vael.handle)
      .map((listingId) => {
        const listing = vael.listingById(listingId);
        if (!listing) return null;
        const otherProfile = vael.profile(listing.handle);
        const match = vael.matches.find((item) => item.listing.id === listingId);
        return { listing, otherProfile, match };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vael, refreshTick]);

  function removeMatch(listingId: string) {
    toggleSavedListing(vael.handle, listingId);
    forceRefresh((n) => n + 1);
  }

  return (
    <CityPage width="full" className="-mt-4 sm:-mt-6">
      <div className="mx-auto w-full max-w-[92rem] px-5 py-12 md:px-6 lg:px-8">
        <Link to={PRODUCT_HOME} className="text-body-sm font-medium text-muted hover:text-foreground">
          ← Back to Dashboard
        </Link>

        <h1 className="mt-4 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-foreground">
          Saved
        </h1>
        <p className="mt-2 text-body text-muted">Matches and posts you saved to come back to on this device.</p>

        <div className="mt-8 overflow-x-auto">
          <Tabs value={tab} onValueChange={(next) => setTab(next as SavedTab)} defaultValue="matches">
            <TabsList>
              <TabsTrigger value="matches">Matches ({savedMatches.length})</TabsTrigger>
              <TabsTrigger value="posts">Posts ({items.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {tab === "matches" ? (
          savedMatches.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No saved matches"
                description="Save a match from its detail page to find it here."
                action={
                  <Link to="/media-technology/matches" className={buttonClassName({ variant: "outline", size: "sm" })}>
                    View matches
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-4">
              {savedMatches.map(({ listing, otherProfile, match }) => (
                <SavedCard
                  key={listing.id}
                  avatarName={otherProfile?.displayName ?? listing.handle}
                  avatarSrc={otherProfile?.avatarUrl}
                  title={otherProfile?.displayName ?? `@${listing.handle}`}
                  subtitle={otherProfile?.headline || listing.category || listing.discipline || "Media & Technology"}
                  badge={
                    match ? (
                      <span className="inline-flex w-fit items-center rounded-full bg-[#FFC555]/15 px-3 py-1 text-caption font-semibold text-[#C99A28] dark:bg-accent/15 dark:text-accent">
                        {Math.round(match.percent)}% Match
                      </span>
                    ) : undefined
                  }
                  primaryHref={`/media-technology/board/${listing.id}`}
                  primaryLabel="View Match"
                  onRemove={() => removeMatch(listing.id)}
                />
              ))}
            </div>
          )
        ) : items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No saved posts"
              description="Save a post from the feed to read it later on this device."
              action={
                <Link to="/feed" className={buttonClassName({ variant: "outline", size: "sm" })}>
                  Open Feed
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-4">
            {items.map((item) => (
              <SavedCard
                key={item.post.id}
                avatarName={item.post.handle}
                title={`@${item.post.handle}`}
                subtitle={communityDistrictLabel(item.post.districtId)}
                meta={`${item.post.body.slice(0, 80)}${item.post.body.length > 80 ? "…" : ""} · ${formatCommunityTime(item.post.createdAt)}`}
                badge={
                  <span className="inline-flex w-fit items-center rounded-full bg-surface-muted px-3 py-1 text-caption font-medium text-muted">
                    {item.likeCount} likes · {item.commentCount} comments
                  </span>
                }
                primaryHref={`/feed/${item.post.id}`}
                primaryLabel="View Post"
                onRemove={() => community.save(item.post.id)}
              />
            ))}
          </div>
        )}

        {!session.signedIn ? (
          <p className="mt-8 text-caption text-muted">Continue locally from Account to save matches or posts.</p>
        ) : null}
      </div>
    </CityPage>
  );
}

export function DistrictCommunityPage() {
  const { pathname } = useLocation();
  const district = districtFromPath(pathname);
  if (!district) {
    return (
      <CityPage>
        <ErrorUnavailable title="Community not found" />
      </CityPage>
    );
  }
  if (!isDistrictEnterable(district)) {
    return <UnavailableCommunityPage />;
  }
  const id = communityDistrictFromLot(district);
  if (!id) {
    return <UnavailableCommunityPage />;
  }
  return <DistrictFeedPage districtId={id} />;
}

export function UnavailableCommunityPage() {
  const { pathname } = useLocation();
  const district = districtFromPath(pathname) ?? districtBySlug(pathname.split("/")[2]);
  const status = district?.status ?? "soon";
  const label = status === "early" ? "Early Access" : status === "future" ? "Future" : "Coming Soon";
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Community"
        title={district?.name ?? "District Community"}
        description={`${label}. There is no Community for this lot until it is a live Room.`}
        crumbs={[
          { label: "City", href: "/" },
          { label: "Feed", href: "/feed" },
          { label: district?.name ?? "District" },
        ]}
        actions={district ? <DistrictStatus status={district.status} /> : undefined}
      />
      <Alert tone="info" title={label} className="mt-6">
        This kit does not invent discussion for unfinished lots. Open a live Room, or read the City feed.
      </Alert>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/feed" className={buttonClassName()}>
          City Feed
        </Link>
        <Link to="/districts" className={buttonClassName({ variant: "outline" })}>
          Districts
        </Link>
      </div>
    </CityPage>
  );
}

function ErrorUnavailable({ title }: { title: string }) {
  return (
    <>
      <PageHeader kicker="Community" title={title} />
      <EmptyState
        title={title}
        action={
          <Link to="/feed" className={buttonClassName({ variant: "outline" })}>
            City Feed
          </Link>
        }
      />
    </>
  );
}

type FeedFilter = "all" | "update" | "opportunity" | "highlight" | "discussion";

const FEED_FILTERS: { id: FeedFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "update", label: "Update" },
  { id: "opportunity", label: "Opportunity" },
  { id: "highlight", label: "Highlight" },
  { id: "discussion", label: "Discussion" },
];

/** "Highlight" surfaces the legacy "collaboration" kind under a name that reads better next to Update/Opportunity/Discussion. */
function matchesFeedFilter(post: CommunityPostView["post"], filter: FeedFilter): boolean {
  if (filter === "all") return true;
  if (filter === "highlight") return communityPostKind(post) === "collaboration";
  return communityPostKind(post) === filter;
}

function BackToDashboard() {
  return (
    <Link to={PRODUCT_HOME} className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground">
      <IconChevronLeft className="h-3.5 w-3.5" />
      Back to dashboard
    </Link>
  );
}

const COMPOSER_KINDS: { id: CommunityPostKind; label: string }[] = [
  { id: "update", label: "Update" },
  { id: "opportunity", label: "Opportunity" },
  { id: "collaboration", label: "Highlight" },
  { id: "discussion", label: "Discussion" },
];

const COMPOSER_TAGS = ["", "Hiring", "Available", "Question"] as const;

function FeedFilterTabs({
  value,
  onChange,
}: {
  value: FeedFilter;
  onChange: (next: FeedFilter) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as FeedFilter)} defaultValue="all">
      <TabsList>
        {FEED_FILTERS.map((item) => (
          <TabsTrigger key={item.id} value={item.id}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function FeedComposer({
  districtId,
  onRequireSignIn,
}: {
  districtId: CommunityDistrictId;
  onRequireSignIn: () => void;
}) {
  const community = useCommunity();
  const { session } = useCitySession();
  const { latestListing } = useVael();
  const side = dashboardSideFromListing(latestListing);
  const defaultKind = communityComposerDefaultKind(side) as CommunityPostKind;
  const [kind, setKind] = useState<CommunityPostKind>(defaultKind);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  function publish() {
    if (!session.signedIn) {
      onRequireSignIn();
      return;
    }
    const text = [body.trim(), tag ? `#${tag}` : ""].filter(Boolean).join("\n\n");
    if (!text) {
      setError("Write something to share.");
      return;
    }
    setPublishing(true);
    setError("");
    try {
      community.publish({ districtId, body: text, kind, title: title.trim() || undefined });
      setTitle("");
      setBody("");
      setTag("");
      setKind(defaultKind);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The post could not be saved on this device.");
    } finally {
      setPublishing(false);
    }
  }

  const author = session.signedIn
    ? resolveCommunityAuthor(session.handle, districtId)
    : { name: "You", handle: "you" };

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-10px_rgba(17,17,17,0.1)] sm:p-6 dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]">
      <div className="flex items-start gap-3">
        <Avatar name={author.name} src={author.avatarUrl} size="md" />
        <div className="min-w-0 pt-0.5">
          <p className="truncate text-body-sm font-medium text-foreground">
            {session.signedIn ? `@${session.handle}` : "Share as you"}
          </p>
          <p className="text-caption font-medium text-accent">
            {side === "out" ? "Share an opportunity with the community" : "Share something with the community"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Textarea
          aria-label="Post"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={communityComposerPlaceholder(side)}
          className="min-h-[6.5rem]"
        />
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-40 sm:shrink-0">
          <Select
            aria-label="Post type"
            value={kind}
            onChange={(event) => setKind(event.target.value as CommunityPostKind)}
          >
            {COMPOSER_KINDS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
        <Input
          aria-label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add title"
          className="min-w-0 flex-1"
        />
        <div className="sm:w-36 sm:shrink-0">
          <Select aria-label="Tag" value={tag} onChange={(event) => setTag(event.target.value)}>
            <option value="">No tag</option>
            {COMPOSER_TAGS.filter(Boolean).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          onClick={publish}
          loading={publishing}
          disabled={!body.trim()}
          className="h-12 shrink-0 rounded-md bg-[#DE7C40] px-6 text-[#0B0C0C] hover:bg-[#E89E6E] dark:bg-[#DE7C40] dark:text-[#0B0C0C] dark:hover:bg-[#E89E6E]"
        >
          Post
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FeedList({
  items,
  emptyTitle,
  emptyDescription,
  onReact,
  onSave,
  onComment,
}: {
  items: CommunityPostView[];
  emptyTitle: string;
  emptyDescription: string;
  onReact: (id: string, kind: CommunityReactionKind) => void;
  onSave: (id: string) => void;
  onComment: (id: string, body: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }
  return (
    <ul className="mt-4 flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.post.id}>
          <PostCard
            view={item}
            onReact={(kind) => onReact(item.post.id, kind)}
            onSave={() => onSave(item.post.id)}
            onComment={(body) => onComment(item.post.id, body)}
          />
        </li>
      ))}
    </ul>
  );
}

/** A District's own Community — the same feed, filtered to one District. */
function DistrictFeedPage({ districtId }: { districtId?: CommunityDistrictId }) {
  const community = useCommunity();
  const { session, signIn } = useCitySession();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const isCity = !districtId || districtId === "city";
  const inDashboard = districtId === "media-technology" && session.signedIn;

  const allPosts = isCity ? community.posts() : community.posts(districtId);
  const items = useMemo(
    () => allPosts.filter((v) => matchesFeedFilter(v.post, filter)),
    [allPosts, filter],
  );

  function handleReact(id: string, kind: CommunityReactionKind) {
    if (!session.signedIn) return signIn("member");
    community.react(id, kind);
  }
  function handleSave(id: string) {
    if (!session.signedIn) return signIn("member");
    community.save(id);
  }
  function handleComment(id: string, body: string) {
    if (!session.signedIn) return signIn("member");
    community.comment(id, body);
  }

  const body = (
    <>
      {isCity || inDashboard ? null : <BackToDashboard />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
            Community Feed
          </h1>
          <p className="mt-1 max-w-xl text-body-sm text-muted">
            {isCity
              ? "Updates, opportunities, highlights, and discussion from across VAEL."
              : `Updates, opportunities, highlights, and discussion in ${communityDistrictLabel(districtId)}.`}
          </p>
        </div>
        {session.signedIn ? (
          <Link
            to={`${PRODUCT_HOME}/community/dashboard`}
            className="shrink-0 text-body-sm font-medium text-accent hover:underline"
          >
            Your dashboard →
          </Link>
        ) : null}
      </div>

      <div className="mx-auto mt-6 max-w-3xl">
        <FeedComposer districtId={districtId ?? "city"} onRequireSignIn={() => signIn("member")} />
      </div>

      <div className="mx-auto mt-6 max-w-3xl">
        <FeedFilterTabs value={filter} onChange={setFilter} />
      </div>

      <div className="mx-auto mt-4 max-w-3xl">
        <FeedList
          items={items}
          emptyTitle="Nothing shared yet"
          emptyDescription="Community stays empty until someone shares. Be the first."
          onReact={handleReact}
          onSave={handleSave}
          onComment={handleComment}
        />
      </div>

      {!session.signedIn ? (
        <p className="mt-8 text-caption text-muted">
          Continue locally from Account to post, like, save, or comment. Visitors can still read.
        </p>
      ) : null}
    </>
  );

  if (inDashboard) {
    return <DashboardShell>{body}</DashboardShell>;
  }

  return <CityPage className={isCity ? undefined : "-mt-4 sm:-mt-6"}>{body}</CityPage>;
}
