import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlowStrip } from "@/components/marketing/primitives";
import { useCitySession } from "@/lib/citySession";
import { completeOnboardingStep } from "@/lib/onboarding";
import { JoinHead } from "./JoinLayout";

export function JoinWelcomePage() {
  const { session } = useCitySession();
  const navigate = useNavigate();

  function onContinue() {
    completeOnboardingStep(session.handle, "Welcome");
    navigate("/join/handle");
  }

  return (
    <div className="max-w-lg">
      <JoinHead
        title="Welcome to VAEL"
        lede="VAEL is an availability network where people and businesses connect based on fit and availability."
      />
      <div className="mt-10">
        <p className="site-eyebrow">What happens next</p>
        <div className="mt-5">
          <FlowStrip steps={["Build your profile", "Choose your district", "Veil In", "Discover matches"]} />
        </div>
      </div>
      <Button type="button" size="lg" className="mt-10 rounded-full px-7" onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
}
