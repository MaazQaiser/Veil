import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { TwoCol } from "@/components/ui/layout";
import { buttonClassName } from "@/components/ui/button";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import {
  ActivityWidget,
  CommunityWidget,
  DocumentsWidget,
  HandshakesWidget,
  MatchesWidget,
  MessagesWidget,
  ProfileWidget,
} from "@/components/mt/HomeWidgets";
import { useVael } from "@/lib/vaelCore";
import { useCommunity } from "@/lib/communityCore";
import { districtBySlug } from "@/lib/districts";
import { visibilityKindFromListing } from "@/lib/visibilityPlans";
import { hoursLeft } from "@/lib/vaelStore";
import { profileCompletion, PRODUCT_HOME } from "@/lib/providerJourney";
import { cn } from "@/lib/cn";

function greeting(name: string, now = new Date()) {
  const hour = now.getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${hello}, ${name}`;
}

function availableForLabel(expiresAt?: string) {
  if (!expiresAt) return "";
  const hours = hoursLeft(expiresAt);
  if (hours >= 1) return hours === 1 ? "1 hour" : `${hours} hours`;
  const minutes = Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 60000));
  if (minutes <= 0) return "";
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

export function DistrictHomePage() {
  const vael = useVael();
  const community = useCommunity();
  const { listing, latestListing, matches, myConnections, handle, signedIn, profile, documents, thread, notices } =
    vael;
  const mine = signedIn ? profile(handle) : undefined;
  const name = mine?.displayName || handle;
  const kind = visibilityKindFromListing(latestListing);
  const veiledIn = (kind === "in" || kind === "expiring") && latestListing?.side !== "out";
  const veiledOut = kind === "out" || ((kind === "in" || kind === "expiring") && latestListing?.side === "out");
  const visible = Boolean(listing);
  const remaining = visible ? availableForLabel(listing?.expiresAt) : "";
  const incoming = myConnections.filter(
    (connection) =>
      connection.status === "pending" && connection.counterpartHandle === handle && !connection.counterpartAccepted,
  );
  const connected = myConnections.filter((connection) => connection.status === "connected" && !connection.blocked);
  const docs = signedIn ? documents(handle) : [];
  const completion = profileCompletion(mine, docs);
  const posts = community.posts("media-technology").slice(0, 3);

  return (
    <CityPage width="wide">
      {!signedIn ? (
        <SignedOutHome />
      ) : (
        <div className="space-y-8 md:space-y-10">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="vael-kicker">Your availability</p>
              <h1 className="vael-h2 mt-3">{greeting(name)}</h1>
              <p className="mt-4 text-body">
                You're currently{" "}
                <span className="font-medium">
                  {veiledIn ? "Veiled In" : veiledOut ? "Veiled Out" : "not visible"}
                </span>
              </p>
              <p className="mt-1 text-body-sm text-muted">
                {veiledIn && remaining
                  ? `Visible for the next ${remaining}`
                  : veiledOut && remaining
                    ? `Showing that you need someone for the next ${remaining}`
                    : kind === "expired"
                      ? "Your last 24-hour window has closed."
                      : "Veil In when you're available to be discovered."}
              </p>
            </div>
            <Link
              to={veiledIn || veiledOut ? `${PRODUCT_HOME}/veil/active` : `${PRODUCT_HOME}/veil?create=1`}
              className={buttonClassName({ className: cn("shrink-0") })}
            >
              {veiledIn || veiledOut ? "Manage availability" : "Set availability"}
            </Link>
          </header>

          <TwoCol>
            <MatchesWidget matches={matches} visible={visible} />
            <HandshakesWidget incoming={incoming} connected={connected} />
            <MessagesWidget
              handle={handle}
              connected={connected}
              lastMessage={(id) => {
                const messages = thread(id);
                return messages[messages.length - 1];
              }}
            />
            <ProfileWidget handle={handle} profile={mine} percent={completion.percent} />
            <CommunityWidget posts={posts} />
            <DocumentsWidget handle={handle} profile={mine} documents={docs} />
          </TwoCol>

          <ActivityWidget notices={notices} />
        </div>
      )}
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
          <p className="vael-kicker">2. Veil</p>
          <p className="mt-1">Veil In — I am available. Veil Out — I need someone. Default visibility is 24 hours.</p>
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
      <Link to="/media-technology/veil?create=1" className={buttonClassName({ className: "mt-8" })}>
        Set availability
      </Link>
    </CityPage>
  );
}
