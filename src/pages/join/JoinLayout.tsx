import { Navigate, Outlet, useLocation } from "react-router-dom";
import { JoinProgress } from "@/components/city/setup";
import { useCitySession } from "@/lib/citySession";
import {
  onboardingComplete,
  onboardingRoute,
  onboardingStep,
  onboardingStepIndex,
  pathToOnboardingStep,
} from "@/lib/onboarding";
import { PRODUCT_HOME } from "@/lib/providerJourney";

export function JoinLayout() {
  const { session } = useCitySession();
  const location = useLocation();
  const visiting = pathToOnboardingStep(location.pathname) ?? "Sign Up";

  if (session.signedIn && onboardingComplete(session.handle)) {
    return <Navigate to={PRODUCT_HOME} replace />;
  }

  if (!session.signedIn && visiting !== "Sign Up") {
    return <Navigate to="/join" replace />;
  }

  if (session.signedIn && visiting === "Sign Up") {
    return <Navigate to={onboardingRoute(session.handle)} replace />;
  }

  if (session.signedIn && visiting !== "Sign Up") {
    const allowed = onboardingStep(session.handle);
    if (onboardingStepIndex(visiting) > onboardingStepIndex(allowed)) {
      return <Navigate to={onboardingRoute(session.handle)} replace />;
    }
  }

  return (
    <div data-surface="site" className="bg-background text-foreground">
      <div className="site-container py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <JoinProgress step={visiting} />
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function JoinHead({
  title,
  lede,
}: {
  title: string;
  lede?: string;
}) {
  return (
    <header className="max-w-lg">
      <p className="site-eyebrow">VAEL</p>
      <h1 className="site-h2 mt-5">{title}</h1>
      {lede ? <p className="site-lede mt-5 text-muted">{lede}</p> : null}
    </header>
  );
}
