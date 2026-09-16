import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import {
  IconBriefcase,
  IconEdit,
  IconHash,
  IconHeart,
  IconMessageCircle,
  IconMoreVertical,
  IconUsers,
} from "@/components/ui/icons";
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
} from "@/lib/communityStore";

const BODY_TRUNCATE = 220;

const KIND_ICON: Record<CommunityPostKind, typeof IconEdit> = {
  update: IconEdit,
  opportunity: IconBriefcase,
  "looking-for": IconUsers,
  offering: IconUsers,
  collaboration: IconHash,
  discussion: IconMessageCircle,
};

/** One social-feed post — the same shape everywhere: global feed, a District feed, search results. */
export function PostCard({
  view,
  onLike,
  onSave,
  onShare,
  onComment,
}: {
  view: CommunityPostView;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onComment: (body: string) => void;
}) {
  const { post } = view;
  const { session } = useCitySession();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reply, setReply] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const author = resolveCommunityAuthor(post.handle, post.districtId);
  const kind = communityPostKind(post);
  const kindLabel = kind === "collaboration" ? "Highlight" : communityPostKindLabel(kind);
  const KindIcon = KIND_ICON[kind];
  const title = post.title?.trim();
  const isLong = post.body.length > BODY_TRUNCATE;
  const bodyText = !isLong || expanded ? post.body : `${post.body.slice(0, BODY_TRUNCATE).trim()}…`;

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  function openPost(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, textarea, form, [role='menu']")) return;
    navigate(`/feed/${post.id}`);
  }

  return (
    <article
      onClick={openPost}
      className="cursor-pointer rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-10px_rgba(17,17,17,0.1)] sm:p-6 dark:bg-white/[0.05] dark:backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC555]/15 px-2.5 py-1 text-caption font-semibold text-[#C99A28] dark:bg-accent/15 dark:text-accent">
          <KindIcon className="h-3.5 w-3.5" aria-hidden />
          {kindLabel}
        </span>
        <div ref={menuRef} className="relative flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-pressed={view.saved}
            onClick={onSave}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-caption font-medium",
              view.saved
                ? "border-transparent bg-surface-muted text-foreground"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {view.saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Post options"
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-quiet hover:bg-surface-muted hover:text-foreground"
          >
            <IconMoreVertical className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              aria-label="Post options"
              className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-border bg-surface-elevated p-1 shadow-md"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onShare();
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-body-sm text-foreground hover:bg-surface-muted"
              >
                Copy link
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Avatar name={author.name} src={author.avatarUrl} size="md" />
        <div className="min-w-0">
          <Link
            to={communityProfileHref(post.districtId, post.handle)}
            className="block text-body-sm font-semibold text-foreground hover:underline"
          >
            {author.name}
          </Link>
          <p className="text-caption text-muted">{formatCommunityTime(post.createdAt)}</p>
        </div>
      </div>

      {title ? <h3 className="mt-4 text-body-lg font-semibold text-foreground">{title}</h3> : null}

      <p className="mt-2 whitespace-pre-wrap text-body-sm text-foreground">
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

      <div className="mt-4 flex items-center gap-4 text-body-sm">
        <button
          type="button"
          aria-pressed={view.liked}
          onClick={onLike}
          className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-destructive aria-pressed:text-destructive"
        >
          <IconHeart className={cn("h-4 w-4", view.liked && "fill-current")} aria-hidden />
          {view.likeCount}
        </button>
        <span className="inline-flex items-center gap-1.5 font-medium text-muted">
          <IconMessageCircle className="h-4 w-4" aria-hidden />
          {view.commentCount}
        </span>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-foreground"
        >
          <span aria-hidden>↗</span>
          Share
        </button>
      </div>

      <form
        className="mt-4 flex items-center gap-3 border-t border-border-subtle pt-4"
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
          className="flex-1 rounded-full border border-border-subtle bg-surface-muted px-4 py-2 text-body-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#FFC555]/40 dark:focus:ring-accent/40"
        />
        {reply.trim() ? (
          <button
            type="submit"
            className="shrink-0 rounded-full bg-[#FFC555] px-4 py-2 text-caption font-semibold text-[#0B0C0C] hover:bg-[#FFC555]/90 dark:bg-accent dark:text-primary-foreground dark:hover:bg-accent-hover"
          >
            Reply
          </button>
        ) : null}
      </form>
    </article>
  );
}
