import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { IconGrid, IconHandshake, IconUser, IconVael } from "@/components/ui/icons";
import { useCitySession } from "@/lib/citySession";
import { completeOnboardingStep, getOnboardingDraft } from "@/lib/onboarding";
import { JoinFooterBar, JoinHead } from "./JoinLayout";

function nextSteps(intent: "in" | "out" | "") {
  const vaelStep =
    intent === "out"
      ? { title: "Vael Out", detail: "Post what you need so the right people can find you." }
      : { title: "Vael In", detail: "Set your availability so the right people can find you." };
  return [
    { title: "Build your profile", detail: "Your name, location, and what you do.", icon: IconUser },
    { title: "Choose your district", detail: "The community your matches are drawn from.", icon: IconGrid },
    { ...vaelStep, icon: IconVael },
    { title: "Discover matches", detail: "See who fits, ranked by percentage.", icon: IconHandshake },
  ];
}

export function JoinWelcomePage() {
  const { session } = useCitySession();
  const navigate = useNavigate();
  const NEXT_STEPS = nextSteps(getOnboardingDraft(session.handle)?.intent ?? "");

  function onContinue() {
    completeOnboardingStep(session.handle, "Welcome");
    navigate("/join/setup");
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <JoinHead
        title="Welcome to VAEL"
        lede="VAEL is an availability network where people and businesses connect based on fit and availability."
        center
      />
      <div className="mt-9 overflow-hidden rounded-2xl border border-border">
        <div className="flex items-center justify-between px-6 py-5">
          <p className="text-body font-medium text-foreground">Setup progress</p>
          <span className="inline-flex items-center rounded-full bg-[#FFC555]/20 px-3 py-1 text-caption font-bold uppercase tracking-[0.04em] text-[#8A6D00]">
            0 / {NEXT_STEPS.length} done
          </span>
        </div>
        <ul className="divide-y divide-border-subtle border-t border-border">
          {NEXT_STEPS.map((item) => (
            <li key={item.title} className="flex items-center gap-4 px-6 py-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B0C0C] text-[#FACC15]">
                <item.icon className="h-[1.1rem] w-[1.1rem]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium text-foreground">{item.title}</p>
                <p className="mt-0.5 text-body-sm text-muted">{item.detail}</p>
              </div>
              <span aria-hidden className="h-5 w-5 shrink-0 rounded-full border border-foreground/15" />
            </li>
          ))}
        </ul>
      </div>
      <JoinFooterBar>
        <Button type="button" size="lg" className="rounded-full px-10" onClick={onContinue}>
          Continue
        </Button>
      </JoinFooterBar>
    </div>
  );
}
