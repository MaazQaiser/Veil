import { useLocation, useNavigate } from "react-router-dom";
import { IconBriefcase, IconHome } from "@/components/ui/icons";
import { useCitySession } from "@/lib/citySession";
import { NEED_HOME_PATH } from "@/lib/cxRoutes";
import { GO_VISIBLE_ROUTE } from "@/components/city/CityShell";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { setContractorExperience } from "@/lib/rxExperience";
import { NeedFooter } from "./NeedLayout";

export function NeedPlacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useCitySession();
  const fromGoVisible = (location.state as { from?: string } | null)?.from === "go-visible";

  function chooseHome() {
    if (session.handle) setContractorExperience(session.handle, "residential");
    navigate(NEED_HOME_PATH, { state: location.state });
  }

  function goBack() {
    if (fromGoVisible) {
      navigate(GO_VISIBLE_ROUTE, { state: { opportunityStep: true } });
      return;
    }
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) {
      navigate(-1);
      return;
    }
    navigate(PRODUCT_HOME);
  }

  return (
    <div>
      <div className="rounded-lg border border-white/15 bg-[#141414] px-6 py-8 sm:px-8 sm:py-10">
        <h1 className="max-w-xl font-sans text-[clamp(1.875rem,3.4vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.025em] text-foreground">
          Is this for your home or your business?
        </h1>
        <p className="mt-3 max-w-lg font-sans text-[1.0625rem] leading-[1.55] text-muted">
          Tell us a little about the job. It takes about two minutes, and you can stop and come back.
        </p>

        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          <li>
            <button
              type="button"
              onClick={chooseHome}
              className="flex h-full w-full flex-col items-start rounded-lg border border-white/15 bg-surface px-5 py-5 text-left motion-safe:transition-colors hover:border-white/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DE7C40]/15 text-[#DE7C40]">
                <IconHome className="h-5 w-5" />
              </span>
              <span className="mt-4 text-body font-medium text-foreground">For my home</span>
              <span className="mt-1 text-body-sm text-muted">Repairs, renovations and new builds</span>
            </button>
          </li>
          <li>
            <div className="flex h-full flex-col items-start rounded-lg border border-dashed border-white/20 bg-transparent px-5 py-5 text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-muted">
                <IconBriefcase className="h-5 w-5" />
              </span>
              <span className="mt-4 text-body font-medium text-foreground">For my business</span>
              <span className="mt-1 text-body-sm text-muted">Coming soon</span>
            </div>
          </li>
        </ul>
      </div>
      <NeedFooter onBack={goBack}>{null}</NeedFooter>
    </div>
  );
}
