import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { CX_BUDGET_BANDS } from "@/lib/cxProjectStore";
import { NEED_HOME_PATH, NEED_LOCATION_PATH, NEED_REVIEW_PATH, NEED_TIMING_PATH, needContinueTarget } from "@/lib/cxRoutes";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { NEED_START_OPTIONS, type NeedStart } from "./Timing";
import { OpportunityAction, OpportunityChoice, OpportunityFrame, opportunityTitleClass } from "./OpportunityChrome";

export function NeedBudgetPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const work = readNeedWork();
  const returning = new URLSearchParams(search).get("return") === "review";
  const [budget, setBudget] = useState(work.budget);

  if (work.categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;
  if (!work.city.trim()) return <Navigate to={NEED_LOCATION_PATH} replace />;
  if (!NEED_START_OPTIONS.includes(work.timing as NeedStart)) return <Navigate to={NEED_TIMING_PATH} replace />;

  function choose(value: string) {
    setBudget(value);
    saveNeedWork({ budget: value });
  }

  return (
    <OpportunityFrame
      step={7}
      category={work.categories[0]}
      backTo={returning ? NEED_REVIEW_PATH : NEED_TIMING_PATH}
      action={
        <OpportunityAction
          disabled={!budget}
          onClick={() => {
            saveNeedWork({ budget });
            navigate(needContinueTarget(NEED_REVIEW_PATH, search));
          }}
        >
          Next
        </OpportunityAction>
      }
    >
      <h1 className={opportunityTitleClass}>Do you have a budget in mind?</h1>
      <p className="mt-3 text-body leading-relaxed text-muted">
        A rough range helps contractors decide. Not sure is a perfectly good answer.
      </p>
      <ul className="mt-6 grid gap-3">
        {CX_BUDGET_BANDS.map((option) => (
          <li key={option}>
            <OpportunityChoice label={option} selected={budget === option} onClick={() => choose(option)} />
          </li>
        ))}
      </ul>
    </OpportunityFrame>
  );
}
