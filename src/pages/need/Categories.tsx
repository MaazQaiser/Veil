import { useLocation, useNavigate } from "react-router-dom";
import { RX_PROJECT_CATEGORIES, type RxProjectCategory } from "@/lib/cxProjectStore";
import { NEED_DESCRIBE_PATH, NEED_PATH, NEED_REVIEW_PATH, needContinueTarget } from "@/lib/cxRoutes";
import { cn } from "@/lib/cn";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { CategoryMark, OpportunityFrame, opportunityTitleClass } from "./OpportunityChrome";

export function NeedCategoriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = location;
  const selected = readNeedWork().categories[0];
  const returning = new URLSearchParams(search).get("return") === "review";

  function goBack() {
    if (returning) {
      navigate(NEED_REVIEW_PATH);
      return;
    }
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) {
      navigate(-1);
      return;
    }
    navigate(NEED_PATH, { state: location.state });
  }

  function choose(category: RxProjectCategory) {
    saveNeedWork({ categories: [category] });
    navigate(needContinueTarget(NEED_DESCRIBE_PATH, search));
  }

  return (
    <OpportunityFrame step={1} onBack={goBack}>
      <h1 className={opportunityTitleClass}>What do you need done?</h1>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {RX_PROJECT_CATEGORIES.map((category) => {
          const on = selected === category;
          return (
            <li key={category}>
              <button
                type="button"
                onClick={() => choose(category)}
                className={cn(
                  "flex min-h-[7.25rem] w-full flex-col items-start rounded-lg border bg-surface px-4 py-4 text-left text-body font-medium text-foreground motion-safe:transition-colors",
                  on ? "border-white" : "border-white/15 hover:border-white/50",
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DE7C40]/15 text-[#DE7C40]">
                  <CategoryMark category={category} />
                </span>
                <span className="mt-4">{category}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </OpportunityFrame>
  );
}
