import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { FilterBar, FilterChip } from "@/components/ui/search";
import { buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { CommunityPostList } from "@/components/community/CommunityPostList";
import { DistrictStatus } from "@/components/vael/status";
import { useCitySession } from "@/lib/citySession";
import { useCommunity } from "@/lib/communityCore";
import {
  LIVE_COMMUNITY_DISTRICTS,
  communityBoardHref,
  communityDistrictFromLot,
  communityDistrictLabel,
  communityRoomHref,
  type CommunityDistrictId,
} from "@/lib/communityStore";
import { districtBySlug, districtFromPath, isDistrictEnterable } from "@/lib/districts";

export function FeedPage() {
  return <CommunityFeed districtId="city" />;
}

export function DistrictCommunityPage() {
  const { pathname } = useLocation();
  const district = districtFromPath(pathname);
  if (!district) {
    return (
      <CityPage>
        <ErrorUnavailable title="Community not found" />
      </CityPage>
    );
  }
  if (!isDistrictEnterable(district)) {
    return <UnavailableCommunityPage />;
  }
  const id = communityDistrictFromLot(district);
  if (!id) {
    return <UnavailableCommunityPage />;
  }
  return <CommunityFeed districtId={id} />;
}

export function UnavailableCommunityPage() {
  const { pathname } = useLocation();
  const district = districtFromPath(pathname) ?? districtBySlug(pathname.split("/")[2]);
  const status = district?.status ?? "soon";
  const label = status === "early" ? "Early Access" : status === "future" ? "Future" : "Coming Soon";
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Community"
        title={district?.name ?? "District Community"}
        description={`${label}. There is no Community for this lot until it is a live Room.`}
        crumbs={[
          { label: "City", href: "/" },
          { label: "Feed", href: "/feed" },
          { label: district?.name ?? "District" },
        ]}
        actions={district ? <DistrictStatus status={district.status} /> : undefined}
      />
      <Alert tone="info" title={label} className="mt-6">
        This kit does not invent discussion for unfinished lots. Open a live Room, or read the City feed.
      </Alert>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/feed" className={buttonClassName()}>
          City Feed
        </Link>
        <Link to="/districts" className={buttonClassName({ variant: "outline" })}>
          Districts
        </Link>
      </div>
    </CityPage>
  );
}

function ErrorUnavailable({ title }: { title: string }) {
  return (
    <>
      <PageHeader kicker="Community" title={title} />
      <EmptyState
        title={title}
        action={
          <Link to="/feed" className={buttonClassName({ variant: "outline" })}>
            City Feed
          </Link>
        }
      />
    </>
  );
}

function CommunityFeed({ districtId }: { districtId: CommunityDistrictId }) {
  const community = useCommunity();
  const { session } = useCitySession();
  const [filter, setFilter] = useState<"all" | "saved" | CommunityDistrictId>(
    districtId === "city" ? "all" : districtId,
  );
  const isCity = districtId === "city";
  const createTo = isCity ? "/feed/new" : `/feed/new?district=${districtId}`;

  const items = useMemo(() => {
    if (filter === "saved") return community.saved();
    if (filter === "all") return community.posts();
    return community.posts(filter);
  }, [community, filter]);

  const title = isCity ? "Feed" : `${communityDistrictLabel(districtId)} Community`;
  const description = isCity
    ? "What people on this device are sharing in live Rooms. This is not a social network."
    : `Discussion in ${communityDistrictLabel(districtId)}. Matching and Handshake stay in the Room.`;

  return (
    <CityPage>
      <PageHeader
        kicker={isCity ? "City" : "Community"}
        title={title}
        description={description}
        crumbs={
          isCity
            ? [
                { label: "City", href: "/" },
                { label: "Feed" },
              ]
            : [
                { label: "City", href: "/" },
                { label: communityDistrictLabel(districtId), href: communityRoomHref(districtId) },
                { label: "Community" },
              ]
        }
        primaryAction={
          <Link to={createTo} className={buttonClassName()}>
            Share
          </Link>
        }
        secondaryAction={
          isCity ? (
            <Link to="/districts" className={buttonClassName({ variant: "outline" })}>
              Districts
            </Link>
          ) : (
            <Link to={communityBoardHref(districtId)} className={buttonClassName({ variant: "outline" })}>
              Matching Board
            </Link>
          )
        }
      />

      {isCity ? (
        <div className="mt-6 overflow-x-auto">
          <FilterBar count={items.length}>
            <FilterChip label="All live Rooms" active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterChip label="City-wide" active={filter === "city"} onClick={() => setFilter("city")} />
            {LIVE_COMMUNITY_DISTRICTS.filter((id) => id !== "city").map((id) => (
              <FilterChip
                key={id}
                label={communityDistrictLabel(id)}
                active={filter === id}
                onClick={() => setFilter(id)}
              />
            ))}
            {session.signedIn ? (
              <FilterChip label="Saved" active={filter === "saved"} onClick={() => setFilter("saved")} />
            ) : null}
          </FilterBar>
        </div>
      ) : (
        <p className="mt-6 text-body-sm text-muted">
          <Link to={communityRoomHref(districtId)} className="underline">
            Open {communityDistrictLabel(districtId)}
          </Link>
          {" · "}
          <Link to="/feed" className="underline">
            City Feed
          </Link>
        </p>
      )}

      <CommunityPostList
        items={items}
        emptyTitle={filter === "saved" ? "No saved posts" : "Nothing shared yet"}
        emptyDescription={
          filter === "saved"
            ? "Save a post from the feed to read it later on this device."
            : "Community stays empty until someone on this device shares. Unfinished lots do not appear here."
        }
        emptyHref={filter === "saved" ? "/feed" : session.signedIn ? "/feed/new" : "/account"}
        emptyActionLabel={filter === "saved" ? "Open Feed" : session.signedIn ? "Share" : "Continue locally"}
      />

      {!session.signedIn ? (
        <p className="mt-8 text-caption text-muted">
          Continue locally from Account to share, like, save, or comment. Visitors can still read.
        </p>
      ) : null}
    </CityPage>
  );
}
