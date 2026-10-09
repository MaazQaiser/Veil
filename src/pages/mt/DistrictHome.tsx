import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { buttonClassName, Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/overlays";
import { IconCheck, IconHandshake, IconMapPin, IconUser } from "@/components/ui/icons";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import { DashboardSidebar } from "@/components/mt/DashboardSidebar";
import { DashboardMatchesRail } from "@/components/mt/DashboardMatchesRail";
import { DistrictsRow, useJoinedDistricts } from "@/components/mt/DistrictsRow";
import { CommunityRail } from "@/components/mt/HomeWidgets";
import { useVael } from "@/lib/vaelCore";
import { useCommunity } from "@/lib/communityCore";
import { districtBySlug } from "@/lib/districts";
import { visibilityKindFromListing } from "@/lib/visibilityPlans";
import { profileFieldsFor } from "@/lib/profileFields";
import { PRODUCT_HOME, profileCompletion } from "@/lib/providerJourney";
import { hoursLeft, type VaelSide } from "@/lib/vaelStore";
import { cn } from "@/lib/cn";
import { getOnboardingDraft } from "@/lib/onboarding";
import { handshakeIncomingLede, homeNetworkLede, vaelSideLabel, vaelSideStatusLabel } from "@/lib/vaelCopy";

/** One card in the "Action items" grid — icon, title, description, and a plain text link. No images, no button. */
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
      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-[0_1px_2px_rgba(11,12,12,0.04),0_10px_24px_-8px_rgba(17,17,17,0.14)] dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(0,0,0,0.5)] dark:hover:border-white/15 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.2),0_16px_36px_-12px_rgba(0,0,0,0.4)]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFC555]/15 text-[#C99A28] dark:bg-accent/15 dark:text-accent">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-body font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-body-sm text-muted">{description}</p>
        </div>
      </div>
      <span className="shrink-0 text-body-sm font-medium text-[#C99A28] underline underline-offset-4 hover:text-foreground dark:text-accent">
        {cta} →
      </span>
    </Link>
  );
}

/** One-time popup right after onboarding hands off to the dashboard. */
function WelcomeCityModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("vael_show_welcome") === "1") {
        sessionStorage.removeItem("vael_show_welcome");
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="Welcome to VAEL City!"
      footer={<Button onClick={() => setOpen(false)}>Let&apos;s explore →</Button>}
    >
      <p className="text-body text-muted">
        Let&apos;s see what&apos;s here — real people, real availability, ranked by fit. Your matches, districts,
        and community are ready whenever you are.
      </p>
    </Dialog>
  );
}

