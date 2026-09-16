import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";
import { Checkbox } from "@/components/ui/choice";
import { IconEye, IconEyeOff } from "@/components/ui/icons";
import { createAccount, findAccountByEmail, suggestHandle } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import { prepareDemoWorkspace } from "@/lib/demoJourney";
import { onboardingRoute, patchOnboarding, startOnboarding } from "@/lib/onboarding";
import { ensureProfile, saveProfile } from "@/lib/vaelStore";
import { JoinHead } from "./JoinLayout";

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function looksLikePhone(value: string) {
  return /^[0-9+()\-.\s]{7,}$/.test(value.trim());
}

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  agree: false,
};

export function JoinSignUpPage() {
  const { signIn } = useCitySession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetIntent = params.get("intent") === "out" ? "out" : params.get("intent") === "in" ? "in" : "";
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Enter your first name.";
    if (!form.lastName.trim()) next.lastName = "Enter your last name.";
    if (!form.email.trim()) next.email = "Enter an email.";
    else if (!looksLikeEmail(form.email)) next.email = "That doesn't look like an email address.";
    if (!form.phone.trim()) next.phone = "Enter a phone number.";
    else if (!looksLikePhone(form.phone)) next.phone = "That doesn't look like a phone number.";
    if (form.password.length < 6) next.password = "Use at least 6 characters.";
    if (!form.agree) next.agree = "You need to agree to continue.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    prepareDemoWorkspace();
    const displayName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    let account = findAccountByEmail(form.email);
    if (!account) {
      const handle = suggestHandle(displayName, form.email);
      account = createAccount({ email: form.email, handle, displayName, phone: form.phone });
    }
    // Start from a blank profile — onboarding (Identity, Credentials, etc.) is what
    // actually fills this in. Only the name from this step carries over.
    saveProfile({ ...ensureProfile(account.handle), displayName });
    // "Create account" always replays the full wizard from the top, even for an account
    // that already exists (or already finished onboarding) on this device — this is a
    // demo flow that needs to show every step every time, never skip straight to the
    // product because a prior run marked it done.
    startOnboarding(account.handle);
    if (presetIntent) patchOnboarding(account.handle, { intent: presetIntent });
    signIn(account.handle);
    navigate(onboardingRoute(account.handle), { replace: true });
  }

  return (
    <div>
      <JoinHead
        title="Create an account."
        lede="Takes about a minute. We'll build the rest of your profile from there."
      />
      <form className="mt-10 space-y-6" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" required error={errors.firstName}>
            <Input
              id="firstName"
              autoComplete="given-name"
              placeholder="Enter your first name"
              value={form.firstName}
              onChange={(event) => set("firstName", event.target.value)}
            />
          </Field>
          <Field label="Last name" htmlFor="lastName" required error={errors.lastName}>
            <Input
              id="lastName"
              autoComplete="family-name"
              placeholder="Enter your last name"
              value={form.lastName}
              onChange={(event) => set("lastName", event.target.value)}
            />
          </Field>
        </div>
        <Field label="Email" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email address"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
          />
        </Field>
        <Field label="Phone number" htmlFor="phone" required error={errors.phone}>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Enter your phone number"
            value={form.phone}
            onChange={(event) => set("phone", event.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password" required error={errors.password}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Use at least 6 characters"
              className="pr-11"
              value={form.password}
              onChange={(event) => set("password", event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-quiet hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <IconEyeOff className="h-[1.1em] w-[1.1em]" /> : <IconEye className="h-[1.1em] w-[1.1em]" />}
            </button>
          </div>
        </Field>

        <div>
          <Checkbox
            id="agree"
            checked={form.agree}
            onChange={(event) => set("agree", event.target.checked)}
            label={
              <>
                I agree to the{" "}
                <Link to="/legal/terms" className="text-foreground underline underline-offset-4">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/legal/privacy" className="text-foreground underline underline-offset-4">
                  Privacy Policy
                </Link>
                .
              </>
            }
          />
          {errors.agree ? <p className="mt-2 text-label text-destructive">{errors.agree}</p> : null}
        </div>

        <Button type="submit" size="lg" className="w-full rounded-full">
          Create my account →
        </Button>
      </form>
      <p className="mt-4 text-center text-body-sm text-muted">
        Already have an account?{" "}
        <Link to="/sign-in" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
