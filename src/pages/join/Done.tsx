import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCitySession } from "@/lib/citySession";
import { districts } from "@/lib/districts";
import { finishOnboarding, getOnboardingDraft } from "@/lib/onboarding";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { JoinHead } from "./JoinLayout";

export function JoinDonePage() {
  const { session } = useCitySession();
  const navigate = useNavigate();
  const draft = getOnboardingDraft(session.handle);
  const district = districts.find((item) => item.id === (draft?.districtId || "media-technology"));

  function onExplore() {
    finishOnboarding(session.handle);
    navigate(PRODUCT_HOME);
  }

  return (
    <div className="max-w-lg">
      <JoinHead title="You're in." lede="Your profile is now available to the VAEL network." />
      <dl className="mt-10 space-y-4">
        <div>
          <dt className="site-meta">Veiled In</dt>
          <dd className="mt-2 text-h4 font-medium">Available</dd>
        </div>
        <div>
          <dt className="site-meta">District</dt>
          <dd className="mt-2 text-h4 font-medium">{district?.name ?? "Media & Technology"}</dd>
        </div>
      </dl>
      <div className="mt-12">
        <p className="site-eyebrow">Your next step</p>
        <h2 className="site-h3 mt-4">See who fits.</h2>
        <Button type="button" size="lg" className="mt-8 rounded-full px-7" onClick={onExplore}>
          Explore Matches
        </Button>
      </div>
    </div>
  );
}
