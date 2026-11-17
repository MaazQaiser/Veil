import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { findAccountByHandle } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import { looksLikeEmail, looksLikePhone } from "@/lib/cxProjectStore";
import { NEED_HOME_PATH, NEED_LOCATION_PATH, NEED_REVIEW_PATH, needContinueTarget } from "@/lib/cxRoutes";
import { Input } from "@/components/ui/controls";
import { IconLock, IconMessage } from "@/components/ui/icons";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { OpportunityAction, OpportunityFrame, opportunityTitleClass } from "./OpportunityChrome";

export function NeedSavePage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { session } = useCitySession();
  const work = readNeedWork();
  // Signed-in people already gave these when they made their account.
  const account = session.handle ? findAccountByHandle(session.handle) : undefined;
  const [email, setEmail] = useState(work.saveEmail || account?.email || "");
  const [phone, setPhone] = useState(work.savePhone || account?.phone || "");
  const [error, setError] = useState("");
  const returning = new URLSearchParams(search).get("return") === "review";

  if (work.categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;
  if (!work.description.trim()) return <Navigate to={NEED_HOME_PATH} replace />;
  if (!work.city.trim() || !work.timing || !work.budget) return <Navigate to={NEED_LOCATION_PATH} replace />;

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
    navigate(needContinueTarget(NEED_REVIEW_PATH, search));
  }

  return (
    <OpportunityFrame
      step={3}
      center
      width="lg"
      category={work.categories[0]}
      backTo={returning ? NEED_REVIEW_PATH : NEED_LOCATION_PATH}
      action={<OpportunityAction onClick={continueSave}>Next</OpportunityAction>}
    >
      <h1 className={opportunityTitleClass}>
        Your contact details
      </h1>
      <p className="mt-3 text-body leading-relaxed text-muted">
        How we reach you when a contractor is interested.
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
      <p className="mt-2 text-body-sm text-muted">A US mobile number, or + and your country code.</p>
      <ul className="mt-6 space-y-2.5 rounded-xl border border-border-subtle bg-white/[0.03] p-4 text-body-sm text-muted">
        <li className="flex items-start gap-2.5">
          <IconLock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          Not shown on your opportunity card.
        </li>
        <li className="flex items-start gap-2.5">
          <IconMessage className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          Shared only once a Handshake opens, when you and a contractor are both interested.
        </li>
      </ul>
      {error ? <p className="mt-3 text-body-sm text-destructive">{error}</p> : null}
    </OpportunityFrame>
  );
}
