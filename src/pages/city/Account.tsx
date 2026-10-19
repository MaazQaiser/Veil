import { DashboardShell } from "@/components/mt/DashboardShell";
import { Link } from "react-router-dom";
import { Button, buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import { NotificationCard } from "@/components/vael/cards";
import { useCitySession } from "@/lib/citySession";
import { useVael } from "@/lib/vaelCore";
import { useConstruction } from "@/lib/constructionCore";
import { useTrucking } from "@/lib/truckingCore";
import { useResidential } from "@/lib/residentialCore";
import { useCommercial } from "@/lib/commercialCore";
import { VisibilityCard } from "@/components/vael/visibility";
import { DemoPurchaseNotice } from "@/components/vael/plans";
import { useEffect } from "react";

export function AccountPage() {
  const { session, signOut } = useCitySession();
  return (
    <DashboardShell>
      <div className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground">
          Account
        </h1>
        <p className="mt-1 text-body-sm text-muted">
          Identity and preferences for this device. This is not a new authentication architecture.
        </p>
      </div>
      {session.signedIn ? (
        <div className="space-y-6">
          <p className="text-body-sm text-muted">
            Signed in locally as <span className="font-medium text-foreground">@{session.handle}</span>
          </p>
          <ul className="divide-y divide-border-subtle rounded-lg border border-border bg-surface">
            {[
              ["Media & Technology profile", `/media-technology/profile/${session.handle}`],
              ["Construction profile", `/districts/contractor/profile/${session.handle}`],
              ["Trucking profile", `/districts/trucking/profile/${session.handle}`],
              ["Residential profile", `/districts/residential/profile/${session.handle}`],
              ["Commercial profile", `/districts/commercial/profile/${session.handle}`],
              ["Visibility", "/account/visibility"],
              ["Notification preferences", "/account/notifications"],
              ["Extended VAEL (demo)", "/extended-vael"],
            ].map(([label, to]) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center justify-between gap-4 px-5 py-4 text-body-sm font-medium text-foreground motion-safe:transition-colors hover:bg-white/[0.03]"
                >
                  {label}
                  <span aria-hidden className="text-muted">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="rounded-full px-6" onClick={signOut}>
            Sign out of this device
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-body-sm text-muted">
            Sign in on this device to keep a handle and vael status in this browser. Two devices still do not share a
            City.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={JOIN_ROUTE} className={buttonClassName()}>
              Join VAEL
            </Link>
            <Link to="/sign-in" className={buttonClassName({ variant: "outline" })}>
              Sign in
            </Link>
          </div>
        </div>
      )}
    </div>
    </DashboardShell>
  );
}

export function VisibilityPage() {
  const { session } = useCitySession();
  const mt = useVael();
  const cx = useConstruction();
  const tx = useTrucking();
  const rx = useResidential();
  const cm = useCommercial();

  const rooms = [
    {
      district: "Media & Technology",
      listing: mt.latestListing,
      context: mt.latestListing?.discipline,
      manageHref: "/media-technology/vael",
      boardHref: "/matches?district=media-technology",
    },
    {
      district: "Construction",
      listing: cx.latestListing,
      context: cx.latestListing?.trade,
      manageHref: "/districts/contractor/vael",
      boardHref: "/matches?district=construction",
    },
    {
      district: "Trucking",
      listing: tx.latestListing,
      context: tx.latestListing?.equipment,
      manageHref: "/districts/trucking/vael",
      boardHref: "/matches?district=trucking",
    },
    {
      district: "Residential",
      listing: rx.latestListing,
      context: rx.latestListing?.service,
      manageHref: "/districts/residential/vael",
      boardHref: "/matches?district=residential",
    },
    {
      district: "Commercial",
      listing: cm.latestListing,
      context: cm.latestListing?.capability,
      manageHref: "/districts/commercial/vael",
      boardHref: "/matches?district=commercial",
    },
  ];

  return (
    <DashboardShell>
      <PageHeader
        title="Visibility"
        description="Free Daily VAEL is 24 hours. Extended plans remain a labeled demo — not purchasable."
      />
      {!session.signedIn ? (
        <div className="mt-6">
          <p className="text-body-sm text-muted">Sign in to see VAELs on this device.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={JOIN_ROUTE} className={buttonClassName()}>
              Join VAEL
            </Link>
            <Link to="/sign-in" className={buttonClassName({ variant: "outline" })}>
              Sign in
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <section>
            <p className="vael-kicker">Current visibility</p>
            <p className="mt-2 max-w-2xl text-body-sm text-muted">
              Each live Room has its own VAEL. Ending or expiry removes you from that Board. Re-vael starts a new
              24-hour window. Session vael in the header follows Media & Technology when that Room is active.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {rooms.map((room) => (
                <VisibilityCard
                  key={room.district}
                  district={room.district}
                  listing={room.listing}
                  context={room.context}
                  manageHref={room.manageHref}
                  boardHref={room.boardHref}
                />
              ))}
            </div>
          </section>
          <section>
            <p className="vael-kicker">Plan</p>
            <p className="mt-2 text-body-sm">Current: Free Daily VAEL (24 hours).</p>
            <DemoPurchaseNotice className="mt-4" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/media-technology/vael?create=1" className={buttonClassName()}>
                Set availability
              </Link>
              <Link to="/extended-vael" className={buttonClassName({ variant: "outline" })}>
                Extended VAEL (demo)
              </Link>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

export function NotificationPrefsPage() {
  return (
    <DashboardShell>
      <div className="w-full max-w-3xl space-y-6">
      <PageHeader
        title="Notification preferences"
        description="Only in-app is marked connected. SMS, email, and push stay NOT YET CONNECTED."
      />
      <p className="mt-6 text-body-sm">In-app: available on this device.</p>
      <p className="mt-2 text-caption text-muted">SMS / email / push — NOT YET CONNECTED.</p>
      <p className="mt-6">
        <Link to="/notifications" className={buttonClassName({ variant: "outline" })}>
          Open notifications
        </Link>
      </p>
    </div>
    </DashboardShell>
  );
}

export function NotificationsPage() {
  const { notices, readNotices, signedIn } = useVael();
  useEffect(() => {
    if (signedIn) readNotices();
  }, [signedIn]);
  return (
    <DashboardShell>
      <PageHeader
        title="Notifications"
        description="In-app notices for this device, including Handshake and comments on your posts. SMS, email, and push are NOT YET CONNECTED."
      />
      {notices.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Handshake activity on this device will appear here. SMS, email, and push are not connected."
          action={
            <Link to="/media-technology/matches" className={buttonClassName({ variant: "outline" })}>
              View matches
            </Link>
          }
        />
      ) : (
        <ul className="mt-6 space-y-3">
          {notices.map((item) => (
            <li key={item.id}>
              <NotificationCard title={item.title} body={item.body} unread={!item.read} href={item.href} />
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}

export function TodayPage() {
  return (
    <CityPage>
      <PageHeader kicker="City" title="Today" description="Time-local City surface from the existing route map." crumbs={[{ label: "City", href: "/" }, { label: "Today" }]} />
      <EmptyState
        title="Nothing dated today"
        description="This route is kept so existing bookmarks still resolve. There is no calendar of City events yet."
        action={
          <Link to="/" className={buttonClassName({ variant: "outline" })}>
            Return to the City
          </Link>
        }
      />
    </CityPage>
  );
}

export function ConciergePage() {
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="City"
        title="Concierge"
        description="Local keyword routing in the original product — not a live AI service."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Concierge" },
        ]}
      />
      <p className="mt-6 text-body-sm text-muted">
        This page is the documented City route. It does not call a network model.
      </p>
      <p className="mt-6">
        <Link to="/districts" className={buttonClassName({ variant: "outline" })}>
          View districts
        </Link>
      </p>
    </CityPage>
  );
}

export function CityNotFoundPage() {
  return (
    <CityPage>
      <PageHeader kicker="City" title="Not found" crumbs={[{ label: "City", href: "/" }]} />
      <ErrorState
        title="This City path is not on the map"
        description="The shell only mounts documented routes. Nothing is invented behind unknown URLs."
        action={
          <Link to="/" className={buttonClassName({ variant: "outline" })}>
            Return to the City
          </Link>
        }
      />
    </CityPage>
  );
}

export function LegalPage({ title, body }: { title: string; body: string }) {
  return (
    <CityPage width="narrow">
      <PageHeader kicker="Legal" title={title} crumbs={[{ label: "City", href: "/" }, { label: title }]} />
      <p className="mt-6 text-body-sm text-muted">{body}</p>
      <p className="mt-6">
        <Link to="/" className={buttonClassName({ variant: "outline" })}>
          Return to the City
        </Link>
      </p>
    </CityPage>
  );
}
