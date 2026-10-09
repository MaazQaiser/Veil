import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { NEED_HOME_PATH, NEED_MEDIA_PATH, NEED_REVIEW_PATH, needContinueTarget } from "@/lib/cxRoutes";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { Textarea } from "@/components/ui/controls";
import { OpportunityAction, OpportunityFrame, opportunityTitleClass } from "./OpportunityChrome";

const MAX = 2000;

export function NeedDescribePage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const work = readNeedWork();
  const [description, setDescription] = useState(work.description);
  const returning = new URLSearchParams(search).get("return") === "review";

  if (work.categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;

  return (
    <OpportunityFrame
      step={2}
      category={work.categories[0]}
      backTo={returning ? NEED_REVIEW_PATH : NEED_HOME_PATH}
      action={
        <OpportunityAction
          disabled={!returning && !description.trim()}
          onClick={() => {
            saveNeedWork({ description });
            navigate(needContinueTarget(NEED_MEDIA_PATH, search));
          }}
        >
          Next
        </OpportunityAction>
      }
    >
      <h1 className={opportunityTitleClass}>What do you want done?</h1>
      <p className="mt-3 text-body leading-relaxed text-muted">
        A sentence or two is enough. What is there now, and what would you like instead?
      </p>
      <label htmlFor="need-description" className="mt-6 block text-body font-medium text-foreground">
        Describe the job
      </label>
      <Textarea
        id="need-description"
        value={description}
        maxLength={MAX}
        onChange={(event) => {
          const next = event.target.value.slice(0, MAX);
          setDescription(next);
          saveNeedWork({ description: next });
        }}
        className="mt-2 min-h-40"
      />
      <p className="mt-1 text-right text-caption text-muted">
        {description.length} / {MAX}
      </p>
      <p className="mt-2 text-body-sm text-muted">
        For example: Replace the cabinets and countertops, keeping the same layout.
      </p>
    </OpportunityFrame>
  );
}
