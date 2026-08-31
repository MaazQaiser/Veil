import { CommunityPostCard } from "@/components/vael/cards";
import { EmptyState } from "@/components/ui/feedback";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useCitySession } from "@/lib/citySession";
import { useCommunity } from "@/lib/communityCore";
import {
  communityDistrictLabel,
  communityHref,
  communityProfileHref,
  formatCommunityTime,
  type CommunityPostView,
} from "@/lib/communityStore";

export function CommunityPostList({
  items,
  emptyTitle,
  emptyDescription,
  emptyHref,
  emptyActionLabel,
}: {
  items: CommunityPostView[];
  emptyTitle: string;
  emptyDescription: string;
  emptyHref?: string;
  emptyActionLabel?: string;
}) {
  const { session, signIn } = useCitySession();
  const community = useCommunity();

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          emptyHref ? (
            <Link to={emptyHref} className={buttonClassName({ variant: "outline", size: "sm" })}>
              {emptyActionLabel ?? "Open Feed"}
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <ul className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 xl:gap-6">
      {items.map((item) => (
        <li key={item.post.id}>
          <CommunityPostCard
            author={item.post.handle}
            handle={item.post.handle}
            time={formatCommunityTime(item.post.createdAt)}
            body={item.post.body}
            district={communityDistrictLabel(item.post.districtId)}
            districtHref={communityHref(item.post.districtId)}
            authorHref={communityProfileHref(item.post.districtId, item.post.handle)}
            href={`/feed/${item.post.id}`}
            likeCount={item.likeCount}
            commentCount={item.commentCount}
            liked={item.liked}
            saved={item.saved}
            onLike={
              session.signedIn
                ? () => community.like(item.post.id)
                : () => signIn("member")
            }
            onSave={
              session.signedIn
                ? () => community.save(item.post.id)
                : () => signIn("member")
            }
          />
        </li>
      ))}
    </ul>
  );
}
