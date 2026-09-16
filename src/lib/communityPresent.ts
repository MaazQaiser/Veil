import {
  type CommunityDistrictId,
  type CommunityPost,
} from "./communityStore";
import { getCxListings, getCxProfile } from "./constructionStore";
import { getCmListings, getCmProfile } from "./commercialStore";
import { getRxListings, getRxProfile } from "./residentialStore";
import { getTxListings, getTxProfile } from "./truckingStore";
import { getActiveListing, getLatestListing, getProfile } from "./vaelStore";

export type CommunityAuthor = {
  name: string;
  handle: string;
  avatarUrl?: string;
  coverUrl?: string;
  location?: string;
  headline?: string;
};

const DISTRICT_IMAGE: Record<string, string> = {
  "media-technology": "/districts/media-technology.jpg",
  construction: "/districts/construction.jpg",
  trucking: "/districts/trucking.jpg",
  residential: "/districts/residential.jpg",
  commercial: "/districts/commercial.jpg",
  city: "/scenes/community.jpg",
};

export function resolveCommunityAuthor(handle: string, districtId: CommunityDistrictId): CommunityAuthor {
  if (districtId === "construction") {
    const profile = getCxProfile(handle);
    if (profile) {
      return { name: profile.displayName, handle, location: profile.serviceArea, headline: profile.headline };
    }
  }
  if (districtId === "trucking") {
    const profile = getTxProfile(handle);
    if (profile) {
      return { name: profile.displayName, handle, location: profile.serviceLanes, headline: profile.headline };
    }
  }
  if (districtId === "residential") {
    const profile = getRxProfile(handle);
    if (profile) {
      return { name: profile.displayName, handle, location: profile.area, headline: profile.headline };
    }
  }
  if (districtId === "commercial") {
    const profile = getCmProfile(handle);
    if (profile) {
      return { name: profile.displayName, handle, location: profile.area, headline: profile.headline };
    }
  }

  const profile = getProfile(handle);
  return {
    name: profile?.displayName || `@${handle}`,
    handle,
    avatarUrl: profile?.avatarUrl,
    coverUrl: profile?.coverUrl,
    location: profile?.location,
    headline: profile?.headline,
  };
}

export function communityPostLocation(post: CommunityPost, author: CommunityAuthor) {
  return post.location || author.location || undefined;
}

export function communityPostImage(post: CommunityPost, author: CommunityAuthor) {
  return author.coverUrl || DISTRICT_IMAGE[post.districtId] || "/scenes/community.jpg";
}

export function communityHandshakeHref(handle: string, districtId: CommunityDistrictId) {
  if (districtId === "construction") {
    const listing = getCxListings().find((item) => item.handle === handle);
    return listing ? `/districts/contractor/board/${listing.id}` : undefined;
  }
  if (districtId === "trucking") {
    const listing = getTxListings().find((item) => item.handle === handle);
    return listing ? `/districts/trucking/board/${listing.id}` : undefined;
  }
  if (districtId === "residential") {
    const listing = getRxListings().find((item) => item.handle === handle);
    return listing ? `/districts/residential/board/${listing.id}` : undefined;
  }
  if (districtId === "commercial") {
    const listing = getCmListings().find((item) => item.handle === handle);
    return listing ? `/districts/commercial/board/${listing.id}` : undefined;
  }
  const listing = getActiveListing(handle) ?? getLatestListing(handle);
  return listing ? `/media-technology/board/${listing.id}` : undefined;
}
