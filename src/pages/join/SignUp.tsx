import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";
import { createAccount, findAccountByEmail, suggestHandle } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import { prepareDemoWorkspace } from "@/lib/demoJourney";
import { startOnboarding } from "@/lib/onboarding";
import { ensureProfile } from "@/lib/vaelStore";
import { JoinHead } from "./JoinLayout";

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function JoinSignUpPage() {
  const { signIn } = useCitySession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.email.trim()) next.email = "Enter an email.";
    else if (!looksLikeEmail(form.email)) next.email = "That doesn't look like an email address.";
    else if (findAccountByEmail(form.email)) next.email = "An account on this device already uses that email.";
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    prepareDemoWorkspace();
    const handle = suggestHandle("", form.email);
    const account = createAccount({ email: form.email, handle });
    ensureProfile(account.handle);
    startOnboarding(account.handle);
    signIn(account.handle);
    navigate("/join/welcome", { replace: true });
  }

  return (
    <div className="max-w-lg">
      <JoinHead title="Join the network." />
      <form className="mt-10 space-y-6" onSubmit={onSubmit} noValidate>
        <Field label="Email" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password" required error={errors.password} hint="At least 8 characters.">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => set("password", event.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full rounded-full">
          Create account
        </Button>
        <p className="text-label text-muted">
          This account is kept on this browser only. There is no account server, so your password is checked
          for length but never stored or sent anywhere.
        </p>
      </form>
      <p className="mt-10 border-t border-border pt-6 text-body-sm text-muted">
        Already have an account?{" "}
        <Link to="/sign-in" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
