import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, buttonClassName } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/controls";
import { CityPage } from "@/components/city/CityShell";
import { useCitySession } from "@/lib/citySession";
import { useCommunity } from "@/lib/communityCore";
import {
  LIVE_COMMUNITY_DISTRICTS,
  communityBoardHref,
  communityDistrictLabel,
  communityHref,
  communityProfileHref,
  communityRoomHref,
  formatCommunityTime,
  isLiveCommunityDistrict,
  type CommunityDistrictId,
} from "@/lib/communityStore";

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
    <CityPage width="narrow">
      <PageHeader
        kicker={communityDistrictLabel(post.districtId)}
        title="Post"
        description={formatCommunityTime(post.createdAt)}
        crumbs={[
          { label: "Feed", href: "/feed" },
          { label: communityDistrictLabel(post.districtId), href: communityHref(post.districtId) },
          { label: "Post" },
        ]}
      />

      <article className="mt-8">
        <p className="text-body-sm">
          <Link
            to={communityProfileHref(post.districtId, post.handle)}
            className="font-semibold hover:underline"
          >
            @{post.handle}
          </Link>
          <span className="text-muted"> · </span>
          <Link to={communityHref(post.districtId)} className="text-label text-muted hover:underline">
            {communityDistrictLabel(post.districtId)}
          </Link>
        </p>
        <p className="mt-4 text-body">{post.body}</p>
        <p className="mt-4 text-caption text-muted">
          Private profile details stay closed until Handshake. Community only shows the handle.
        </p>
      </article>

      <div className="mt-6 flex flex-wrap gap-2">
        {session.signedIn ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => community.like(post.id)}
              aria-pressed={view.liked}
            >
              {view.liked ? "Liked" : "Like"} · {view.likeCount}
            </Button>
            <Button variant="outline" size="sm" onClick={() => community.save(post.id)} aria-pressed={view.saved}>
              {view.saved ? "Saved" : "Save"}
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => signIn("member")}>
            Continue locally to like or save
          </Button>
        )}
        {mine ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              community.remove(post.id);
            }}
          >
            Remove post
          </Button>
        ) : null}
      </div>

      {post.districtId !== "city" ? (
        <div className="mt-8 space-y-2 text-body-sm">
          <p className="vael-kicker">This Room</p>
          <p>
            <Link to={communityRoomHref(post.districtId)} className="underline">
              Open {communityDistrictLabel(post.districtId)}
            </Link>
            {" · "}
            <Link to={communityBoardHref(post.districtId)} className="underline">
              Matching Board
            </Link>
          </p>
        </div>
      ) : (
        <p className="mt-8 text-body-sm">
          <Link to="/districts" className="underline">
            View districts
          </Link>
        </p>
      )}

      <section className="mt-10">
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
            <Field label="Comment" htmlFor="comment">
              <Textarea id="comment" value={draft} onChange={(event) => setDraft(event.target.value)} />
            </Field>
            {commentError ? (
              <p role="alert" className="text-caption text-destructive">
                {commentError}
              </p>
            ) : null}
            <Button type="submit" size="sm" loading={commentStatus === "posting"}>
              Comment
            </Button>
          </form>
        ) : (
          <p className="mt-4 text-body-sm text-muted">Continue locally to comment.</p>
        )}
      </section>
    </CityPage>
  );
}

