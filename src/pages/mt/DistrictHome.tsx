import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { buttonClassName } from "@/components/ui/button";
import { IconCheck, IconChevronRight, IconUser } from "@/components/ui/icons";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import { DashboardSidebar } from "@/components/mt/DashboardSidebar";
import { DashboardMatchesRail } from "@/components/mt/DashboardMatchesRail";
import { DistrictsRow, useJoinedDistricts } from "@/components/mt/DistrictsRow";
import { CommunityRail } from "@/components/mt/HomeWidgets";
import { useVael } from "@/lib/vaelCore";
import { useCommunity } from "@/lib/communityCore";
import { districtBySlug } from "@/lib/districts";
import { visibilityKindFromListing } from "@/lib/visibilityPlans";
import { sectionCompletion } from "@/lib/profileFields";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { hoursLeft, type VaelSide } from "@/lib/vaelStore";
import { cn } from "@/lib/cn";
import { vaelSideStatusLabel } from "@/lib/vaelCopy";

/** One stacked row in the "Action items" panel — icon, title, description, and a solid pill CTA. No images. */
function ActionItemRow({
  icon,
  title,
  description,
  cta,
  to,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-8px_rgba(17,17,17,0.14)] sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.06] dark:via-white/[0.02] dark:to-transparent dark:backdrop-blur-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:border-accent/25 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.2),0_16px_36px_-12px_rgba(255,157,69,0.15)]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFC555] text-[#0B0C0C] dark:bg-gradient-to-br dark:from-accent-hover dark:to-accent dark:text-[#1A1410] dark:shadow-[0_2px_4px_-1px_rgba(255,138,61,0.4),0_10px_22px_-8px_rgba(255,138,61,0.45)] dark:ring-1 dark:ring-inset dark:ring-white/25">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-body font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-body-sm text-muted">{description}</p>
        </div>
      </div>
      <span className="inline-flex h-10 shrink-0 items-center gap-1.5 self-start rounded-full bg-[#0B0C0C] px-5 text-body-sm font-medium text-white sm:self-auto dark:bg-gradient-to-r dark:from-accent-hover dark:to-accent dark:text-[#1A1410] dark:shadow-[0_2px_4px_-1px_rgba(255,138,61,0.4),0_10px_22px_-8px_rgba(255,138,61,0.45)] dark:ring-1 dark:ring-inset dark:ring-white/25">
        {cta}
        <IconChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

export function DistrictHomePage() {
  const vael = useVael();
  const community = useCommunity();
  const { listing, latestListing, matches, myConnections, handle, signedIn, profile, documents } = vael;
  const mine = signedIn ? profile(handle) : undefined;
  const name = mine?.displayName || handle;
  const kind = visibilityKindFromListing(latestListing);
  const vaeledIn = (kind === "in" || kind === "expiring") && latestListing?.side !== "out";
  const vaeledOut = kind === "out" || ((kind === "in" || kind === "expiring") && latestListing?.side === "out");
  const side: VaelSide = vaeledOut ? "out" : "in";
  const visible = Boolean(listing);
  const visibleHours = latestListing && (vaeledIn || vaeledOut) ? hoursLeft(latestListing.expiresAt) : null;
  const incoming = myConnections.filter(
    (connection) =>
      connection.status === "pending" && connection.counterpartHandle === handle && !connection.counterpartAccepted,
  );
  const docs = signedIn ? documents(handle) : [];
  const identityCompletion = sectionCompletion(mine, "identity", docs, side);
  const joinedDistricts = useJoinedDistricts(handle, mine, docs);
  const districtsComplete = joinedDistricts.length > 0 && joinedDistricts.every((row) => row.percent === 100);
  const allComplete = identityCompletion.percent === 100 && districtsComplete;
  const actionItemsCount = allComplete ? 0 : (identityCompletion.percent < 100 ? 1 : 0) + 1;
  const posts = community.posts();

  const vaelHref = vaeledIn || vaeledOut ? `${PRODUCT_HOME}/vael/active` : `${PRODUCT_HOME}/vael?create=1`;
  const editHref = `${PRODUCT_HOME}/profile/${handle}/edit`;

  if (!signedIn) {
    return (
      <CityPage width="wide">
        <SignedOutHome />
      </CityPage>
    );
  }

  return (
    <CityPage width="full">
      <div className="flex w-full items-start">
        <DashboardSidebar handle={handle} profile={mine} documents={docs} incomingCount={incoming.length} side={side} />

        <div className="min-w-0 flex-1 space-y-10 bg-white px-4 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-6 lg:px-10 dark:bg-white/[0.02] dark:backdrop-blur-3xl">
          {/* WELCOME — greeting on the left, Vael status + action on the right. */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
                Hi, {name}!
              </h1>
              <p className="mt-1 text-body-sm text-muted">Here's what's happening in your VAEL network.</p>
            </div>
            <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
              <div>
                <p className="flex items-center gap-2 text-caption font-medium uppercase tracking-[0.1em] text-[#C99A28] dark:text-accent">
                  <span className="relative flex h-1.5 w-1.5">
                    {vaeledIn || vaeledOut ? (
                      <span className="absolute hidden h-full w-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:animate-none dark:inline-flex" />
                    ) : null}
                    <span
                      aria-hidden
                      className={cn(
                        "relative inline-flex h-1.5 w-1.5 rounded-full",
                        vaeledIn || vaeledOut ? "bg-[#FFC555] dark:bg-accent" : "bg-quiet",
                      )}
                    />
                  </span>
                  {vaeledIn ? vaelSideStatusLabel("in") : vaeledOut ? vaelSideStatusLabel("out") : "Not visible"}
                </p>
                {(vaeledIn || vaeledOut) && visibleHours !== null ? (
                  <p className="mt-0.5 text-caption text-muted">
                    Visible for {visibleHours}h ·{" "}
                    <Link to={vaelHref} className="underline underline-offset-2 hover:text-foreground">
                      View status
                    </Link>
                  </p>
                ) : null}
              </div>
              {vaeledIn || vaeledOut ? (
                <Link
                  to={`${PRODUCT_HOME}/vael?create=1&side=${vaeledIn ? "out" : "in"}`}
                  className={buttonClassName({
                    className:
                      "rounded-full bg-[#FFC555] text-[#0B0C0C] hover:bg-[#FFC555]/90 dark:bg-accent dark:text-[#1A1410] dark:shadow-[0_4px_18px_-4px_rgba(255,197,85,0.5)] dark:ring-1 dark:ring-inset dark:ring-white/25 dark:hover:bg-accent-hover",
                  })}
                >
                  {vaeledIn ? "Vael Out" : "Vael In"}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to={`${PRODUCT_HOME}/vael?create=1&side=in`}
                    className={buttonClassName({
                      variant: "outline",
                      className: "rounded-full",
                    })}
                  >
                    Vael In
                  </Link>
                  <Link
                    to={`${PRODUCT_HOME}/vael?create=1&side=out`}
                    className={buttonClassName({
                      className:
                        "rounded-full bg-[#FFC555] text-[#0B0C0C] hover:bg-[#FFC555]/90 dark:bg-accent dark:text-[#1A1410] dark:shadow-[0_4px_18px_-4px_rgba(255,197,85,0.5)] dark:ring-1 dark:ring-inset dark:ring-white/25 dark:hover:bg-accent-hover",
                    })}
                  >
                    Vael Out
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Action items — one job: surface what's incomplete (generic profile, district profiles, or
              adding a new one), or a plain "all set" state once nothing is left to do. */}
          <div>
            <p className="flex items-center gap-2 text-h4 font-medium text-foreground">
              Action items
              {!allComplete ? (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-tertiary px-2 text-caption font-medium text-muted">
                  {actionItemsCount}
                </span>
              ) : null}
            </p>
            <div className="mt-4 space-y-3">
              {allComplete ? (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] dark:border-white/10 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/[0.06] dark:via-white/[0.02] dark:to-transparent dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:backdrop-blur-xl">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFC555] text-[#0B0C0C] dark:bg-gradient-to-br dark:from-accent-hover dark:to-accent dark:text-[#1A1410] dark:shadow-[0_2px_4px_-1px_rgba(255,138,61,0.4),0_10px_22px_-8px_rgba(255,138,61,0.45)] dark:ring-1 dark:ring-inset dark:ring-white/25">
                    <IconCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-foreground">You're all set</p>
                    <p className="mt-0.5 text-body-sm text-muted">Your profile and district profiles are complete.</p>
                  </div>
                </div>
              ) : (
                <>
                  {identityCompletion.percent < 100 ? (
                    <ActionItemRow
                      icon={<IconUser className="h-5 w-5" />}
                      title="Complete your profile"
                      description={identityCompletion.prompt}
                      cta="Complete profile"
                      to={`${editHref}#identity`}
                    />
                  ) : null}
                  <DistrictsRow handle={handle} mine={mine} docs={docs} />
                </>
              )}
            </div>
          </div>

          {/* "Your matches" — the primary reason a member opens Home. */}
          <DashboardMatchesRail matches={matches} visible={visible} />

          <CommunityRail posts={posts} />
        </div>
      </div>
    </CityPage>
  );
}

function SignedOutHome() {
  const district = districtBySlug("media-technology")!;
  return (
    <>
      <PageHeader
        kicker="The City of VAEL"
        title={district.name}
        description="Continue on this device to set availability and see who fits."
      />
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to={JOIN_ROUTE} className={buttonClassName({ size: "lg" })}>
          Join VAEL
        </Link>
        <Link to="/sign-in" className={buttonClassName({ variant: "outline", size: "lg" })}>
          Sign in
        </Link>
      </div>
    </>
  );
}

export function HowItWorksPage() {
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Media & Technology"
        title="How it works"
        description="The same spine every live district should copy. Fields here are Media & Technology’s."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Media & Technology", href: "/media-technology" },
          { label: "How it works" },
        ]}
      />
      <ol className="mt-8 space-y-6 text-body-sm">
        <li>
          <p className="vael-kicker">1. Profile</p>
          <p className="mt-1">Keep identity. District details stay closed to Handshake counterparts until both accept.</p>
        </li>
        <li>
          <p className="vael-kicker">2. Vael</p>
          <p className="mt-1">Vael In — I am available. Vael Out — I need someone. Default visibility is 24 hours.</p>
        </li>
        <li>
          <p className="vael-kicker">3. Matches</p>
          <p className="mt-1">Matches rank by percentage fit. Strong ≥80, Good ≥60, Possible ≥40.</p>
        </li>
        <li>
          <p className="vael-kicker">4. Handshake</p>
          <p className="mt-1">Request. Both accept. Then the private room and messages open.</p>
        </li>
      </ol>
      <Link to="/media-technology/vael?create=1" className={buttonClassName({ className: "mt-8" })}>
        Set availability
      </Link>
    </CityPage>
  );
}
