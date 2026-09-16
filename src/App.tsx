import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { CityLayout } from "@/components/city/CityLayout";
import { CitySessionProvider } from "@/lib/citySession";
import { ThemeProvider } from "@/lib/theme";
import { VaelCoreProvider } from "@/lib/vaelCore";
import { ConstructionCoreProvider } from "@/lib/constructionCore";
import { TruckingCoreProvider } from "@/lib/truckingCore";
import { ResidentialCoreProvider } from "@/lib/residentialCore";
import { CommercialCoreProvider } from "@/lib/commercialCore";
import { CommunityCoreProvider } from "@/lib/communityCore";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { DesignSystemGallery } from "@/gallery/DesignSystemGallery";
import { SignInPage, SignUpPage } from "@/pages/city/Auth";
import {
  JoinCredentialsPage,
  JoinIdentityPage,
  JoinIntentPage,
  JoinLayout,
  JoinPreviewPage,
  JoinSetupPage,
  JoinSignUpPage,
  JoinWelcomePage,
} from "@/pages/join";
import { DemoResetPage } from "@/pages/city/DemoReset";
import { DemoResetVaelPage } from "@/pages/city/DemoResetVael";
import { GoVisiblePage, HomePage, SearchPage } from "@/pages/city/Home";
import { ExplorePage } from "@/pages/city/Explore";
import { DistrictCommunityPage, FeedPage, SavedPostsPage, UnavailableCommunityPage } from "@/pages/community/Feed";
import { CreatePostPage, PostDetailPage } from "@/pages/community/Post";
import { DistrictPlaceholderPage, DistrictsPage } from "@/pages/city/Districts";
import { DistrictHomePage, HowItWorksPage } from "@/pages/mt/DistrictHome";
import {
  DistrictOverviewPage,
  DistrictsPage as ManageDistrictsPage,
  EditDistrictProfilePage,
} from "@/pages/mt/Districts";
import { AllMatchesPage } from "@/pages/mt/AllMatches";
import { MatchesPage } from "@/pages/city/Matches";
import { MessagesPage } from "@/pages/city/Messages";
import { HandshakeRequestPage, MatchDetailPage } from "@/pages/mt/Board";
import { ActiveVaelPage, PostOpportunityPage, VaelPage } from "@/pages/mt/Vael";
import { ProfileEditPage, ProfilePage } from "@/pages/mt/Profile";
import { ConnectionDetailPage, ConnectionsPage } from "@/pages/mt/Handshake";
import { ConstructionHomePage, ConstructionHowItWorksPage } from "@/pages/construction/Home";
import { ConstructionMatchDetailPage } from "@/pages/construction/Board";
import { ConstructionVaelPage } from "@/pages/construction/Vael";
import { ConstructionProfileEditPage, ConstructionProfilePage } from "@/pages/construction/Profile";
import { ConstructionConnectionDetailPage, ConstructionConnectionsPage } from "@/pages/construction/Handshake";
import { TruckingHomePage, TruckingHowItWorksPage } from "@/pages/trucking/Home";
import { TruckingMatchDetailPage } from "@/pages/trucking/Board";
import { TruckingVaelPage } from "@/pages/trucking/Vael";
import { TruckingProfileEditPage, TruckingProfilePage } from "@/pages/trucking/Profile";
import { TruckingConnectionDetailPage, TruckingConnectionsPage } from "@/pages/trucking/Handshake";
import { ResidentialHomePage, ResidentialHowItWorksPage } from "@/pages/residential/Home";
import { ResidentialMatchDetailPage } from "@/pages/residential/Board";
import { ResidentialVaelPage } from "@/pages/residential/Vael";
import { ResidentialProfileEditPage, ResidentialProfilePage } from "@/pages/residential/Profile";
import { ResidentialConnectionDetailPage, ResidentialConnectionsPage } from "@/pages/residential/Handshake";
import { CommercialHomePage, CommercialHowItWorksPage } from "@/pages/commercial/Home";
import { CommercialMatchDetailPage } from "@/pages/commercial/Board";
import { CommercialVaelPage } from "@/pages/commercial/Vael";
import { CommercialProfileEditPage, CommercialProfilePage } from "@/pages/commercial/Profile";
import { CommercialConnectionDetailPage, CommercialConnectionsPage } from "@/pages/commercial/Handshake";
import {
  AccountPage,
  CityNotFoundPage,
  ConciergePage,
  LegalPage,
  NotificationPrefsPage,
  NotificationsPage,
  TodayPage,
  VisibilityPage,
} from "@/pages/city/Account";
import { ExtendedVaelCheckoutPage, ExtendedVaelPage, ExtendedVaelSuccessPage } from "@/pages/city/ExtendedVael";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <CitySessionProvider>
        <VaelCoreProvider>
        <ConstructionCoreProvider>
        <TruckingCoreProvider>
        <ResidentialCoreProvider>
        <CommercialCoreProvider>
        <CommunityCoreProvider>
        <Routes>
          <Route element={<CityLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/join" element={<JoinLayout />}>
              <Route index element={<JoinSignUpPage />} />
              <Route path="intent" element={<JoinIntentPage />} />
              <Route path="welcome" element={<JoinWelcomePage />} />
              <Route path="setup" element={<JoinSetupPage />} />
              <Route path="handle" element={<Navigate to="/join/setup" replace />} />
              <Route path="type" element={<Navigate to="/join/setup" replace />} />
              <Route path="district" element={<Navigate to="/join/setup" replace />} />
              <Route path="identity" element={<JoinIdentityPage />} />
              <Route path="expertise" element={<Navigate to="/join/identity" replace />} />
              <Route path="work" element={<Navigate to="/join/identity" replace />} />
              <Route path="credentials" element={<JoinCredentialsPage />} />
              <Route path="profile" element={<Navigate to="/join/identity" replace />} />
              <Route path="preview" element={<JoinPreviewPage />} />
              <Route path="vael" element={<Navigate to="/join/preview" replace />} />
              <Route path="done" element={<Navigate to={PRODUCT_HOME} replace />} />
            </Route>
            <Route path="/demo/reset" element={<DemoResetPage />} />
            <Route path="/demo/reset-vael" element={<DemoResetVaelPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/feed/new" element={<CreatePostPage />} />
            <Route path="/feed/saved" element={<SavedPostsPage />} />
            <Route path="/feed/:postId" element={<PostDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/go-visible" element={<GoVisiblePage />} />
            <Route path="/districts" element={<DistrictsPage />} />
            <Route path="/districts/contractor" element={<ConstructionHomePage />} />
            <Route path="/districts/contractor/how-it-works" element={<ConstructionHowItWorksPage />} />
            <Route path="/districts/contractor/board" element={<Navigate to="/matches?district=construction" replace />} />
            <Route path="/districts/contractor/board/:listingId" element={<ConstructionMatchDetailPage />} />
            <Route path="/districts/contractor/vael" element={<ConstructionVaelPage />} />
            <Route path="/districts/contractor/profile/:username" element={<ConstructionProfilePage />} />
            <Route path="/districts/contractor/profile/:username/edit" element={<ConstructionProfileEditPage />} />
            <Route path="/districts/contractor/connections" element={<ConstructionConnectionsPage />} />
            <Route path="/districts/contractor/connections/:id" element={<ConstructionConnectionDetailPage />} />
            <Route path="/districts/contractor/community" element={<DistrictCommunityPage />} />
            <Route path="/construction" element={<Navigate to="/districts/contractor" replace />} />
            <Route path="/districts/trucking" element={<TruckingHomePage />} />
            <Route path="/districts/trucking/how-it-works" element={<TruckingHowItWorksPage />} />
            <Route path="/districts/trucking/board" element={<Navigate to="/matches?district=trucking" replace />} />
            <Route path="/districts/trucking/board/:listingId" element={<TruckingMatchDetailPage />} />
            <Route path="/districts/trucking/vael" element={<TruckingVaelPage />} />
            <Route path="/districts/trucking/profile/:username" element={<TruckingProfilePage />} />
            <Route path="/districts/trucking/profile/:username/edit" element={<TruckingProfileEditPage />} />
            <Route path="/districts/trucking/connections" element={<TruckingConnectionsPage />} />
            <Route path="/districts/trucking/connections/:id" element={<TruckingConnectionDetailPage />} />
            <Route path="/districts/trucking/community" element={<DistrictCommunityPage />} />
            <Route path="/districts/residential" element={<ResidentialHomePage />} />
            <Route path="/districts/residential/how-it-works" element={<ResidentialHowItWorksPage />} />
            <Route path="/districts/residential/board" element={<Navigate to="/matches?district=residential" replace />} />
            <Route path="/districts/residential/board/:listingId" element={<ResidentialMatchDetailPage />} />
            <Route path="/districts/residential/vael" element={<ResidentialVaelPage />} />
            <Route path="/districts/residential/profile/:username" element={<ResidentialProfilePage />} />
            <Route path="/districts/residential/profile/:username/edit" element={<ResidentialProfileEditPage />} />
            <Route path="/districts/residential/connections" element={<ResidentialConnectionsPage />} />
            <Route path="/districts/residential/connections/:id" element={<ResidentialConnectionDetailPage />} />
            <Route path="/districts/residential/community" element={<DistrictCommunityPage />} />
            <Route path="/districts/commercial" element={<CommercialHomePage />} />
            <Route path="/districts/commercial/how-it-works" element={<CommercialHowItWorksPage />} />
            <Route path="/districts/commercial/board" element={<Navigate to="/matches?district=commercial" replace />} />
            <Route path="/districts/commercial/board/:listingId" element={<CommercialMatchDetailPage />} />
            <Route path="/districts/commercial/vael" element={<CommercialVaelPage />} />
            <Route path="/districts/commercial/profile/:username" element={<CommercialProfilePage />} />
            <Route path="/districts/commercial/profile/:username/edit" element={<CommercialProfileEditPage />} />
            <Route path="/districts/commercial/connections" element={<CommercialConnectionsPage />} />
            <Route path="/districts/commercial/connections/:id" element={<CommercialConnectionDetailPage />} />
            <Route path="/districts/commercial/community" element={<DistrictCommunityPage />} />
            <Route path="/districts/:slug/community" element={<UnavailableCommunityPage />} />
            <Route path="/districts/:slug" element={<DistrictPlaceholderPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/concierge" element={<ConciergePage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/visibility" element={<VisibilityPage />} />
            <Route path="/account/notifications" element={<NotificationPrefsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/extended-vael" element={<ExtendedVaelPage />} />
            <Route path="/extended-vael/checkout" element={<ExtendedVaelCheckoutPage />} />
            <Route path="/extended-vael/success" element={<ExtendedVaelSuccessPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/media-technology" element={<DistrictHomePage />} />
            <Route path="/media-technology/matches" element={<AllMatchesPage />} />
            <Route path="/media-technology/districts" element={<ManageDistrictsPage />} />
            <Route path="/media-technology/districts/:districtId" element={<DistrictOverviewPage />} />
            <Route path="/media-technology/districts/:districtId/edit" element={<EditDistrictProfilePage />} />
            <Route path="/media-technology/how-it-works" element={<HowItWorksPage />} />
            <Route path="/media-technology/board" element={<Navigate to="/matches?district=media-technology" replace />} />
            <Route path="/media-technology/board/:listingId" element={<MatchDetailPage />} />
            <Route path="/media-technology/board/:listingId/handshake" element={<HandshakeRequestPage />} />
            <Route path="/media-technology/vael" element={<VaelPage />} />
            <Route path="/media-technology/vael/active" element={<ActiveVaelPage />} />
            <Route path="/media-technology/post-opportunity" element={<PostOpportunityPage />} />
            <Route path="/media-technology/profile/member" element={<Navigate to="/media-technology/profile/alexmorgan" replace />} />
            <Route path="/media-technology/profile/member/edit" element={<Navigate to="/media-technology/profile/alexmorgan/edit" replace />} />
            <Route path="/media-technology/profile/:username" element={<ProfilePage />} />
            <Route path="/media-technology/profile/:username/edit" element={<ProfileEditPage />} />
            <Route path="/media-technology/connections" element={<ConnectionsPage />} />
            <Route path="/media-technology/connections/:id" element={<ConnectionDetailPage />} />
            <Route path="/media-technology/community" element={<DistrictCommunityPage />} />
            <Route path="/board" element={<Navigate to="/matches" replace />} />
            <Route path="/profile/:username" element={<LegacyProfileRedirect />} />
            <Route path="/connections" element={<Navigate to="/media-technology/connections" replace />} />
            <Route path="/connections/:id" element={<LegacyConnectionRedirect />} />
            <Route
              path="/legal/terms"
              element={<LegalPage title="Terms" body="Existing City legal route. Full terms copy lives in the product clone." />}
            />
            <Route
              path="/legal/privacy"
              element={<LegalPage title="Privacy" body="Existing City legal route. Full policy copy lives in the product clone." />}
            />
            <Route
              path="/legal/sms-terms"
              element={
                <LegalPage
                  title="SMS terms"
                  body="SMS is NOT YET CONNECTED. This route exists so the documented legal map still resolves."
                />
              }
            />
            <Route path="*" element={<CityNotFoundPage />} />
          </Route>
          <Route path="/design-system" element={<DesignSystemGallery />} />
        </Routes>
        </CommunityCoreProvider>
        </CommercialCoreProvider>
        </ResidentialCoreProvider>
        </TruckingCoreProvider>
        </ConstructionCoreProvider>
        </VaelCoreProvider>
      </CitySessionProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function LegacyProfileRedirect() {
  const { username } = useParams();
  return <Navigate to={`/media-technology/profile/${username}`} replace />;
}

function LegacyConnectionRedirect() {
  const { id } = useParams();
  return <Navigate to={`/media-technology/connections/${id}`} replace />;
}
