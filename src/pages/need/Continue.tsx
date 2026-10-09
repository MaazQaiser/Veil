import { Link } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button";
import { NEED_REVIEW_PATH } from "@/lib/cxRoutes";
import { OpportunityFrame, opportunityTitleClass } from "./OpportunityChrome";

export function NeedContinuePage() {
  return (
    <OpportunityFrame
      showProgress={false}
      eyebrow="Your project"
      backTo="/"
      backLabel="← Back to THE CITY OF VAEL"
      action={
        <Link to={NEED_REVIEW_PATH} className={buttonClassName({ size: "lg", className: "rounded-lg px-10" })}>
          Continue my project
        </Link>
      }
    >
      <h1 className={opportunityTitleClass}>Continue your project here?</h1>
      <p className="mt-3 text-body leading-relaxed text-muted">
        Your answers move to this device, and the device you started on will show that it continues here. The link works
        once.
      </p>
      <p className="mt-5 rounded-lg border border-border bg-surface px-4 py-4 text-body-sm leading-relaxed text-muted">
        If this device has a different project in progress, the emailed one replaces it here.
      </p>
    </OpportunityFrame>
  );
}
