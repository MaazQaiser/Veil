import { useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";
import { CityPage, JOIN_ROUTE } from "@/components/city/CityShell";
import { AuthRedirect } from "@/components/city/AuthRedirect";
import { useCitySession } from "@/lib/citySession";
import { findAccountByEmail } from "@/lib/accounts";
import { prepareDemoWorkspace } from "@/lib/demoJourney";
import { onboardingComplete, onboardingRoute } from "@/lib/onboarding";
import { PRODUCT_HOME } from "@/lib/providerJourney";

function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <CityPage width="full">
      <div className="site-container py-16 md:py-24">
        <div className="mx-auto max-w-lg">
          <p className="site-eyebrow">{eyebrow}</p>
          <h1 className="site-h2 mt-5">{title}</h1>
          <p className="site-lede mt-5 text-muted">{description}</p>
          {children}
          <div className="mt-10 border-t border-border pt-6 text-body-sm text-muted">{footer}</div>
        </div>
      </div>
    </CityPage>
  );
}

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
    navigate(onboardingComplete(account.handle) ? PRODUCT_HOME : onboardingRoute(account.handle));
  }

  if (session.signedIn) return <AlreadyIn />;

  return (
    <AuthShell
      eyebrow="The City of VAEL"
      title="Sign in."
      description="Pick up where you left off on this device."
      footer={
        <>
          Don&rsquo;t have an account?{" "}
          <Link to={JOIN_ROUTE} className="text-foreground underline underline-offset-4">
            Join VAEL
          </Link>
        </>
      }
    >
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
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => set("password", event.target.value)}
          />
        </Field>

        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>

        <p className="text-label text-muted">
          There is no account server, so the password is not checked against anything — only that an account
          on this browser uses that email.
        </p>
      </form>
    </AuthShell>
  );
}