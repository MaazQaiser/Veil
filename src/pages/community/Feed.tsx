import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { FilterBar, FilterChip, SearchInput } from "@/components/ui/search";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClassName } from "@/components/ui/button";
import { IconChevronLeft, IconChevronRight, IconHash, IconImage, IconVideo } from "@/components/ui/icons";
import { CityPage } from "@/components/city/CityShell";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostDialog } from "@/components/community/CreatePostDialog";
import { DistrictStatus } from "@/components/vael/status";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { useCitySession } from "@/lib/citySession";
import { useCommunity } from "@/lib/communityCore";
import { useVael } from "@/lib/vaelCore";
import { useJoinedDistricts } from "@/components/mt/DistrictsRow";
import { getSavedListingIds, toggleSavedListing } from "@/lib/savedMatches";
import { getProfiles } from "@/lib/vaelStore";
import { resolveCommunityAuthor } from "@/lib/communityPresent";
import {
  communityDistrictFromLot,
  communityDistrictLabel,
  communityPostKind,
  communityProfileHref,
  formatCommunityTime,
  type CommunityDistrictId,
  type CommunityPostView,
} from "@/lib/communityStore";
import { districts, districtBySlug, districtFromPath, isDistrictEnterable } from "@/lib/districts";

export function FeedPage() {
  return <GlobalCommunityPage />;
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

/** Opens the composer — same control everywhere a feed appears. */
function ComposerTeaser({ onOpen }: { onOpen: () => void }) {
  const vael = useVael();
  const mine = vael.handle ? vael.profile(vael.handle) : undefined;
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04)] dark:bg-white/[0.05] dark:backdrop-blur-xl">
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 text-left">
        <Avatar name={mine?.displayName ?? vael.handle ?? "You"} src={mine?.avatarUrl} size="md" />
        <span className="flex-1 rounded-full border border-border-subtle bg-surface-muted px-4 py-2.5 text-body-sm text-muted">
          Share an update, ask a question, or celebrate a win...
        </span>
      </button>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpen}
            aria-label="Add an image"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <IconImage className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpen}
            aria-label="Add a video"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <IconVideo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpen}
            aria-label="Tag a topic"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <IconHash className="h-4 w-4" />
          </button>
        </div>
        <Button
          onClick={onOpen}
          className="rounded-full bg-[#FFC555] px-6 text-[#0B0C0C] hover:bg-[#FFC555]/90 dark:bg-accent dark:text-primary-foreground dark:hover:bg-accent-hover"
        >
          Post
        </Button>
      </div>
    </div>
  );
}

function FeedList({
  items,
  emptyTitle,
  emptyDescription,
  onLike,
  onSave,
  onShare,
  onComment,
}: {
  items: CommunityPostView[];
  emptyTitle: string;
  emptyDescription: string;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
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
            onLike={() => onLike(item.post.id)}
            onSave={() => onSave(item.post.id)}
            onShare={() => onShare(item.post.id)}
            onComment={(body) => onComment(item.post.id, body)}
          />
        </li>
      ))}
    </ul>
  );
}

