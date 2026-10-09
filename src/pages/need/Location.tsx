import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { NEED_HOME_PATH, NEED_REVIEW_PATH, NEED_SAVE_PATH, NEED_TIMING_PATH, needContinueTarget } from "@/lib/cxRoutes";
import { Input } from "@/components/ui/controls";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { OpportunityAction, OpportunityFrame, opportunityTitleClass } from "./OpportunityChrome";

export function NeedLocationPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const work = readNeedWork();
  const [city, setCity] = useState(work.city);
  const [postalCode, setPostalCode] = useState(work.postalCode);
  const returning = new URLSearchParams(search).get("return") === "review";

  if (work.categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;

  return (
    <OpportunityFrame
      step={5}
      category={work.categories[0]}
      backTo={returning ? NEED_REVIEW_PATH : NEED_SAVE_PATH}
      action={
        <OpportunityAction
          disabled={!city.trim()}
          onClick={() => {
            saveNeedWork({ city, postalCode });
            navigate(needContinueTarget(NEED_TIMING_PATH, search));
          }}
        >
          Next
        </OpportunityAction>
      }
    >
      <h1 className={opportunityTitleClass}>
        Where is the project?
      </h1>
      <p className="mt-3 text-body leading-relaxed text-muted">
        Your project card is public: your first name, your town and the job details. Your street address is never asked
        for or shown, and your email and phone never appear.
      </p>
      <label htmlFor="need-city" className="mt-6 block text-body font-medium text-foreground">
        Town or city
      </label>
      <Input
        id="need-city"
        value={city}
        autoComplete="address-level2"
        onChange={(event) => {
          const next = event.target.value;
          setCity(next);
          saveNeedWork({ city: next });
        }}
        className="mt-2"
      />
      <p className="mt-2 text-body-sm text-muted">For example: Jacksonville</p>
      <label htmlFor="need-postal" className="mt-5 block text-body font-medium text-foreground">
        ZIP or postal code (optional)
      </label>
      <Input
        id="need-postal"
        value={postalCode}
        autoComplete="postal-code"
        onChange={(event) => {
          const next = event.target.value;
          setPostalCode(next);
          saveNeedWork({ postalCode: next });
        }}
        className="mt-2"
      />
    </OpportunityFrame>
  );
}
