import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { createAccount, findAccountByEmail, suggestHandle } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import { looksLikeEmail } from "@/lib/cxProjectStore";
import { NEED_CONFIRM_PATH, NEED_REVIEW_PATH, NEED_SAVE_PATH } from "@/lib/cxRoutes";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { finishOnboarding, patchOnboarding, startOnboarding } from "@/lib/onboarding";
import { setContractorExperience } from "@/lib/rxExperience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/controls";
import { ensureProfile, saveProfile } from "@/lib/vaelStore";
import { opportunityTitleClass } from "./OpportunityChrome";

export function NeedAccountPage() {
  const navigate = useNavigate();
  const { signIn } = useCitySession();
  const work = readNeedWork();
  const [firstName, setFirstName] = useState("");
  const [email] = useState(work.saveEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!email.trim()) return <Navigate to={NEED_SAVE_PATH} replace />;

  function create() {
    if (!firstName.trim()) {
      setError("Enter your first name.");
      return;
    }
    if (!looksLikeEmail(email)) {
      setError("Enter an email.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    const displayName = firstName.trim();
    let account = findAccountByEmail(email);
    if (!account) {
      account = createAccount({
        email,
        handle: suggestHandle(displayName, email),
        displayName,
        phone: work.savePhone,
      });
    }
    saveProfile({ ...ensureProfile(account.handle), displayName });
    saveNeedWork({ saveEmail: email });
    startOnboarding(account.handle);
    patchOnboarding(account.handle, { intent: "need", needPlace: "home", profileType: "individual" });
    finishOnboarding(account.handle);
    setContractorExperience(account.handle, "residential");
    signIn(account.handle);
    navigate(NEED_CONFIRM_PATH);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center">
      <div className="w-full rounded-lg border border-white/15 bg-[#141414] px-6 py-8 sm:px-8 sm:py-10">
        <h1 className={opportunityTitleClass}>
          Create your free account
        </h1>
        <p className="mt-3 text-body leading-relaxed text-muted">
          Your project is ready. Create your free VAEL account to make it visible to contractors.
        </p>
        <label htmlFor="need-first" className="mt-6 block text-body font-medium text-foreground">
          First name
        </label>
        <Input id="need-first" value={firstName} autoComplete="given-name" onChange={(event) => setFirstName(event.target.value)} className="mt-2" />
        <p className="mt-2 text-body-sm text-muted">Contractors see your first name only.</p>
        <label htmlFor="need-email" className="mt-5 block text-body font-medium text-foreground">
          Email
        </label>
        <Input id="need-email" type="email" value={email} readOnly className="mt-2 text-muted" />
        <label htmlFor="need-password" className="mt-5 block text-body font-medium text-foreground">
          Password
        </label>
        <Input
          id="need-password"
          type="password"
          value={password}
          autoComplete="new-password"
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2"
        />
        <p className="mt-2 text-body-sm text-muted">At least 8 characters.</p>
        {error ? <p className="mt-3 text-body-sm text-destructive">{error}</p> : null}
        <Button type="button" size="lg" onClick={create} className="mt-8 w-full rounded-lg">
          Create account
        </Button>
        <p className="mt-4 text-center text-body-sm text-muted">
          Already have an account?{" "}
          <Link to="/sign-in?from=project" className="font-medium text-accent hover:text-accent-hover">
            Sign in
          </Link>
        </p>
        <Link to={NEED_REVIEW_PATH} className="mt-6 inline-flex text-body font-medium text-muted hover:text-foreground">
          ← Back
        </Link>
      </div>
    </div>
  );
}
