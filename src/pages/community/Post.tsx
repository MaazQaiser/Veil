import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/controls";
import { Avatar } from "@/components/ui/avatar";
import { IconChevronLeft, IconHeart } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { CityPage } from "@/components/city/CityShell";
import { useCitySession } from "@/lib/citySession";
import { useCommunity } from "@/lib/communityCore";
import {
  LIVE_COMMUNITY_DISTRICTS,
  communityDistrictLabel,
  communityHref,
  communityPostKind,
  communityPostKindLabel,
  communityPostTitle,
  communityProfileHref,
  formatCommunityTime,
  isLiveCommunityDistrict,
  type CommunityDistrictId,
} from "@/lib/communityStore";
import {
  communityHandshakeHref,
  communityPostImage,
  communityPostLocation,
  resolveCommunityAuthor,
} from "@/lib/communityPresent";

export function CreatePostPage() {
  const { session, signIn } = useCitySession();
  const community = useCommunity();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requested = params.get("district") || "city";
  const initial = isLiveCommunityDistrict(requested) ? requested : "city";
  const [districtId, setDistrictId] = useState<CommunityDistrictId>(initial);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"editing" | "publishing" | "success" | "error">("editing");
  const [error, setError] = useState("");

  if (!session.signedIn) {
    return (
      <CityPage width="narrow">
        <PageHeader
          kicker="Community"
          title="Share"
          description="A local handle is required. This still stays on this device."
          crumbs={[
            { label: "Feed", href: "/feed" },
            { label: "Share" },
          ]}
        />
        <p className="mt-6 text-body-sm text-muted">Continue locally to publish a post.</p>
        <Button className="mt-4" onClick={() => signIn("member")}>
          Continue locally
        </Button>
        <p className="mt-4">
          <Link to="/feed" className={buttonClassName({ variant: "ghost" })}>
            Back to Feed
          </Link>
        </p>
      </CityPage>
    );
  }

  function publish() {
    setStatus("publishing");
    try {
      const post = community.publish({ districtId, body });
      setError("");
      setStatus("success");
      navigate(`/feed/${post.id}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "The post could not be saved on this device.");
    }
  }

  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Community"
        title="Share"
        description="Say what is useful. Choose a live Room if this belongs in a district."
        crumbs={[
          { label: "Feed", href: "/feed" },
          { label: "Share" },
        ]}
      />
      <form
        className="mt-8 space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          publish();
        }}
      >
        <Field label="What do you want to share?" htmlFor="body" required>
          <Textarea id="body" value={body} onChange={(event) => setBody(event.target.value)} />
        </Field>
        <Field
          label="Context"
          htmlFor="district"
          hint="City-wide, or a live Room. Coming Soon lots are not listed."
        >
          <Select
            id="district"
            value={districtId}
            onChange={(event) => setDistrictId(event.target.value as CommunityDistrictId)}
          >
            {LIVE_COMMUNITY_DISTRICTS.map((id) => (
              <option key={id} value={id}>
                {communityDistrictLabel(id)}
              </option>
            ))}
          </Select>
        </Field>
        {error ? (
          <p role="alert" className="text-caption text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={status === "publishing"}>
            Publish
          </Button>
          <Link to={communityHref(districtId)} className={buttonClassName({ variant: "ghost" })}>
            Cancel
          </Link>
        </div>
      </form>
    </CityPage>
  );
}

export function PostDetailPage() {
  const { postId } = useParams();
  const { session, signIn } = useCitySession();
  const community = useCommunity();
  const view = postId ? community.post(postId) : undefined;
  const comments = postId ? community.comments(postId) : [];
  const [draft, setDraft] = useState("");
  const [commentStatus, setCommentStatus] = useState<"default" | "posting" | "error">("default");
  const [commentError, setCommentError] = useState("");

  if (!view) {
    return (
      <CityPage>
        <ErrorState
          title="This post is not available"
          description="It may have been removed, or it was never on this device."
          action={
            <Link to="/feed" className={buttonClassName({ variant: "outline" })}>
              City Feed
            </Link>
          }
        />
      </CityPage>
    );
  }

  const { post } = view;
  const unavailable = Boolean(post.deletedAt);
  const mine = session.signedIn && session.handle === post.handle;
  const author = resolveCommunityAuthor(post.handle, post.districtId);
  const kind = communityPostKind(post);
  const kindLabel = communityPostKindLabel(kind);
  const title = communityPostTitle(post);
  const location = communityPostLocation(post, author);
  const image = communityPostImage(post, author);
  const handshakeTo = kind === "discussion" ? undefined : communityHandshakeHref(post.handle, post.districtId);
  const districtLabel = communityDistrictLabel(post.districtId);

  if (unavailable) {
    return (
      <CityPage width="narrow">
        <EmptyState
          title="This post was removed"
          description="Removed posts stay off the feed. Nothing is recovered from another device."
          action={
            <Link to="/feed" className={buttonClassName({ variant: "outline" })}>
              City Feed
            </Link>
          }
        />
      </CityPage>
    );
  }

  function sendComment() {
    if (!postId) return;
    setCommentStatus("posting");
    try {
      community.comment(postId, draft);
      setDraft("");
      setCommentError("");
      setCommentStatus("default");
    } catch (err) {
      setCommentStatus("error");
      setCommentError(err instanceof Error ? err.message : "The comment could not be saved.");
    }
  }

  return (
    <CityPage width="wide" className="-mt-4 sm:-mt-6">
      <Link
        to={communityHref(post.districtId)}
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
      >
        <IconChevronLeft className="h-3.5 w-3.5" />
        Back to {districtLabel}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={communityHref(post.districtId)}
              className="text-body-sm font-semibold text-foreground hover:underline"
            >
              {districtLabel}
            </Link>
            <span className="inline-flex items-center rounded-full bg-[#FFC555]/15 px-2.5 py-1 text-caption font-semibold text-[#C99A28] dark:bg-accent/15 dark:text-accent">
              {kindLabel}
            </span>
          </div>

          {title ? <h1 className="mt-3 text-h4 font-semibold text-foreground">{title}</h1> : null}
          <p className="mt-3 text-body whitespace-pre-wrap">{post.body}</p>

          {image ? (
            <div className="mt-5 aspect-[21/9] max-h-64 overflow-hidden rounded-2xl bg-surface-muted">
              <img src={image} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border-subtle pt-4 text-body-sm">
            {session.signedIn ? (
              <>
                <button
                  type="button"
                  aria-pressed={view.liked}
                  onClick={() => community.like(post.id)}
                  className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-destructive aria-pressed:text-destructive"
                >
                  <IconHeart className={cn("h-4 w-4", view.liked && "fill-current")} aria-hidden />
                  {view.likeCount}
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(window.location.href).catch(() => undefined)}
                  className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-foreground"
                >
                  <span aria-hidden>↗</span>
                  Share
                </button>
                {mine ? (
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => community.remove(post.id)}>
                    Remove post
                  </Button>
                ) : null}
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => signIn("member")}>
                Continue locally to like or save
              </Button>
            )}
          </div>

          <section className="mt-8">
            <p className="vael-kicker">Comments</p>
            {comments.length === 0 ? (
              <p className="mt-3 text-body-sm text-muted">No comments yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {comments.map((item) => (
                  <li key={item.id}>
                    <p className="text-caption">
                      <Link
                        to={communityProfileHref(post.districtId, item.handle)}
                        className="font-semibold hover:underline"
                      >
                        @{item.handle}
                      </Link>
                      <span className="text-muted"> · {formatCommunityTime(item.createdAt)}</span>
                    </p>
                    <p className="mt-1 text-body-sm">{item.body}</p>
                  </li>
                ))}
              </ul>
            )}

            {session.signedIn ? (
              <form
                className="mt-6 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendComment();
                }}
              >
                <label htmlFor="comment" className="sr-only">
                  Comment
                </label>
                <Textarea
                  id="comment"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  placeholder="What are your thoughts?"
                />
                {commentError ? (
                  <p role="alert" className="text-caption text-destructive">
                    {commentError}
                  </p>
                ) : null}
                <Button type="submit" size="sm" className="rounded-full" loading={commentStatus === "posting"}>
                  Comment
                </Button>
              </form>
            ) : (
              <p className="mt-4 text-body-sm text-muted">Continue locally to comment.</p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-white p-5 dark:bg-white/[0.05] dark:backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
              <Avatar name={author.name} src={author.avatarUrl} size="lg" className="ring-2 ring-[#FFC555]/30" />
              <div className="min-w-0">
                <Link
                  to={communityProfileHref(post.districtId, post.handle)}
                  className="block truncate text-body-sm font-semibold text-foreground hover:underline"
                >
                  {author.name}
                </Link>
                {author.headline ? <p className="truncate text-caption text-muted">{author.headline}</p> : null}
                <p className="text-caption text-quiet">
                  Posted {formatCommunityTime(post.createdAt)}
                  {location ? ` · ${location}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-4">
            {session.signedIn ? (
              <div className="space-y-2">
                {!mine && handshakeTo ? (
                  <Link to={handshakeTo} className={buttonClassName({ className: "w-full rounded-full" })}>
                    Request Handshake
                  </Link>
                ) : null}
                <button
                  type="button"
                  aria-pressed={view.saved}
                  onClick={() => community.save(post.id)}
                  className={buttonClassName({
                    variant: "outline",
                    className: "w-full rounded-full",
                  })}
                >
                  {view.saved ? "Saved" : "Save post"}
                </button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => signIn("member")}>
                Continue locally
              </Button>
            )}
            </div>
          </div>

        </aside>
      </div>
    </CityPage>
  );
}

