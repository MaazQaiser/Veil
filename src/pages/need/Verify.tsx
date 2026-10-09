import { useRef, useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlays";
import { findAccountByHandle } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import { CX_BUDGET_BANDS, looksLikeEmail, looksLikePhone } from "@/lib/cxProjectStore";
import {
  NEED_BUDGET_PATH,
  NEED_HOME_PATH,
  NEED_LOCATION_PATH,
  NEED_TIMING_PATH,
  PROJECTS_PATH,
} from "@/lib/cxRoutes";
import { readNeedWork, saveNeedWork } from "@/lib/needWork";
import { publishResidentialOpportunity } from "./Publish";
import { NEED_START_OPTIONS, type NeedStart } from "./Timing";
import { NeedFooter, NeedHead } from "./NeedLayout";

const KEY = "vael_need_verify_v1";

type NeedVerification = {
  email: string;
  phone: string;
  emailCode: string;
  phoneCode: string;
  emailSent: boolean;
  phoneSent: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
};

const EMPTY: NeedVerification = {
  email: "",
  phone: "",
  emailCode: "",
  phoneCode: "",
  emailSent: false,
  phoneSent: false,
  emailVerified: false,
  phoneVerified: false,
};

function readVerification(): NeedVerification {
  if (typeof sessionStorage === "undefined") return EMPTY;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<NeedVerification>;
    return {
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      emailCode: typeof parsed.emailCode === "string" ? parsed.emailCode : "",
      phoneCode: typeof parsed.phoneCode === "string" ? parsed.phoneCode : "",
      emailSent: Boolean(parsed.emailSent),
      phoneSent: Boolean(parsed.phoneSent),
      emailVerified: Boolean(parsed.emailVerified),
      phoneVerified: Boolean(parsed.phoneVerified),
    };
  } catch {
    return EMPTY;
  }
}

