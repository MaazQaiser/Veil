import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { NEED_BUDGET_PATH, NEED_HOME_PATH, NEED_LOCATION_PATH, NEED_REVIEW_PATH, needContinueTarget } from "@/lib/cxRoutes";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { OpportunityAction, OpportunityChoice, OpportunityFrame, TIMING_CHOICES, opportunityTitleClass } from "./OpportunityChrome";

export const NEED_START_OPTIONS = ["ASAP", "Within 30 days", "1–3 months", "Just planning"] as const;

export type NeedStart = (typeof NEED_START_OPTIONS)[number];

export function NeedTimingPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const work = readNeedWork();
  const returning = new URLSearchParams(search).get("return") === "review";
  const [timing, setTiming] = useState(work.timing);

  if (work.categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;
  if (!work.city.trim()) return <Navigate to={NEED_LOCATION_PATH} replace />;

  function choose(value: string) {
    setTiming(value);
    saveNeedWork({ timing: value });
  }

  return (
    <OpportunityFrame
      step={6}
      category={work.categories[0]}
      backTo={returning ? NEED_REVIEW_PATH : NEED_LOCATION_PATH}
      action={
        <OpportunityAction
          disabled={!timing}
          onClick={() => {
            saveNeedWork({ timing });
            navigate(needContinueTarget(NEED_BUDGET_PATH, search));
          }}
        >
          Next
        </OpportunityAction>
      }
    >
      <h1 className={opportunityTitleClass}>When would you like to start?</h1>
      <ul className="mt-6 grid gap-3">
        {TIMING_CHOICES.map((option) => (
          <li key={option.value}>
            <OpportunityChoice label={option.label} selected={timing === option.value} onClick={() => choose(option.value)} />
          </li>
        ))}
      </ul>
    </OpportunityFrame>
  );
}