/** Discovery rail — the same joined-district logic the Dashboard and Districts page use. */
function CommunitiesSidebar() {
  const { session } = useCitySession();
  const vael = useVael();
  const handle = session.signedIn ? session.handle : "";
  const mine = handle ? vael.profile(handle) : undefined;
  const docs = handle ? vael.documents(handle) : [];
  const joined = useJoinedDistricts(handle, mine, docs);

  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="vael-kicker">Your Communities</p>
        {joined.length === 0 ? (
          <p className="mt-3 text-body-sm text-muted">You haven't joined a Community yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {joined.map(({ district, percent }) => (
              <li key={district.id}>
                <p className="text-body-sm font-medium text-foreground">{district.name}</p>
                <p className="text-caption text-muted">Your District · {percent}%</p>
                <Link
                  to={`${district.route}/community`}
                  className="mt-1 inline-block text-caption font-medium text-foreground hover:underline"
                >
                  Open Community →
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/media-technology/districts"
          className="mt-4 inline-block text-caption font-medium text-[#C99A28] hover:text-foreground"
        >
          + Add Community
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="vael-kicker">Explore Communities</p>
        <ul className="mt-3 space-y-2.5">
          {districts.map((district) => (
            <li key={district.id}>
              <Link
                to={`${district.route}/community`}
                className="flex items-center justify-between gap-2 text-body-sm text-foreground hover:underline"
              >
                <span>{district.name}</span>
                {district.status !== "live" ? <DistrictStatus status={district.status} /> : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function SearchResultsView({ query, posts }: { query: string; posts: CommunityPostView[] }) {
  const q = query.trim().toLowerCase();
  const people = getProfiles()
    .filter((p) => p.displayName.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q))
    .slice(0, 6);
  const communities = districts.filter((d) => d.name.toLowerCase().includes(q));

  return (
    <div className="mt-6 space-y-8">
      <section>
        <p className="vael-kicker">Posts</p>
        {posts.length === 0 ? (
          <p className="mt-2 text-body-sm text-muted">No posts match "{query}".</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {posts.slice(0, 8).map((item) => (
              <li key={item.post.id}>
                <Link
                  to={`/feed/${item.post.id}`}
                  className="block rounded-xl border border-border bg-white px-4 py-3 text-body-sm hover:border-[#C99A28]/30"
                >
                  {item.post.title || item.post.body.slice(0, 100)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="vael-kicker">People</p>
        {people.length === 0 ? (
          <p className="mt-2 text-body-sm text-muted">No people match "{query}".</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {people.map((person) => (
              <li key={person.handle}>
                <Link
                  to={`/media-technology/profile/${person.handle}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 hover:border-[#C99A28]/30"
                >
                  <Avatar name={person.displayName} src={person.avatarUrl} size="sm" />
                  <span>
                    <span className="block text-body-sm font-medium text-foreground">{person.displayName}</span>
                    {person.headline ? <span className="block text-caption text-muted">{person.headline}</span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="vael-kicker">Communities</p>
        {communities.length === 0 ? (
          <p className="mt-2 text-body-sm text-muted">No communities match "{query}".</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {communities.map((district) => (
              <li key={district.id}>
                <Link
                  to={`${district.route}/community`}
                  className="block rounded-xl border border-border bg-white px-4 py-3 text-body-sm font-medium text-foreground hover:border-[#C99A28]/30"
                >
                  {district.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** The main Community landing page — a global social feed, not one district's Room. */
function GlobalCommunityPage() {
  const community = useCommunity();
  const { session, signIn } = useCitySession();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [query, setQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);

  const allPosts = community.posts();
  const searching = query.trim().length > 0;

  const items = useMemo(
    () => allPosts.filter((v) => matchesFeedFilter(v.post, filter)),
    [allPosts, filter],
  );

  const searchedPosts = useMemo(() => {
    if (!searching) return [];
    const q = query.trim().toLowerCase();
    return allPosts.filter((v) => v.post.body.toLowerCase().includes(q) || v.post.title?.toLowerCase().includes(q));
  }, [allPosts, query, searching]);

  function requireSignIn() {
    signIn("member");
  }

  function handleLike(id: string) {
    if (!session.signedIn) return requireSignIn();
    community.like(id);
  }
  function handleSave(id: string) {
    if (!session.signedIn) return requireSignIn();
    community.save(id);
  }
  function handleShare(id: string) {
    const url = `${window.location.origin}/feed/${id}`;
    navigator.clipboard?.writeText(url).catch(() => undefined);
  }
  function handleComment(id: string, body: string) {
    if (!session.signedIn) return requireSignIn();
    community.comment(id, body);
  }

  return (
    <CityPage width="wide" className="-mt-4 sm:-mt-6">
      <p className="vael-kicker">Community</p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-header">
          <h1 className="vael-h1">What's happening across VAEL?</h1>
          <p className="mt-3 text-body text-muted">
            Discover conversations, opportunities, updates, and people from across the VAEL network.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <SearchInput
            label="Search community"
            placeholder="Search community..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-64"
          />
          <Button
            className="rounded-full"
            onClick={() => (session.signedIn ? setComposerOpen(true) : requireSignIn())}
          >
            + Create Post
          </Button>
        </div>
      </div>

      {!searching ? (
        <div className="mt-6 overflow-x-auto">
          <FilterBar>
            {FEED_FILTERS.map((item) => (
              <FilterChip key={item.id} label={item.label} active={filter === item.id} onClick={() => setFilter(item.id)} />
            ))}
          </FilterBar>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div className="min-w-0">
          {searching ? (
            <SearchResultsView query={query} posts={searchedPosts} />
          ) : (
            <>
              <ComposerTeaser onOpen={() => (session.signedIn ? setComposerOpen(true) : requireSignIn())} />
              <FeedList
                items={items}
                emptyTitle="Nothing shared yet"
                emptyDescription="Community stays empty until someone shares. Be the first."
                onLike={handleLike}
                onSave={handleSave}
                onShare={handleShare}
                onComment={handleComment}
              />
            </>
          )}
        </div>
        <CommunitiesSidebar />
      </div>

      <CreatePostDialog
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        defaultDistrictId="city"
      />

      {!session.signedIn ? (
        <p className="mt-8 text-caption text-muted">
          Continue locally from Account to post, like, save, or comment. Visitors can still read.
        </p>
      ) : null}
    </CityPage>
  );
}

/** A District's own Community — the same feed, filtered to one District. */
function DistrictFeedPage({ districtId }: { districtId: CommunityDistrictId }) {
  const community = useCommunity();
  const { session, signIn } = useCitySession();
  const [tab, setTab] = useState<"feed" | "opportunity" | "discussion" | "people">("feed");
  const [composerOpen, setComposerOpen] = useState(false);
  const isCity = districtId === "city";

  const allPosts = community.posts(districtId);
  const items = useMemo(() => {
    if (tab === "opportunity") return allPosts.filter((v) => communityPostKind(v.post) === "opportunity");
    if (tab === "discussion") return allPosts.filter((v) => communityPostKind(v.post) === "discussion");
    return allPosts;
  }, [allPosts, tab]);

  const people = useMemo(() => {
    const seen = new Set<string>();
    return allPosts
      .filter((v) => {
        if (seen.has(v.post.handle)) return false;
        seen.add(v.post.handle);
        return true;
      })
      .map((v) => resolveCommunityAuthor(v.post.handle, districtId));
  }, [allPosts, districtId]);

  function handleLike(id: string) {
    if (!session.signedIn) return signIn("member");
    community.like(id);
  }
  function handleSave(id: string) {
    if (!session.signedIn) return signIn("member");
    community.save(id);
  }
  function handleShare(id: string) {
    navigator.clipboard?.writeText(`${window.location.origin}/feed/${id}`).catch(() => undefined);
  }
  function handleComment(id: string, body: string) {
    if (!session.signedIn) return signIn("member");
    community.comment(id, body);
  }

  return (
    <CityPage className="-mt-4 sm:-mt-6">
      <BackToDashboard />
      <div className="mt-4">
        <PageHeader
          title={isCity ? "City-wide" : communityDistrictLabel(districtId)}
          description={
            isCity
              ? "What people across VAEL are sharing city-wide."
              : `People, conversations, opportunities, and updates for ${communityDistrictLabel(districtId)}.`
          }
        />
      </div>

      <div className="mx-auto mt-6 max-w-3xl">
        <ComposerTeaser onOpen={() => (session.signedIn ? setComposerOpen(true) : signIn("member"))} />
      </div>

      <div className="mx-auto mt-6 max-w-3xl overflow-x-auto">
        <Tabs value={tab} onValueChange={(next) => setTab(next as typeof tab)} defaultValue="feed">
          <TabsList>
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="opportunity">Opportunities</TabsTrigger>
            <TabsTrigger value="discussion">Discussions</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mx-auto mt-6 max-w-3xl">
        {tab === "people" ? (
          people.length === 0 ? (
            <EmptyState title="No one has posted here yet" />
          ) : (
            <ul className="flex flex-col gap-3">
              {people.map((person) => (
                <li key={person.handle}>
                  <Link
                    to={communityProfileHref(districtId, person.handle)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 hover:border-[#C99A28]/30 dark:bg-white/[0.05] dark:backdrop-blur-xl dark:hover:border-accent/30"
                  >
                    <Avatar name={person.name} src={person.avatarUrl} size="sm" />
                    <span>
                      <span className="block text-body-sm font-medium text-foreground">{person.name}</span>
                      {person.headline ? <span className="block text-caption text-muted">{person.headline}</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : (
          <FeedList
            items={items}
            emptyTitle="Nothing shared yet"
            emptyDescription="Community stays empty until someone shares. Be the first."
            onLike={handleLike}
            onSave={handleSave}
            onShare={handleShare}
            onComment={handleComment}
          />
        )}
      </div>

      <CreatePostDialog open={composerOpen} onClose={() => setComposerOpen(false)} defaultDistrictId={districtId} />

      {!session.signedIn ? (
        <p className="mt-8 text-caption text-muted">
          Continue locally from Account to post, like, save, or comment. Visitors can still read.
        </p>
      ) : null}
    </CityPage>
  );
}
