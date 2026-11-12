import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/controls";
import { RX_PROJECT_CATEGORIES, type RxProjectCategory } from "@/lib/cxProjectStore";
import { NEED_LOCATION_PATH, NEED_PATH, NEED_REVIEW_PATH, needContinueTarget } from "@/lib/cxRoutes";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { PhotoPicker } from "./Media";
import { OpportunityAction, OpportunityFrame, opportunityTitleClass } from "./OpportunityChrome";

const MAX = 2000;

/** Step 1: what the job is and what you want done, with photos, all on one screen. */
export function NeedCategoriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = location;
  const work = readNeedWork();
  const [category, setCategory] = useState<RxProjectCategory | "">((work.categories[0] ?? "") as RxProjectCategory | "");
  const [description, setDescription] = useState(work.description);
  const returning = new URLSearchParams(search).get("return") === "review";

  function goBack() {
    if (returning) {
      navigate(NEED_REVIEW_PATH);
      return;
    }
    // Always the home-or-business question. History can point at a later step after coming back from it.
    navigate(NEED_PATH, { state: location.state });
  }

  function next() {
    if (!category) return;
    saveNeedWork({ categories: [category], description });
    navigate(needContinueTarget(NEED_LOCATION_PATH, search));
  }

  return (
    <OpportunityFrame
      step={1}
      center
      width="lg"
      onBack={goBack}
      action={
        <OpportunityAction disabled={!category || !description.trim()} onClick={next}>
          Next
        </OpportunityAction>
      }
    >
      <h1 className={opportunityTitleClass}>Tell us about the job</h1>
      <div className="mt-6 space-y-5">
        <Field label="What do you need done?" htmlFor="need-category">
          <Select
            id="need-category"
            value={category}
            onChange={(event) => {
              const next = event.target.value as RxProjectCategory | "";
              setCategory(next);
              if (next) saveNeedWork({ categories: [next] });
            }}
          >
            <option value="">Select a type of work</option>
            {RX_PROJECT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="What do you want done?"
          htmlFor="need-description"
          hint={`A sentence or two is enough. ${description.length} / ${MAX}`}
        >
          <Textarea
            id="need-description"
            value={description}
            maxLength={MAX}
            placeholder="For example: Replace the cabinets and countertops, keeping the same layout."
            onChange={(event) => {
              const next = event.target.value.slice(0, MAX);
              setDescription(next);
              saveNeedWork({ description: next });
            }}
            className="min-h-28"
          />
        </Field>
        <PhotoPicker />
      </div>
    </OpportunityFrame>
  );
}
