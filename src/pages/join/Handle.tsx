import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";
import { handleIssue, isHandleAvailable } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import { claimOnboardingHandle } from "@/lib/onboarding";
import { JoinHead } from "./JoinLayout";

export function JoinHandlePage() {
  const { session, signIn } = useCitySession();
  const navigate = useNavigate();
  const [value, setValue] = useState(session.handle);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const handle = value.trim().toLowerCase().replace(/^@/, "");
    const issue = handleIssue(handle);
    if (issue) {
      setAvailable(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setAvailable(isHandleAvailable(handle, session.handle));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [value, session.handle]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = claimOnboardingHandle(session.handle, value);
    if (!result.ok) {
      setError(result.error);
      setAvailable(false);
      return;
    }
    if (result.handle !== session.handle) signIn(result.handle);
    navigate("/join/type");
  }

  const clean = value.trim().toLowerCase().replace(/^@/, "");
  const wellFormed = !handleIssue(clean);

  return (
    <div className="max-w-lg">
      <JoinHead title="Choose your VAEL handle" />
      <form className="mt-10 space-y-6" onSubmit={onSubmit}>
        <Field
          label="Handle"
          htmlFor="handle"
          required
          error={error}
          hint="Your unique name on VAEL."
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">@</span>
            <Input
              id="handle"
              className="pl-8"
              autoComplete="username"
              value={value}
              onChange={(event) => {
                setValue(event.target.value.replace(/^@/, ""));
                setError("");
              }}
            />
          </div>
        </Field>
        {wellFormed && available === true ? (
          <p className="text-body-sm text-success">✓ @{clean} is available</p>
        ) : null}
        {wellFormed && available === false ? (
          <p className="text-body-sm text-destructive">@{clean} is taken</p>
        ) : null}
        <Button type="submit" size="lg" className="rounded-full px-7">
          Claim handle
        </Button>
      </form>
    </div>
  );
}
