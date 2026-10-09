import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardShell, dashboardSideFromListing } from "@/components/mt/DashboardShell";
import { PostCard } from "@/components/community/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCitySession } from "@/lib/citySession";
import { useCommunity } from "@/lib/communityCore";
import { useVael } from "@/lib/vaelCore";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import {
  formatCommunityTime,
  getCommunityPost,
  type CommunityActivityItem,
} from "@/lib/communityStore";
import { resolveCommunityAuthor } from "@/lib/communityPresent";

const FEED_HREF = `${PRODUCT_HOME}/community`;

type DashTab = "posts" | "saved" | "activity";

function EmptyPanel({ title, cta }: { title: string; cta: string }) {
  return (
    <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-2xl border border-border bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)]">
      <p className="text-body text-foreground">{title}</p>
      <Link to={FEED_HREF} className="mt-3 text-body-sm font-medium text-[#DE7C40] hover:underline">
        {cta} →
      </Link>
    </div>
  );
}

function ActivityRow({ item }: { item: CommunityActivityItem }) {
  const post = getCommunityPost(item.postId);
  if (!post) return null;
  const author = resolveCommunityAuthor(post.handle, post.districtId);
  const title = post.title?.trim() || post.body.slice(0, 72);
  const verb =
    item.kind === "comment"
      ? "Commented on"
      : item.kind === "like"
        ? "Liked"
        : item.kind === "celebrate"
          ? "Celebrated"
          : item.kind === "insight"
            ? "Marked insightful"
            : "Saved";

  return (
    <li className="rounded-2xl border border-border bg-white px-5 py-4 dark:border-white/10 dark:bg-surface">
      <p className="text-caption font-medium text-[#DE7C40]">
        {verb}
        {item.createdAt ? <span className="ml-2 font-normal text-muted">{formatCommunityTime(item.createdAt)}</span> : null}
      </p>
      <p className="mt-1.5 text-body-sm font-medium text-foreground">{title}</p>
      <p className="mt-0.5 text-caption text-muted">@{author.handle}</p>
      {item.excerpt ? <p className="mt-2 text-body-sm text-muted">“{item.excerpt}”</p> : null}
    </li>
  );
}

export function CommunityDashboardPage() {
  const community = useCommunity();
  const { latestListing } = useVael();
  const side = dashboardSideFromListing(latestListing);
  const { session, signIn } = useCitySession();
  const [tab, setTab] = useState<DashTab>("posts");

  const posts = useMemo(() => community.memberPosts(), [community]);
  const saved = useMemo(() => community.memberSaved(), [community]);
  const activity = useMemo(() => community.memberActivity(), [community]);

  function requireSignIn() {
    signIn("member");
  }

  function handleReact(id: string, kind: "like" | "celebrate" | "insight") {
    if (!session.signedIn) return requireSignIn();
    community.react(id, kind);
  }
  function handleSave(id: string) {
    if (!session.signedIn) return requireSignIn();
    community.save(id);
  }
  function handleComment(id: string, body: string) {
    if (!session.signedIn) return requireSignIn();
    community.comment(id, body);
  }

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-medium tracking-tight text-foreground">
            Your Community Dashboard
          </h1>
          <p className="mt-2 text-body-sm text-muted">
            Only your own real activity ever shows here — none of the community feed&apos;s example content can appear
            on this page.
          </p>
        </div>
        <Link to={FEED_HREF} className="text-body-sm font-medium text-[#DE7C40] hover:underline">
          Community Feed →
        </Link>
      </div>

      <div className="mx-auto mt-8 max-w-3xl">
        <Tabs value={tab} onValueChange={(next) => setTab(next as DashTab)} defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">My posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="saved">Saved ({saved.length})</TabsTrigger>
            <TabsTrigger value="activity">My activity ({activity.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {posts.length === 0 ? (
              <EmptyPanel
                title={side === "out" ? "You haven't posted an opportunity yet." : "You haven't posted anything yet."}
                cta="Go to the Community Feed"
              />
            ) : (
              <ul className="flex flex-col gap-4">
                {posts.map((item) => (
                  <li key={item.post.id}>
                    <PostCard
                      view={item}
                      onReact={(kind) => handleReact(item.post.id, kind)}
                      onSave={() => handleSave(item.post.id)}
                      onComment={(body) => handleComment(item.post.id, body)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            {saved.length === 0 ? (
              <EmptyPanel title="You haven't saved any posts yet." cta="Go to the Community Feed" />
            ) : (
              <ul className="flex flex-col gap-4">
                {saved.map((item) => (
                  <li key={item.post.id}>
                    <PostCard
                      view={item}
                      onReact={(kind) => handleReact(item.post.id, kind)}
                      onSave={() => handleSave(item.post.id)}
                      onComment={(body) => handleComment(item.post.id, body)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            {activity.length === 0 ? (
              <EmptyPanel title="No activity yet." cta="Go to the Community Feed" />
            ) : (
              <ul className="flex flex-col gap-3">
                {activity.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
