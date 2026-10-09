import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { looksLikeEmail, looksLikePhone } from "@/lib/cxProjectStore";
import { NEED_DESCRIBE_PATH, NEED_HOME_PATH, NEED_LOCATION_PATH, NEED_MEDIA_PATH, NEED_REVIEW_PATH, needContinueTarget } from "@/lib/cxRoutes";
import { Input } from "@/components/ui/controls";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { OpportunityAction, OpportunityFrame, opportunityTitleClass } from "./OpportunityChrome";

export function NeedSavePage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const work = readNeedWork();
  const [email, setEmail] = useState(work.saveEmail);
  const [phone, setPhone] = useState(work.savePhone);
  const [error, setError] = useState("");
  const returning = new URLSearchParams(search).get("return") === "review";

  if (work.categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;
  if (!work.description.trim()) return <Navigate to={NEED_DESCRIBE_PATH} replace />;

  function continueSave() {
    if (!looksLikeEmail(email)) {
      setError("Enter an email address.");
      return;
    }
    if (!looksLikePhone(phone)) {
      setError("Enter a mobile number.");
      return;
    }
    saveNeedWork({ saveEmail: email.trim(), savePhone: phone.trim() });
    navigate(needContinueTarget(NEED_LOCATION_PATH, search));
  }

  return (
    <OpportunityFrame
      step={4}
      category={work.categories[0]}
      backTo={returning ? NEED_REVIEW_PATH : NEED_MEDIA_PATH}
      action={<OpportunityAction onClick={continueSave}>Save and continue</OpportunityAction>}
    >
      <h1 className={opportunityTitleClass}>
        Save your project
      </h1>
      <p className="mt-3 text-body leading-relaxed text-muted">
        We’ll email you a link so you can finish on any device, and one reminder tomorrow if you don’t. No password yet.
      </p>
      <label htmlFor="need-save-email" className="mt-6 block text-body font-medium text-foreground">
        Email
      </label>
      <Input
        id="need-save-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError("");
          saveNeedWork({ saveEmail: event.target.value });
        }}
        className="mt-2"
      />
      <label htmlFor="need-save-phone" className="mt-5 block text-body font-medium text-foreground">
        Mobile phone
      </label>
      <Input
        id="need-save-phone"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(event) => {
          setPhone(event.target.value);
          setError("");
          saveNeedWork({ savePhone: event.target.value });
        }}
        className="mt-2"
      />
      <p className="mt-2 text-body-sm text-muted">
        A US mobile number, or + and your country code. We’ll text a code to it before your project goes live.
      </p>
      <p className="mt-3 inline-flex items-center gap-2 text-body-sm text-muted">
        <span aria-hidden className="text-[#DE7C40]">
          ✓
        </span>
        Never shown to contractors.
      </p>
      {error ? <p className="mt-3 text-body-sm text-destructive">{error}</p> : null}
    </OpportunityFrame>
  );
}
