import { useLocation, useNavigate } from "react-router-dom";
import { IconBriefcase, IconHome } from "@/components/ui/icons";
import { useCitySession } from "@/lib/citySession";
import { MY_OPPORTUNITIES_PATH, NEED_HOME_PATH } from "@/lib/cxRoutes";
import { GO_VISIBLE_ROUTE } from "@/components/city/CityShell";
import { setContractorExperience } from "@/lib/rxExperience";
import { cn } from "@/lib/cn";
import { NeedFooter } from "./NeedLayout";
import { WIZARD_CARD } from "./OpportunityChrome";

export function NeedPlacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useCitySession();
  const goVisibleState = location.state as { from?: string; opportunityIntent?: "create" | "avail" } | null;
  const fromGoVisible = goVisibleState?.from === "go-visible";

  function chooseHome() {
    if (session.handle) setContractorExperience(session.handle, "residential");
    navigate(NEED_HOME_PATH, { state: location.state });
  }

  function goBack() {
    if (fromGoVisible) {
      navigate(GO_VISIBLE_ROUTE, {
        state: { opportunityStep: true, districtStep: true, opportunityIntent: goVisibleState?.opportunityIntent ?? "create" },
      });
      return;
    }
    // Posting starts from "Your opportunities", so that is where Back returns. Visitors who are not signed in go back to the website's opportunities.
    navigate(session.signedIn ? MY_OPPORTUNITIES_PATH : "/projects");
  }

  return (
    <div className="flex min-h-[calc(100dvh-13rem)] items-center justify-center">
      <div className={cn(WIZARD_CARD, "w-full max-w-3xl")}>
        <p className="text-caption font-semibold uppercase tracking-[0.16em] text-accent">I need something done</p>
        <h1 className="mt-3 max-w-xl font-sans text-[clamp(1.875rem,3.4vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.025em] text-foreground">
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
              className={cn(
                "group relative flex h-full w-full flex-col items-start rounded-xl border border-white/10 bg-white/[0.03] p-6 text-left",
                "motion-safe:transition-all motion-safe:duration-200",
                "hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/[0.06] hover:shadow-[0_18px_40px_-20px_rgba(238,138,74,0.5)]",
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30 [&_svg]:h-6 [&_svg]:w-6">
                <IconHome />
              </span>
              <span className="mt-5 text-body-lg font-semibold text-foreground">For my home</span>
              <span className="mt-1 text-body-sm text-muted">Repairs, renovations and new builds</span>
              <span
                aria-hidden
                className="absolute right-5 top-5 text-accent opacity-0 motion-safe:-translate-x-1 motion-safe:transition-all motion-safe:duration-200 group-hover:translate-x-0 group-hover:opacity-100"
              >
                →
              </span>
            </button>
          </li>
          <li>
            <div className="relative flex h-full flex-col items-start rounded-xl border border-dashed border-white/15 p-6 text-left">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-muted [&_svg]:h-6 [&_svg]:w-6">
                <IconBriefcase />
              </span>
              <span className="mt-5 text-body-lg font-semibold text-foreground/80">For my business</span>
              <span className="absolute right-4 top-4 rounded-full border border-white/10 px-2.5 py-1 text-caption font-medium text-muted">
                Coming soon
              </span>
            </div>
          </li>
        </ul>
      </div>
      <NeedFooter onBack={goBack}>{null}</NeedFooter>
    </div>
  );
}
