/**
 * Local Community store.
 *
 * Matches the original product model documented in the audit pack:
 * posts, comments, reactions (like), saves. Keys stay on this device.
 *
 * Does not invent posts for unfinished lots. Empty stays honest until a member
 * publishes, or until the client demo seeds labeled sample-on-this-device posts.
 * No media, polls, events, or share graph.
 */

import { districts, isDistrictEnterable, type CityDistrict } from "./districts";
import type { VaelDistrictId } from "./vaelStore";

const KEYS = {
  posts: "vael_community_posts_v1",
  comments: "vael_community_comments_v1",
  reactions: "vael_community_reactions_v1",
  saves: "vael_community_saves_v1",
} as const;

export type CommunityDistrictId = VaelDistrictId | "city";

export type CommunityPost = {
  id: string;
  handle: string;
  districtId: CommunityDistrictId;
  body: string;
  createdAt: string;
  deletedAt?: string;
};

export type CommunityComment = {
  id: string;
  postId: string;
  handle: string;
  body: string;
  createdAt: string;
};

export type CommunityReaction = {
  postId: string;
  handle: string;
  kind: "like";
};

export type CommunitySave = {
  postId: string;
  handle: string;
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeCommunity(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const LIVE_COMMUNITY_DISTRICTS: CommunityDistrictId[] = [
  "city",
  "media-technology",
  "construction",
  "trucking",
  "residential",
  "commercial",
];

export function isLiveCommunityDistrict(idValue: string): idValue is CommunityDistrictId {
  return LIVE_COMMUNITY_DISTRICTS.includes(idValue as CommunityDistrictId);
}

export function communityDistrictLabel(idValue: CommunityDistrictId) {
  if (idValue === "city") return "City";
  return districts.find((item) => item.id === idValue)?.name ?? idValue;
}

export function communityHref(idValue: CommunityDistrictId) {
  if (idValue === "city") return "/feed";
  if (idValue === "media-technology") return "/media-technology/community";
  if (idValue === "construction") return "/districts/contractor/community";
  if (idValue === "trucking") return "/districts/trucking/community";
  if (idValue === "residential") return "/districts/residential/community";
  return "/districts/commercial/community";
}

export function communityRoomHref(idValue: CommunityDistrictId) {
  if (idValue === "city") return "/districts";
  if (idValue === "media-technology") return "/media-technology";
  if (idValue === "construction") return "/districts/contractor";
  if (idValue === "trucking") return "/districts/trucking";
  if (idValue === "residential") return "/districts/residential";
  return "/districts/commercial";
}

export function communityBoardHref(idValue: CommunityDistrictId) {
  if (idValue === "city") return "/districts";
  return `${communityRoomHref(idValue)}/board`;
}

export function communityProfileHref(idValue: CommunityDistrictId, handle: string) {
  if (idValue === "city") return `/media-technology/profile/${handle}`;
  return `${communityRoomHref(idValue)}/profile/${handle}`;
}

export function communityDistrictFromLot(district: CityDistrict): CommunityDistrictId | undefined {
  if (!isDistrictEnterable(district)) return undefined;
  if (isLiveCommunityDistrict(district.id)) return district.id;
  return undefined;
}

export function formatCommunityTime(iso: string) {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const delta = Date.now() - then;
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString();
}

export function getCommunityPosts(): CommunityPost[] {
  return read<CommunityPost[]>(KEYS.posts, []);
}

export function getVisibleCommunityPosts(districtId?: CommunityDistrictId) {
  return getCommunityPosts()
    .filter((item) => !item.deletedAt)
    .filter((item) => (districtId ? item.districtId === districtId : true))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getCommunityPost(idValue: string) {
  return getCommunityPosts().find((item) => item.id === idValue);
}

/** Demo-only. Adds missing posts by id. Does not overwrite member posts. */
export function ensureCommunityPosts(posts: CommunityPost[]) {
  if (typeof localStorage === "undefined") return;
  const existing = getCommunityPosts();
  const ids = new Set(existing.map((item) => item.id));
  const add = posts.filter((item) => !ids.has(item.id));
  if (add.length === 0) return;
  write(KEYS.posts, [...existing, ...add]);
}

export function createCommunityPost(input: { handle: string; districtId: CommunityDistrictId; body: string }) {
  const body = input.body.trim();
  if (!body) throw new Error("Write something to share.");
  if (!isLiveCommunityDistrict(input.districtId)) {
    throw new Error("Community is only open for live Rooms and the City feed.");
  }
  const post: CommunityPost = {
    id: id("cpost"),
    handle: input.handle,
    districtId: input.districtId,
    body,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.posts, [...getCommunityPosts(), post]);
  return post;
}

export function deleteCommunityPost(idValue: string, handle: string) {
  const post = getCommunityPost(idValue);
  if (!post || post.handle !== handle) throw new Error("You can only remove your own post.");
  write(
    KEYS.posts,
    getCommunityPosts().map((item) =>
      item.id === idValue ? { ...item, deletedAt: new Date().toISOString() } : item,
    ),
  );
}

export function getCommunityComments(postId: string) {
  return read<CommunityComment[]>(KEYS.comments, [])
    .filter((item) => item.postId === postId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function addCommunityComment(input: { postId: string; handle: string; body: string }) {
  const post = getCommunityPost(input.postId);
  if (!post || post.deletedAt) throw new Error("This post is not available.");
  const body = input.body.trim();
  if (!body) throw new Error("Write a comment.");
  const comment: CommunityComment = {
    id: id("ccom"),
    postId: input.postId,
    handle: input.handle,
    body,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.comments, [...read<CommunityComment[]>(KEYS.comments, []), comment]);
  return comment;
}

export function getCommunityLikes(postId: string) {
  return read<CommunityReaction[]>(KEYS.reactions, []).filter((item) => item.postId === postId && item.kind === "like");
}

export function hasLikedCommunityPost(postId: string, handle: string) {
  return getCommunityLikes(postId).some((item) => item.handle === handle);
}

export function toggleCommunityLike(postId: string, handle: string) {
  const post = getCommunityPost(postId);
  if (!post || post.deletedAt) throw new Error("This post is not available.");
  const all = read<CommunityReaction[]>(KEYS.reactions, []);
  const exists = all.some((item) => item.postId === postId && item.handle === handle && item.kind === "like");
  write(
    KEYS.reactions,
    exists
      ? all.filter((item) => !(item.postId === postId && item.handle === handle && item.kind === "like"))
      : [...all, { postId, handle, kind: "like" as const }],
  );
  return !exists;
}

export function getCommunitySaves(handle: string) {
  return read<CommunitySave[]>(KEYS.saves, []).filter((item) => item.handle === handle);
}

export function hasSavedCommunityPost(postId: string, handle: string) {
  return getCommunitySaves(handle).some((item) => item.postId === postId);
}

export function toggleCommunitySave(postId: string, handle: string) {
  const post = getCommunityPost(postId);
  if (!post || post.deletedAt) throw new Error("This post is not available.");
  const all = read<CommunitySave[]>(KEYS.saves, []);
  const exists = all.some((item) => item.postId === postId && item.handle === handle);
  write(
    KEYS.saves,
    exists ? all.filter((item) => !(item.postId === postId && item.handle === handle)) : [...all, { postId, handle }],
  );
  return !exists;
}

export function getSavedCommunityPosts(handle: string) {
  const ids = new Set(getCommunitySaves(handle).map((item) => item.postId));
  return getVisibleCommunityPosts().filter((item) => ids.has(item.id));
}

export type CommunityPostView = {
  post: CommunityPost;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
};

export function viewCommunityPost(post: CommunityPost, handle?: string): CommunityPostView {
  return {
    post,
    likeCount: getCommunityLikes(post.id).length,
    commentCount: getCommunityComments(post.id).length,
    liked: handle ? hasLikedCommunityPost(post.id, handle) : false,
    saved: handle ? hasSavedCommunityPost(post.id, handle) : false,
  };
}
