import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";
import { IconEye, IconEyeOff } from "@/components/ui/icons";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { AuthRedirect } from "@/components/city/AuthRedirect";
import { AuthSplitScreen, JoinHead } from "@/pages/join/JoinLayout";
import { useCitySession } from "@/lib/citySession";
import { findAccountByIdentity } from "@/lib/accounts";
import { prepareDemoWorkspace } from "@/lib/demoJourney";
import { parseGoVisibleEntry, routeForGoVisibleEntry } from "@/lib/goVisible";
import { NEED_CONTINUE_PATH } from "@/lib/cxRoutes";
import { signedInLanding } from "@/lib/onboarding";
import {
  VAEL_OUT_DISPLAY_NAME,
  VAEL_OUT_HANDLE,
  VAEL_OUT_PASSWORD,
  ensureVaelOutAccount,
} from "@/lib/vaelPair";
import { vaelSideLabel } from "@/lib/vaelCopy";

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
  const [params] = useSearchParams();
  const intent = params.get("intent") === "out" ? "out" : params.get("intent") === "in" ? "in" : "";
  const entry = parseGoVisibleEntry(params.get("entry"));
  const fromProject = params.get("from") === "project";
  const [form, setForm] = useState({ identity: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Only the marketing-linked demo entry points (?intent=in / ?intent=out)
    // should conjure their sample persona. A plain "/sign-in" visit — what a
    // genuine first-time visitor hits — must not silently register a
    // signable account behind their back.
    if (intent) prepareDemoWorkspace();
    if (intent === "out") ensureVaelOutAccount();
  }, [intent]);

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (intent) prepareDemoWorkspace();
    if (intent === "out") ensureVaelOutAccount();

    const next: Record<string, string> = {};
    if (!form.identity.trim()) next.identity = "Enter your email or name.";
    if (!form.password) next.password = "Enter your password.";

    const account = form.identity.trim() ? findAccountByIdentity(form.identity) : undefined;
    if (!next.identity && !account) {
      next.identity = "No account on this device matches that sign-in.";
    }

    if (account && intent === "out" && account.handle !== VAEL_OUT_HANDLE) {
      next.identity = "Use the Vael Out email for this sign-in.";
    }
    if (account && intent === "in" && account.handle === VAEL_OUT_HANDLE) {
      next.identity = "Use your Vael In account for this sign-in.";
    }
    if (account?.handle === VAEL_OUT_HANDLE && form.password && form.password !== VAEL_OUT_PASSWORD) {
      next.password = "That password doesn't match.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0 || !account) return;

    signIn(account.handle);
    navigate(fromProject ? NEED_CONTINUE_PATH : entry ? routeForGoVisibleEntry(account.handle, entry) : signedInLanding(account.handle));
  }

  if (session.signedIn && fromProject) return <Navigate to={NEED_CONTINUE_PATH} replace />;
  if (session.signedIn && !intent) return <AlreadyIn />;

  return (
    <AuthSplitScreen>
      <JoinHead
        title={intent ? `Sign in to ${vaelSideLabel(intent)}.` : "Sign in."}
        lede={
          intent === "out"
            ? `Continue as the hiring side on this device. Sign in as ${VAEL_OUT_DISPLAY_NAME}.`
            : intent === "in"
              ? "Continue as the available side on this device."
              : "Pick up where you left off on this device."
        }
      />
      <form className="mt-10 space-y-6" onSubmit={onSubmit} noValidate>
        <Field label="Email or name" htmlFor="identity" required error={errors.identity}>
          <Input
            id="identity"
            type="text"
            autoComplete="username"
            value={form.identity}
            onChange={(event) => set("identity", event.target.value)}
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

        <Button type="submit" size="lg" className="w-full rounded-none">
          Sign in →
        </Button>
      </form>
      <p className="mt-4 text-center text-body-sm text-muted">
        Don&rsquo;t have an account?{" "}
        <Link
          to={
            entry
              ? `${JOIN_ROUTE}?entry=${entry}`
              : intent
                ? `${JOIN_ROUTE}?intent=${intent}`
                : JOIN_ROUTE
          }
          className="text-foreground underline underline-offset-4"
        >
          Create one
        </Link>
      </p>
    </AuthSplitScreen>
  );
}
