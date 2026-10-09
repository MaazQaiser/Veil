import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { IconBookmark, IconMessageCircle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useCitySession } from "@/lib/citySession";
import { resolveCommunityAuthor } from "@/lib/communityPresent";
import {
  communityPostKind,
  communityPostKindLabel,
  communityProfileHref,
  formatCommunityTime,
  type CommunityPostKind,
  type CommunityPostView,
  type CommunityReactionKind,
} from "@/lib/communityStore";

const BODY_TRUNCATE = 220;

function kindBadgeLabel(kind: CommunityPostKind) {
  if (kind === "collaboration") return "Highlight";
  return communityPostKindLabel(kind);
}

function ReactionButton({
  pressed,
  onClick,
  label,
  count,
  children,
}: {
  pressed?: boolean;
  onClick: () => void;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={`${label}, ${count}`}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-caption font-medium motion-safe:transition-colors",
        pressed
          ? "border-white/25 bg-white/[0.07] text-foreground dark:border-white/25"
          : "border-border text-muted hover:border-white/20 hover:text-foreground dark:border-white/15",
      )}
    >
      {children}
      <span>{count}</span>
    </button>
  );
}

/** One feed post — author, kind chip, title, body, then reactions. */
export function PostCard({
  view,
  onReact,
  onSave,
  onComment,
}: {
  view: CommunityPostView;
  onReact: (kind: CommunityReactionKind) => void;
  onSave: () => void;
  onComment: (body: string) => void;
}) {
  const { post } = view;
  const { session } = useCitySession();
  const [expanded, setExpanded] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const author = resolveCommunityAuthor(post.handle, post.districtId);
  const kind = communityPostKind(post);
  const kindLabel = kindBadgeLabel(kind);
  const title = post.title?.trim();
  const isLong = post.body.length > BODY_TRUNCATE;
  const bodyText = !isLong || expanded ? post.body : `${post.body.slice(0, BODY_TRUNCATE).trim()}…`;

  return (
    <article className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-10px_rgba(17,17,17,0.1)] sm:p-6 dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={author.name} src={author.avatarUrl} size="sm" />
          <Link
            to={communityProfileHref(post.districtId, post.handle)}
            className="truncate text-body-sm font-medium text-[#DE7C40] hover:underline"
          >
            @{post.handle}
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="inline-flex items-center rounded-md bg-[#DE7C40]/15 px-2.5 py-1 text-caption font-medium text-[#DE7C40]">
            {kindLabel}
          </span>
          <span className="text-caption text-muted">{formatCommunityTime(post.createdAt)}</span>
        </div>
      </div>

      {title ? <h3 className="mt-3 font-sans text-body font-medium tracking-tight text-foreground">{title}</h3> : null}

      <p className={cn("whitespace-pre-wrap text-body-sm text-muted", title ? "mt-1.5" : "mt-3")}>
        {bodyText}
        {isLong && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ml-1.5 font-medium text-foreground underline underline-offset-2 hover:text-muted"
          >
            Read more
          </button>
        ) : null}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
        <ReactionButton pressed={view.liked} onClick={() => onReact("like")} label="Like" count={view.likeCount}>
          <span aria-hidden className="text-[15px] leading-none">
            👍
          </span>
        </ReactionButton>
        <ReactionButton
          pressed={view.celebrated}
          onClick={() => onReact("celebrate")}
          label="Celebrate"
          count={view.celebrateCount}
        >
          <span aria-hidden className="text-[15px] leading-none">
            🎉
          </span>
        </ReactionButton>
        <ReactionButton
          pressed={view.insighted}
          onClick={() => onReact("insight")}
          label="Insightful"
          count={view.insightCount}
        >
          <span aria-hidden className="text-[15px] leading-none">
            💡
          </span>
        </ReactionButton>
        <ReactionButton
          pressed={replyOpen}
          onClick={() => setReplyOpen((value) => !value)}
          label="Comment"
          count={view.commentCount}
        >
          <IconMessageCircle className="h-3.5 w-3.5" aria-hidden />
        </ReactionButton>
        <ReactionButton pressed={view.saved} onClick={onSave} label="Save" count={view.saveCount}>
          <IconBookmark className={cn("h-3.5 w-3.5", view.saved && "fill-current")} aria-hidden />
        </ReactionButton>
      </div>

      {replyOpen ? (
        <form
          className="mt-4 flex items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const body = reply.trim();
            if (!body) return;
            onComment(body);
            setReply("");
          }}
        >
          <Avatar name={session.signedIn ? session.handle : "You"} size="sm" />
          <input
            type="text"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="What are your thoughts?"
            className="h-12 flex-1 rounded-md border border-border bg-surface px-4 text-body text-foreground placeholder:text-quiet focus-visible:border-foreground focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(17,17,17,0.06)] dark:focus-visible:border-accent dark:focus-visible:shadow-[0_0_0_3px_rgba(255,157,69,0.2)]"
          />
          {reply.trim() ? (
            <button
              type="submit"
              className="h-12 shrink-0 rounded-md bg-[#DE7C40] px-5 text-button font-medium text-[#0B0C0C] hover:bg-[#E89E6E]"
            >
              Reply
            </button>
          ) : null}
        </form>
      ) : null}
    </article>
  );
}
