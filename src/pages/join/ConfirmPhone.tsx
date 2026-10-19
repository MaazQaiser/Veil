import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { IconLock } from "@/components/ui/icons";
import { findAccountByHandle, updateAccountPhone } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import { loadDemoDraft } from "@/lib/demoJourney";
import { getOnboardingDraft, ONBOARDING_PATH } from "@/lib/onboarding";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { useVael } from "@/lib/vaelCore";
import { JoinHead } from "./JoinLayout";
import { publishVaelIn, vaelInMissing } from "./Preview";

const OTP_LENGTH = 6;

/** Six single-digit boxes. Typing moves forward, Backspace moves back, and a pasted code fills them all. */
function OtpInput({ value, onChange, error }: { value: string; onChange: (next: string) => void; error?: string }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  function focusAt(index: number) {
    refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();
  }

  function setDigits(start: number, text: string) {
    const clean = text.replace(/\D/g, "");
    if (!clean) return;
    const next = value.split("");
    for (let offset = 0; offset < clean.length && start + offset < OTP_LENGTH; offset += 1) {
      next[start + offset] = clean[offset];
    }
    onChange(next.join("").slice(0, OTP_LENGTH));
    focusAt(start + clean.length);
  }

  return (
    <div>
      <p id="otp-label" className="text-body-sm font-medium text-foreground">
        6-digit code
      </p>
      <div role="group" aria-labelledby="otp-label" className="mt-3 flex justify-between gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            value={digit}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${index + 1}`}
            autoFocus={index === 0}
            onFocus={(event) => event.target.select()}
            onChange={(event) => setDigits(index, event.target.value.slice(-1))}
            onPaste={(event) => {
              event.preventDefault();
              setDigits(index, event.clipboardData.getData("text"));
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace") {
                event.preventDefault();
                const next = value.split("");
                if (next[index]) {
                  next[index] = "";
                  onChange(next.join(""));
                } else if (index > 0) {
                  next[index - 1] = "";
                  onChange(next.join(""));
                  focusAt(index - 1);
                }
              } else if (event.key === "ArrowLeft") focusAt(index - 1);
              else if (event.key === "ArrowRight") focusAt(index + 1);
            }}
            className={cn(
              "h-14 w-full min-w-0 border bg-surface text-center font-sans text-[1.5rem] font-medium text-foreground",
              error ? "border-destructive" : digit ? "border-[#DE7C40]" : "border-border",
            )}
          />
        ))}
      </div>
      {error ? <p className="mt-2 text-label text-destructive">{error}</p> : null}
    </div>
  );
}

function looksLikePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Last step before a VAEL IN goes live: confirm the mobile number, then enter a 6-digit code.
 * There is no SMS service in this build, so any 6-digit code is accepted. A real provider
 * replaces the check in `onCode` without changing the page.
 */
export function JoinConfirmPhonePage() {
  const { session, setVael } = useCitySession();
  const vael = useVael();
  const navigate = useNavigate();
  const account = findAccountByHandle(session.handle);
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const profile = vael.profile(session.handle);
  if (getOnboardingDraft(session.handle)?.intent !== "in" || !profile || vaelInMissing(profile, loadDemoDraft(session.handle))) {
    return <Navigate to={ONBOARDING_PATH.Preview} replace />;
  }

  function onPhone(event: React.FormEvent) {
    event.preventDefault();
    if (!looksLikePhone(phone)) {
      setError("That doesn't look like a mobile number.");
      return;
    }
    setError("");
    setSent(true);
  }

  function onCode(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code.");
      return;
    }
    updateAccountPhone(session.handle, phone.trim());
    if (!publishVaelIn(session.handle, vael, setVael)) {
      navigate(ONBOARDING_PATH.Preview, { replace: true });
      return;
    }
    navigate(PRODUCT_HOME, { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <JoinHead
        title="Confirm your phone"
        lede={
          sent
            ? `Enter the 6-digit code we texted to ${phone.trim()}. Your VAEL goes live as soon as you enter it.`
            : "Last step. We'll text you a 6-digit code, and your VAEL goes live as soon as you enter it."
        }
        center
      />

      <div className="mt-8 flex items-start gap-3 rounded-lg border border-[#DE7C40]/25 bg-surface p-5">
        <IconLock className="mt-0.5 h-5 w-5 shrink-0 text-[#DE7C40]" />
        <p className="text-body-sm text-muted">
          <span className="font-medium text-foreground">Every VAEL comes from a confirmed number.</span> It is what a
          match receives after the handshake, so it has to be real. You only do this once.
        </p>
      </div>

      {sent ? (
        <form className="mt-6 space-y-4" onSubmit={onCode} noValidate>
          <OtpInput
            value={code}
            error={error}
            onChange={(next) => {
              setCode(next);
              setError("");
            }}
          />
          <Button type="submit" size="lg" className="w-full rounded-full">
            Confirm and go visible
          </Button>
          <button
            type="button"
            className="text-body-sm text-muted underline underline-offset-4 hover:text-foreground"
            onClick={() => {
              setSent(false);
              setCode("");
              setError("");
            }}
          >
            Use a different number
          </button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onPhone} noValidate>
          <Field
            label="Mobile phone"
            htmlFor="confirm-phone"
            hint="A US mobile number, or + and your country code."
            error={error}
          >
            <Input
              id="confirm-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setError("");
              }}
            />
          </Field>
          <Button type="submit" size="lg" className="w-full rounded-full">
            Continue
          </Button>
        </form>
      )}

      <Link
        to={ONBOARDING_PATH.Preview}
        className="mt-6 inline-flex items-center gap-2 text-body-sm font-medium text-muted hover:text-foreground"
      >
        <span aria-hidden>←</span> Back to the review
      </Link>
    </div>
  );
}
