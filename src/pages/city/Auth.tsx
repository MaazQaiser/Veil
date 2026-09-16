import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";
import { IconEye, IconEyeOff } from "@/components/ui/icons";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { AuthRedirect } from "@/components/city/AuthRedirect";
import { AuthSplitScreen, JoinHead } from "@/pages/join/JoinLayout";
import { useCitySession } from "@/lib/citySession";
import { findAccountByEmail } from "@/lib/accounts";
import { prepareDemoWorkspace } from "@/lib/demoJourney";
import { PRODUCT_HOME } from "@/lib/providerJourney";

function AlreadyIn() {
  return <AuthRedirect />;
}
/* ------------------------------------------------------------------ sign up */

export function SignUpPage() {
  return <Navigate to={JOIN_ROUTE} replace />;
}

/* ------------------------------------------------------------------ sign in */

export function SignInPage() {
  const { session, signIn } = useCitySession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    prepareDemoWorkspace();

    const next: Record<string, string> = {};
    if (!form.email.trim()) next.email = "Enter your email.";
    if (!form.password) next.password = "Enter your password.";

    const account = form.email.trim() ? findAccountByEmail(form.email) : undefined;
    if (!next.email && !account) {
      next.email = "No account on this device uses that email.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0 || !account) return;

    signIn(account.handle);
    navigate(PRODUCT_HOME);
  }

  if (session.signedIn) return <AlreadyIn />;

  return (
    <AuthSplitScreen>
      <JoinHead title="Sign in." lede="Pick up where you left off on this device." />
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
        <Field label="Password" htmlFor="password" required error={errors.password}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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

        <Button type="submit" size="lg" className="w-full rounded-full">
          Sign in →
        </Button>
      </form>
      <p className="mt-4 text-center text-body-sm text-muted">
        Don&rsquo;t have an account?{" "}
        <Link to={JOIN_ROUTE} className="text-foreground underline underline-offset-4">
          Join VAEL
        </Link>
      </p>
    </AuthSplitScreen>
  );
}
