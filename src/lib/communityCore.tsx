import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCitySession } from "./citySession";
import {
  addCommunityComment,
  createCommunityPost,
  deleteCommunityPost,
  getCommunityComments,
  getCommunityPost,
  getSavedCommunityPosts,
  getVisibleCommunityPosts,
  subscribeCommunity,
  toggleCommunityLike,
  toggleCommunitySave,
  viewCommunityPost,
  type CommunityDistrictId,
  type CommunityPost,
  type CommunityPostView,
} from "./communityStore";
import { pushNotice } from "./vaelStore";

type Ctx = {
  handle: string;
  signedIn: boolean;
  posts: (districtId?: CommunityDistrictId) => CommunityPostView[];
  saved: () => CommunityPostView[];
  post: (id: string) => CommunityPostView | undefined;
  comments: typeof getCommunityComments;
  publish: (input: { districtId: CommunityDistrictId; body: string }) => CommunityPost;
  remove: (id: string) => void;
  like: (id: string) => void;
  save: (id: string) => void;
  comment: (postId: string, body: string) => void;
};

const CommunityContext = createContext<Ctx | null>(null);

export function CommunityCoreProvider({ children }: { children: ReactNode }) {
  const { session } = useCitySession();
  const [tick, setTick] = useState(0);

  useEffect(() => subscribeCommunity(() => setTick((n) => n + 1)), []);

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
