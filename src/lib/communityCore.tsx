import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCitySession } from "./citySession";
import {
  addCommunityComment,
  createCommunityPost,
  deleteCommunityPost,
  getCommunityComments,
  getCommunityPost,
  getFollowedCommunityIds,
  getSavedCommunityPosts,
  getVisibleCommunityPosts,
  getMemberCommunityActivity,
  getMemberCommunityPosts,
  getMemberSavedCommunityPosts,
  isFollowingCommunity,
  subscribeCommunity,
  toggleCommunityFollow,
  toggleCommunityLike,
  toggleCommunityReaction,
  toggleCommunitySave,
  viewCommunityPost,
  type CommunityDistrictId,
  type CommunityActivityItem,
  type CommunityPost,
  type CommunityPostKind,
  type CommunityPostView,
  type CommunityReactionKind,
} from "./communityStore";
import { pushNotice } from "./vaelStore";
import { ensureDemoCommunityFeed } from "./demoJourney";

type Ctx = {
  handle: string;
  signedIn: boolean;
  posts: (districtId?: CommunityDistrictId) => CommunityPostView[];
  saved: () => CommunityPostView[];
  post: (id: string) => CommunityPostView | undefined;
  comments: typeof getCommunityComments;
  memberPosts: () => CommunityPostView[];
  memberSaved: () => CommunityPostView[];
  memberActivity: () => CommunityActivityItem[];
  publish: (input: { districtId: CommunityDistrictId; body: string; kind?: CommunityPostKind; title?: string }) => CommunityPost;
  remove: (id: string) => void;
  like: (id: string) => void;
  react: (id: string, kind: CommunityReactionKind) => void;
  save: (id: string) => void;
  comment: (postId: string, body: string) => void;
  followedCommunities: () => CommunityDistrictId[];
  isFollowingCommunity: (districtId: CommunityDistrictId) => boolean;
  followCommunity: (districtId: CommunityDistrictId) => void;
};

const CommunityContext = createContext<Ctx | null>(null);

export function CommunityCoreProvider({ children }: { children: ReactNode }) {
  const { session } = useCitySession();
  const [tick, setTick] = useState(0);

  useEffect(() => subscribeCommunity(() => setTick((n) => n + 1)), []);
  useEffect(() => {
    ensureDemoCommunityFeed();
  }, []);

  const handle = session.signedIn ? session.handle : "";

  const value = useMemo<Ctx>(
    () => ({
      handle,
      signedIn: Boolean(handle),
      posts: (districtId) =>
        getVisibleCommunityPosts(districtId).map((item) => viewCommunityPost(item, handle || undefined)),
      saved: () => getSavedCommunityPosts(handle).map((item) => viewCommunityPost(item, handle || undefined)),
      post: (id) => {
        const record = getCommunityPost(id);
        return record ? viewCommunityPost(record, handle || undefined) : undefined;
      },
      comments: getCommunityComments,
      memberPosts: () => getMemberCommunityPosts(handle).map((item) => viewCommunityPost(item, handle || undefined)),
      memberSaved: () => getMemberSavedCommunityPosts(handle).map((item) => viewCommunityPost(item, handle || undefined)),
      memberActivity: () => getMemberCommunityActivity(handle),
      publish: (input) => {
        if (!handle) throw new Error("Continue locally to share.");
        return createCommunityPost({ ...input, handle });
      },
      remove: (id) => {
        if (!handle) throw new Error("Continue locally to remove a post.");
        deleteCommunityPost(id, handle);
      },
      like: (id) => {
        if (!handle) throw new Error("Continue locally to like a post.");
        toggleCommunityLike(id, handle);
      },
      react: (id, kind) => {
        if (!handle) throw new Error("Continue locally to react to a post.");
        toggleCommunityReaction(id, handle, kind);
      },
      save: (id) => {
        if (!handle) throw new Error("Continue locally to save a post.");
        toggleCommunitySave(id, handle);
      },
      comment: (postId, body) => {
        if (!handle) throw new Error("Continue locally to comment.");
        const record = addCommunityComment({ postId, handle, body });
        const post = getCommunityPost(postId);
        if (post && post.handle !== handle) {
          pushNotice(post.handle, "New comment", `@${handle} commented on your post.`);
        }
        return record;
      },
      followedCommunities: () => (handle ? getFollowedCommunityIds(handle) : []),
      isFollowingCommunity: (districtId) => (handle ? isFollowingCommunity(districtId, handle) : false),
      followCommunity: (districtId) => {
        if (!handle) throw new Error("Continue locally to follow a Community.");
        toggleCommunityFollow(districtId, handle);
      },
    }),
    [handle, tick],
  );

  return createElement(CommunityContext.Provider, { value }, children);
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunity must be used inside CommunityCoreProvider");
  return ctx;
}