export function DistrictHomePage() {
  const vael = useVael();
  const community = useCommunity();
  const { listing, latestListing, matches, myConnections, handle, signedIn, profile, documents } = vael;
  const mine = signedIn ? profile(handle) : undefined;
  const kind = visibilityKindFromListing(latestListing);
  const vaeledIn = (kind === "in" || kind === "expiring") && latestListing?.side !== "out";
  const vaeledOut = kind === "out" || ((kind === "in" || kind === "expiring") && latestListing?.side === "out");
  const intent = getOnboardingDraft(handle)?.intent ?? "";
  // Which half of the page is actually rendering — not just current visibility.
  // Before a first Vael Out, intent alone already puts someone in the Out
  // experience; everything (sidebar, copy, matches) must agree with that,
  // not point back at Avail because they haven't gone visible yet.
  // Intent wins over an older Vael In listing. Otherwise Go Visible → Vael Out
  // finishes on the availability dashboard.
  const vaelOutHome = intent === "out" || vaeledOut;
  const side: VaelSide = vaelOutHome ? "out" : "in";
  const visible = Boolean(listing);
  const visibleHours = latestListing && (vaeledIn || vaeledOut) ? hoursLeft(latestListing.expiresAt) : null;
  const incoming = myConnections.filter(
    (connection) =>
      connection.status === "pending" && connection.counterpartHandle === handle && !connection.counterpartAccepted,
  );
  const docs = signedIn ? documents(handle) : [];
  const completion = profileCompletion(mine, docs, side);
  const joinedDistricts = useJoinedDistricts(handle, mine, docs);
  const currentDistrict = joinedDistricts[0];
  const districtIncomplete = !currentDistrict || currentDistrict.percent < 100;
  const districtEditHref = currentDistrict
    ? `${PRODUCT_HOME}/districts/${currentDistrict.district.id}/edit`
    : `${PRODUCT_HOME}/districts`;
  const districtsComplete = joinedDistricts.length > 0 && joinedDistricts.every((row) => row.percent === 100);
  const profileIncomplete = completion.percent < 100;
  const allComplete = !profileIncomplete && districtsComplete;
  const posts = community.posts();

  const firstMissing = profileFieldsFor(side).find((field) => !mine || !field.filled(mine, docs));
  const editHash =
    firstMissing?.section === "credentials" ? "documents" : firstMissing?.section ?? "identity";
  const editHref = `${PRODUCT_HOME}/profile/${handle}/edit`;
  /**
   * Vael In and Vael Out are separate accounts on this device. Switching to the
   * side you're not currently on must go through sign-in for that side's
   * credentials; activating your own current side stays a direct link.
   */
  const inHref = vaelOutHome ? "/sign-in?intent=in" : `${PRODUCT_HOME}/vael?create=1&side=in`;
  const outHref = vaelOutHome ? `${PRODUCT_HOME}/vael?create=1&side=out` : "/sign-in?intent=out";
  const offerLine = [mine?.disciplines[0], mine?.skills.slice(0, 2).join(", ")].filter(Boolean).join(" · ");
  const availabilityButtonClass = buttonClassName({
    className: "bg-[#FFC555] text-[#0B0C0C] hover:bg-[#FFC555]/90 dark:bg-accent dark:text-[#0B0C0C] dark:hover:bg-accent-hover",
  });

  if (!signedIn) {
    return (
      <CityPage width="wide">
        <SignedOutHome />
      </CityPage>
    );
  }

  return (
    <CityPage width="full">
      <WelcomeCityModal />
      <div className="flex w-full items-start">
        <DashboardSidebar handle={handle} profile={mine} documents={docs} incomingCount={incoming.length} side={side} />

        <div className="min-w-0 flex-1 space-y-10 bg-white px-4 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-6 lg:px-10 dark:bg-white/[0.02] dark:backdrop-blur-3xl">
          {/* WELCOME — greeting on the left, Vael status + action on the right. */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
                Hey {vaelSideLabel(side)}
              </h1>
              <p className="mt-1 text-body-sm text-muted">
                {vaelOutHome ? homeNetworkLede(side) : "Your availability, profile, matches, and community."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
              {vaeledIn || vaeledOut ? (
                <div>
                  <p className="flex items-center gap-2 text-caption font-medium uppercase tracking-[0.1em] text-[#C99A28] dark:text-accent">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute hidden h-full w-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:animate-none dark:inline-flex" />
                      <span aria-hidden className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FFC555] dark:bg-accent" />
                    </span>
                    {vaelOutHome ? vaelSideStatusLabel("out") : "Visible"}
                  </p>
                  {visibleHours !== null ? (
                    <p className="mt-0.5 text-caption text-muted">
                      {vaelOutHome ? `Visible for ${visibleHours}h` : `Available · ${visibleHours}h left`}
                    </p>
                  ) : null}
                </div>
              ) : (
                <Link
                  to={vaelOutHome ? outHref : inHref}
                  className="flex items-center gap-2 text-caption font-medium uppercase tracking-[0.1em] text-[#C99A28] hover:text-foreground dark:text-accent dark:hover:text-accent-hover"
                >
                  <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-quiet" />
                  Not visible
                  <span className="normal-case tracking-normal">Go visible</span>
                </Link>
              )}
              <Link to={vaelOutHome ? inHref : outHref} className={availabilityButtonClass}>
                {vaelOutHome ? "Vael In" : "Vael Out"}
              </Link>
            </div>
          </div>

          {vaelOutHome ? (
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {allComplete ? (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(11,12,12,0.04),0_2px_10px_-4px_rgba(17,17,17,0.08)] sm:col-span-2 dark:border-white/10 dark:bg-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFC555]/15 text-[#C99A28] dark:bg-accent/15 dark:text-accent">
                    <IconCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-foreground">You're all set</p>
                    <p className="mt-0.5 text-body-sm text-muted">Your profile and district profiles are complete.</p>
                  </div>
                </div>
              ) : (
                <>
                  {profileIncomplete ? (
                    <ActionItemRow
                      icon={<IconUser className="h-5 w-5" />}
                      title="Complete your profile"
                      description={completion.prompt}
                      cta="Complete profile"
                      to={`${editHref}#${editHash}`}
                    />
                  ) : null}
                  <DistrictsRow
                    handle={handle}
                    mine={mine}
                    docs={docs}
                    className={profileIncomplete ? undefined : "sm:col-span-2"}
                  />
                </>
              )}
            </div>
          </div>
          ) : (
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ActionItemRow
                icon={<IconUser className="h-5 w-5" />}
                title="Complete your profile"
                description={
                  profileIncomplete
                    ? completion.prompt
                    : offerLine || "Your professional profile is complete."
                }
                cta={profileIncomplete ? "Complete profile" : "Edit profile"}
                to={profileIncomplete ? `${editHref}#${editHash}` : editHref}
              />
              <ActionItemRow
                icon={<IconMapPin className="h-5 w-5" />}
                title="Complete current district"
                description={
                  currentDistrict
                    ? districtIncomplete
                      ? `${currentDistrict.district.name} · finish this district profile.`
                      : `${currentDistrict.district.name} · this district profile is complete.`
                    : "Choose the district you want to be live in."
                }
                cta={districtIncomplete ? "Complete district" : "Edit district"}
                to={districtEditHref}
              />
            </div>
          </div>
          )}

          {incoming.length > 0 ? (
            <div>
              <p className="flex items-center gap-2 text-h4 font-medium text-foreground">
                Handshake requests
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#FFC555]/15 px-2 text-caption font-medium text-[#C99A28] dark:bg-accent/15 dark:text-accent">
                  {incoming.length}
                </span>
              </p>
              <p className="mt-1 text-body-sm text-muted">{handshakeIncomingLede(side)}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {incoming.map((connection) => {
                  const requester = profile(connection.requesterHandle);
                  return (
                    <ActionItemRow
                      key={connection.id}
                      icon={<IconHandshake className="h-5 w-5" />}
                      title={requester?.displayName || connection.requesterHandle}
                      description="Wants to connect with you."
                      cta="Respond"
                      to={`${PRODUCT_HOME}/connections/${connection.id}`}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* "Your matches" — the primary reason a member opens Home. */}
          <DashboardMatchesRail matches={matches} visible={visible} side={side} />

          <CommunityRail
            posts={posts}
            title={vaelOutHome ? "From the Community" : "Community"}
            description={
              vaelOutHome
                ? "Recent posts from across VAEL."
                : "Take part with people in your district."
            }
          />
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
