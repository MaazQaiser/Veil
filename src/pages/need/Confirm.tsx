import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { NEED_CONTINUE_PATH, NEED_SAVE_PATH } from "@/lib/cxRoutes";
import { readNeedWork } from "@/lib/needWork";
import { OpportunityFrame, opportunityTitleClass } from "./OpportunityChrome";

export function NeedConfirmPage() {
  const navigate = useNavigate();
  const work = readNeedWork();
  const email = work.saveEmail.trim();
  const [seconds, setSeconds] = useState(25);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  if (!email) return <Navigate to={NEED_SAVE_PATH} replace />;

  return (
    <OpportunityFrame showProgress={false} category={work.categories[0]}>
      <h1 className={opportunityTitleClass}>
        Confirm your email
      </h1>
      <p className="mt-3 text-body leading-relaxed text-muted">
        We sent a link to {email}. Open it on this device, and your project will be waiting here, ready to go live.
      </p>
      <p className="mt-6 rounded-lg border border-border bg-surface px-4 py-3 text-body-sm text-muted">
        Can’t find it? Check your spam folder.
      </p>
      <button
        type="button"
        onClick={() => navigate(NEED_CONTINUE_PATH)}
        className="mt-5 text-body-sm font-medium text-accent underline decoration-accent underline-offset-4 hover:text-accent-hover"
      >
        {seconds > 0 ? `Send it again (${seconds})` : "Send it again"}
      </button>
      <p className="mt-6 text-body-sm text-muted">
        Confirmed it on another device?{" "}
        <Link to={NEED_CONTINUE_PATH} className="font-medium text-accent hover:text-accent-hover">
          Sign in here
        </Link>
      </p>
    </OpportunityFrame>
  );
}