function writeVerification(next: NeedVerification) {
  if (typeof sessionStorage !== "undefined") sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

function issueCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function NeedVerifyPage() {
  const { session } = useCitySession();
  const navigate = useNavigate();
  const publishedId = useRef("");
  const [liveOpen, setLiveOpen] = useState(false);
  const [publishError, setPublishError] = useState("");
  const work = readNeedWork();
  const account = session.handle ? findAccountByHandle(session.handle) : undefined;
  const [record, setRecord] = useState<NeedVerification>(() => {
    const saved = readVerification();
    const email = saved.email || work.saveEmail || account?.email || "";
    const phone = saved.phone || work.savePhone || account?.phone || "";
    const next = { ...saved, email, phone };
    writeVerification(next);
    saveNeedWork({ saveEmail: email, savePhone: phone });
    return next;
  });
  const [emailEntry, setEmailEntry] = useState("");
  const [phoneEntry, setPhoneEntry] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  if (work.categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;
  if (!work.city.trim()) return <Navigate to={NEED_LOCATION_PATH} replace />;
  if (!NEED_START_OPTIONS.includes(work.timing as NeedStart)) return <Navigate to={NEED_TIMING_PATH} replace />;
  if (!(CX_BUDGET_BANDS as readonly string[]).includes(work.budget)) return <Navigate to={NEED_BUDGET_PATH} replace />;

  function update(patch: Partial<NeedVerification>) {
    setRecord((current) => {
      const next = { ...current, ...patch };
      writeVerification(next);
      if (patch.email !== undefined || patch.phone !== undefined) {
        saveNeedWork({ saveEmail: next.email, savePhone: next.phone });
      }
      return next;
    });
  }

  function sendEmail() {
    if (!looksLikeEmail(record.email)) {
      setEmailError("Enter an email to verify.");
      return;
    }
    setEmailError("");
    update({ emailCode: issueCode(), emailSent: true, emailVerified: false });
    setEmailEntry("");
  }

  function sendPhone() {
    if (!looksLikePhone(record.phone)) {
      setPhoneError("Enter a phone number to verify.");
      return;
    }
    setPhoneError("");
    update({ phoneCode: issueCode(), phoneSent: true, phoneVerified: false });
    setPhoneEntry("");
  }

  function finish(next: NeedVerification) {
    if (!next.emailVerified || !next.phoneVerified) return;
    if (!publishedId.current) {
      try {
        publishedId.current = publishResidentialOpportunity(session.handle);
        setPublishError("");
      } catch (err) {
        setPublishError(err instanceof Error ? err.message : "Could not publish this opportunity.");
        return;
      }
    }
    setLiveOpen(true);
  }

  function confirmEmail() {
    if (emailEntry.trim() !== record.emailCode) {
      setEmailError("That code does not match.");
      return;
    }
    setEmailError("");
    const next = { ...record, emailVerified: true };
    update(next);
    finish(next);
  }

  function confirmPhone() {
    if (phoneEntry.trim() !== record.phoneCode) {
      setPhoneError("That code does not match.");
      return;
    }
    setPhoneError("");
    const next = { ...record, phoneVerified: true };
    update(next);
    finish(next);
  }

  const ready = record.emailVerified && record.phoneVerified;

  /** Closing the confirmation — by the button, the X, Escape, or the backdrop — moves to My Opportunities. */
  function goToMyOpportunities() {
    setLiveOpen(false);
    navigate(PROJECTS_PATH);
  }

  return (
    <div className="flex flex-1 flex-col">
      <NeedHead
        title="Verify your details"
        lede="Email and phone both need to be verified before this project can be published."
      />
      <div className="mt-8 space-y-4">
        <Channel
          label="Email"
          value={record.email}
          verified={record.emailVerified}
          sent={record.emailSent}
          code={record.emailCode}
          entry={emailEntry}
          error={emailError}
          sendLabel="Send verification"
          confirmLabel="Confirm email"
          onEntry={setEmailEntry}
          onSend={sendEmail}
          onConfirm={confirmEmail}
          missing={
            looksLikeEmail(record.email) ? null : (
              <Field label="Email" htmlFor="verify-email">
                <Input
                  id="verify-email"
                  type="email"
                  value={record.email}
                  autoComplete="email"
                  onChange={(event) => update({ email: event.target.value, emailSent: false, emailVerified: false })}
                />
              </Field>
            )
          }
        />
        <Channel
          label="Phone"
          value={record.phone}
          verified={record.phoneVerified}
          sent={record.phoneSent}
          code={record.phoneCode}
          entry={phoneEntry}
          error={phoneError}
          sendLabel="Send verification code"
          confirmLabel="Confirm phone"
          onEntry={setPhoneEntry}
          onSend={sendPhone}
          onConfirm={confirmPhone}
          missing={
            looksLikePhone(record.phone) ? null : (
              <Field label="Phone number" htmlFor="verify-phone">
                <Input
                  id="verify-phone"
                  type="tel"
                  value={record.phone}
                  autoComplete="tel"
                  onChange={(event) => update({ phone: event.target.value, phoneSent: false, phoneVerified: false })}
                />
              </Field>
            )
          }
        />
      </div>
      {publishError ? <p className="mt-4 text-body-sm text-destructive">{publishError}</p> : null}
      <NeedFooter>
        <Button type="button" size="lg" className="rounded-lg px-10" disabled={!ready} onClick={() => finish(record)}>
          Continue
        </Button>
      </NeedFooter>
      <Dialog
        open={liveOpen}
        onClose={goToMyOpportunities}
        title="Your opportunity is live"
        footer={
          <Button type="button" onClick={goToMyOpportunities}>
            Go to My Opportunities
          </Button>
        }
      >
        <p>Your opportunity is live.</p>
        <p className="mt-2 text-body-sm text-muted">Continue there to see and manage your opportunity.</p>
      </Dialog>
    </div>
  );
}

function Channel({
  label,
  value,
  verified,
  sent,
  code,
  entry,
  error,
  sendLabel,
  confirmLabel,
  onEntry,
  onSend,
  onConfirm,
  missing,
}: {
  label: string;
  value: string;
  verified: boolean;
  sent: boolean;
  code: string;
  entry: string;
  error: string;
  sendLabel: string;
  confirmLabel: string;
  onEntry: (value: string) => void;
  onSend: () => void;
  onConfirm: () => void;
  missing: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-label font-medium text-muted">{label}</p>
          {value ? <p className="mt-1 text-body text-foreground">{value}</p> : null}
        </div>
        <p className={verified ? "text-body-sm text-success" : "text-body-sm text-muted"}>
          {verified ? "Verified" : "Unverified"}
        </p>
      </div>
      {missing ? <div className="mt-4">{missing}</div> : null}
      {verified ? null : (
        <div className="mt-4 space-y-4">
          <Button type="button" variant="outline" onClick={onSend}>
            {sendLabel}
          </Button>
          {sent ? (
            <>
              <p className="text-body-sm text-muted">Use this code on this device: {code}</p>
              <Field label="Verification code" htmlFor={`verify-${label}`}>
                <Input
                  id={`verify-${label}`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={entry}
                  onChange={(event) => onEntry(event.target.value)}
                />
              </Field>
              <Button type="button" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </>
          ) : null}
          {error ? <p className="text-body-sm text-destructive">{error}</p> : null}
        </div>
      )}
    </section>
  );
}
