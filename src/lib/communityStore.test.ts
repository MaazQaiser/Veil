import { describe, expect, it, beforeEach } from "vitest";
import {
  addCommunityComment,
  communityPostKind,
  communityPostTitle,
  createCommunityPost,
  deleteCommunityPost,
  getCommunityComments,
  getSavedCommunityPosts,
  getVisibleCommunityPosts,
  hasLikedCommunityPost,
  hasSavedCommunityPost,
  inferCommunityPostKind,
  isLiveCommunityDistrict,
  toggleCommunityLike,
  toggleCommunitySave,
} from "./communityStore";

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => memory.clear(),
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() {
      return memory.size;
    },
  } as Storage;
});

describe("Community local store", () => {
  it("treats only live Rooms plus the City as community districts", () => {
    expect(isLiveCommunityDistrict("city")).toBe(true);
    expect(isLiveCommunityDistrict("commercial")).toBe(true);
    expect(isLiveCommunityDistrict("nursing-healthcare")).toBe(false);
    expect(isLiveCommunityDistrict("real-estate")).toBe(false);
  });

  it("starts empty and does not invent posts", () => {
    expect(getVisibleCommunityPosts()).toEqual([]);
  });

  it("publishes a member post to a live district and lists it on the City feed", () => {
    createCommunityPost({ handle: "member", districtId: "construction", body: "Looking for a crew this cycle." });
    expect(getVisibleCommunityPosts()).toHaveLength(1);
    expect(getVisibleCommunityPosts("construction")).toHaveLength(1);
    expect(getVisibleCommunityPosts("city")).toHaveLength(0);
    expect(getVisibleCommunityPosts("trucking")).toHaveLength(0);
  });

  it("refuses posts for unfinished lots", () => {
    expect(() =>
      createCommunityPost({
        handle: "member",
        districtId: "nursing-healthcare" as "city",
        body: "Should not publish",
      }),
    ).toThrow(/live Rooms/);
  });

  it("supports like, save, comment, and author delete", () => {
    const post = createCommunityPost({ handle: "member", districtId: "city", body: "City note." });
    toggleCommunityLike(post.id, "member");
    toggleCommunitySave(post.id, "member");
    addCommunityComment({ postId: post.id, handle: "member", body: "Following up." });
    expect(hasLikedCommunityPost(post.id, "member")).toBe(true);
    expect(hasSavedCommunityPost(post.id, "member")).toBe(true);
    expect(getSavedCommunityPosts("member")).toHaveLength(1);
    expect(getCommunityComments(post.id)).toHaveLength(1);
    deleteCommunityPost(post.id, "member");
    expect(getVisibleCommunityPosts()).toHaveLength(0);
  });

  it("infers post kind and title from the body when they are not stored", () => {
    expect(inferCommunityPostKind("Looking for a Creative Director this cycle.")).toBe("looking-for");
    expect(inferCommunityPostKind("Offering capacity on a West Coast lane.")).toBe("offering");
    expect(inferCommunityPostKind("Want to collaborate on a renovation scope.")).toBe("collaboration");
    expect(inferCommunityPostKind("Need a facilities lead for a downtown build-out.")).toBe("opportunity");
    expect(inferCommunityPostKind("How are crews handling seasonal turnover?")).toBe("discussion");

    const post = createCommunityPost({
      handle: "member",
      districtId: "city",
      body: "Looking for a Creative Director this cycle to lead a design-systems engagement.",
    });
    expect(communityPostKind(post)).toBe("looking-for");
    expect(communityPostTitle(post)).toBe("Looking for a Creative Director this cycle to lead a design-systems engagement");
  });
});
