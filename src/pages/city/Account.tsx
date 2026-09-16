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
    <CityPage width="narrow">
      <PageHeader
        kicker="City"
        title="Account"
        description="Identity and preferences for this device. This is not a new authentication architecture."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Account" },
        ]}
      />
      {session.signedIn ? (
        <div className="mt-6 space-y-4">
          <p className="text-body">
            Signed in locally as <strong>@{session.handle}</strong>.
          </p>
          <div className="flex flex-col gap-2">
            <Link to={`/media-technology/profile/${session.handle}`} className={buttonClassName({ variant: "outline" })}>
              Media & Technology profile
            </Link>
            <Link to={`/districts/contractor/profile/${session.handle}`} className={buttonClassName({ variant: "outline" })}>
              Construction profile
            </Link>
            <Link to={`/districts/trucking/profile/${session.handle}`} className={buttonClassName({ variant: "outline" })}>
              Trucking profile
            </Link>
            <Link to={`/districts/residential/profile/${session.handle}`} className={buttonClassName({ variant: "outline" })}>
              Residential profile
            </Link>
            <Link to={`/districts/commercial/profile/${session.handle}`} className={buttonClassName({ variant: "outline" })}>
              Commercial profile
            </Link>
            <Link to="/account/visibility" className={buttonClassName({ variant: "outline" })}>
              Visibility
            </Link>
            <Link to="/account/notifications" className={buttonClassName({ variant: "outline" })}>
              Notification preferences
            </Link>
            <Link to="/extended-vael" className={buttonClassName({ variant: "ghost" })}>
              Extended VAEL (demo)
            </Link>
          </div>
          <Button variant="ghost" onClick={signOut}>
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
    </CityPage>
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
    <CityPage>
      <PageHeader
        kicker="Account"
        title="Visibility"
        description="Free Daily VAEL is 24 hours. Extended plans remain a labeled demo — not purchasable."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Visibility" },
        ]}
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
    </CityPage>
  );
}

export function NotificationPrefsPage() {
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Account"
        title="Notification preferences"
        description="Only in-app is marked connected. SMS, email, and push stay NOT YET CONNECTED."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Notifications" },
        ]}
      />
      <p className="mt-6 text-body-sm">In-app: available on this device.</p>
      <p className="mt-2 text-caption text-muted">SMS / email / push — NOT YET CONNECTED.</p>
      <p className="mt-6">
        <Link to="/notifications" className={buttonClassName({ variant: "outline" })}>
          Open notifications
        </Link>
      </p>
    </CityPage>
  );
}

export function NotificationsPage() {
  const { notices, readNotices, signedIn } = useVael();
  useEffect(() => {
    if (signedIn) readNotices();
  }, [signedIn]);
  return (
    <CityPage>
      <PageHeader
        kicker="City"
        title="Notifications"
        description="In-app notices for this device, including Handshake and comments on your posts. SMS, email, and push are NOT YET CONNECTED."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Notifications" },
        ]}
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
    </CityPage>
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
