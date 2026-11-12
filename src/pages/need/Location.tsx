import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/controls";
import { CX_BUDGET_BANDS } from "@/lib/cxProjectStore";
import { NEED_HOME_PATH, NEED_REVIEW_PATH, NEED_SAVE_PATH, needContinueTarget } from "@/lib/cxRoutes";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { OpportunityAction, OpportunityFrame, TIMING_CHOICES, opportunityTitleClass } from "./OpportunityChrome";

/** Step 2: where the project is, when to start and the budget, all on one screen. */
export function NeedLocationPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const work = readNeedWork();
  const [city, setCity] = useState(work.city);
  const [postalCode, setPostalCode] = useState(work.postalCode);
  const [timing, setTiming] = useState(work.timing);
  const [budget, setBudget] = useState(work.budget);
  const returning = new URLSearchParams(search).get("return") === "review";

  if (work.categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;

  return (
    <OpportunityFrame
      step={2}
      center
      width="lg"
      category={work.categories[0]}
      backTo={returning ? NEED_REVIEW_PATH : NEED_HOME_PATH}
      action={
        <OpportunityAction
          disabled={!city.trim() || !timing || !budget}
          onClick={() => {
            saveNeedWork({ city, postalCode, timing, budget });
            navigate(needContinueTarget(NEED_SAVE_PATH, search));
          }}
        >
          Next
        </OpportunityAction>
      }
    >
      <h1 className={opportunityTitleClass}>Where and when</h1>
      <p className="mt-3 text-body-sm leading-relaxed text-muted">
        Your opportunity card shows your first name, your town and these answers. Never your street address, email or phone.
      </p>
      <div className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Town or city" htmlFor="need-city" required hint="For example: Jacksonville">
            <Input
              id="need-city"
              value={city}
              autoComplete="address-level2"
              onChange={(event) => {
                setCity(event.target.value);
                saveNeedWork({ city: event.target.value });
              }}
            />
          </Field>
          <Field label="ZIP or postal code" htmlFor="need-postal" hint="Optional">
            <Input
              id="need-postal"
              value={postalCode}
              autoComplete="postal-code"
              onChange={(event) => {
                setPostalCode(event.target.value);
                saveNeedWork({ postalCode: event.target.value });
              }}
            />
          </Field>
        </div>
        <Field label="When would you like to start?" htmlFor="need-timing" required>
          <Select
            id="need-timing"
            value={timing}
            onChange={(event) => {
              setTiming(event.target.value);
              saveNeedWork({ timing: event.target.value });
            }}
          >
            <option value="">Select a start time</option>
            {TIMING_CHOICES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Do you have a budget in mind?" htmlFor="need-budget" required hint="Not sure is a perfectly good answer.">
          <Select
            id="need-budget"
            value={budget}
            onChange={(event) => {
              setBudget(event.target.value);
              saveNeedWork({ budget: event.target.value });
            }}
          >
            <option value="">Select a budget</option>
            {CX_BUDGET_BANDS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </OpportunityFrame>
  );
}
