import { useEffect, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/controls";
import { createAccount, findAccountByEmail, suggestHandle } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import {
  attachDraftToHandle,
  confirmCxEmail,
  confirmCxPhone,
  CX_BUDGET_BANDS,
  CX_MAX_PHOTOS,
  CX_TIMINGS,
  getActiveDraft,
  intakeReady,
  looksLikeEmail,
  looksLikePhone,
  patchCxProject,
  publishCxProject,
  restoreDraftByEmail,
  saveProjectContact,
  startCxDraft,
  type CxBudgetBand,
  type CxProject,
  type CxTiming,
  type RxProjectCategory,
} from "@/lib/cxProjectStore";
import { NEED_HOME_PATH, PROJECTS_PATH } from "@/lib/cxRoutes";
import { useCxProjects } from "@/lib/useCxProjects";
import { ensureProfile, saveProfile } from "@/lib/vaelStore";
import { finishOnboarding, patchOnboarding, startOnboarding } from "@/lib/onboarding";
import { setContractorExperience } from "@/lib/rxExperience";
import { setActiveDistrict } from "@/lib/myDistricts";
import { ChoiceCard, NeedFooter, NeedHead } from "./NeedLayout";

const STEPS = ["describe", "media", "where", "when", "budget", "account", "verify"] as const;
type Step = (typeof STEPS)[number];

function isStep(value: string | null): value is Step {
  return STEPS.includes(value as Step);
}

export function NeedProjectWizardPage() {
  useCxProjects();
  const { session, signIn } = useCitySession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const step: Step = isStep(params.get("step")) ? (params.get("step") as Step) : "describe";
  const need = params.get("need")?.trim() as RxProjectCategory | undefined;

  const draft = getActiveDraft();

  useEffect(() => {
    if (!draft && need) startCxDraft(need);
  }, [draft, need]);

  if (!draft) {
    return (
      <div className="flex flex-1 flex-col">
        <NeedHead title="Start with what you need" lede="Pick a category first." />
        <NeedFooter backTo={NEED_HOME_PATH}>
          <Button type="button" onClick={() => navigate(NEED_HOME_PATH)}>
            Choose a category
          </Button>
        </NeedFooter>
      </div>
    );
  }

  function go(next: Step) {
    const nextParams = new URLSearchParams(params);
    nextParams.set("step", next);
    if (draft?.category) nextParams.set("need", draft.category);
    setParams(nextParams);
  }

  const signedIn = session.signedIn && Boolean(session.handle);
  const afterBudget = signedIn ? "verify" : "account";

  return (
    <div className="flex flex-1 flex-col">
      {step === "describe" ? <DescribeStep draft={draft} onNext={() => go("media")} /> : null}
      {step === "media" ? (
        <MediaStep
          draft={draft}
          onNext={() => go("where")}
          onBack={() => go("describe")}
          signedIn={signedIn}
          handle={session.handle}
        />
      ) : null}
      {step === "where" ? <WhereStep draft={draft} onNext={() => go("when")} onBack={() => go("media")} /> : null}
      {step === "when" ? <WhenStep draft={draft} onNext={() => go("budget")} onBack={() => go("where")} /> : null}
      {step === "budget" ? (
        <BudgetStep draft={draft} onNext={() => go(afterBudget)} onBack={() => go("when")} />
      ) : null}
      {step === "account" ? (
        <AccountStep
          draft={draft}
          signIn={signIn}
          onNext={() => go("verify")}
          onBack={() => go("budget")}
        />
      ) : null}
      {step === "verify" ? (
        <VerifyStep
          draft={draft}
          handle={session.handle}
          signIn={signIn}
          onBack={() => go(signedIn ? "budget" : "account")}
          onPublished={() => navigate(PROJECTS_PATH)}
        />
      ) : null}
    </div>
  );
}

function DescribeStep({ draft, onNext }: { draft: CxProject; onNext: () => void }) {
  const [value, setValue] = useState(draft.description);
  const category = draft.category || "your project";
  return (
    <>
      <NeedHead
        title={`What do you want done?`}
        lede={`Write it in your own words. Example: Replace cabinets and countertops, keeping the existing layout. Cabinets are 1990s oak.`}
      />
      <p className="mt-2 text-caption uppercase tracking-[0.08em] text-[#DE7C40]">{category}</p>
      <Textarea
        className="mt-6"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Describe the work."
      />
      <NeedFooter backTo={NEED_HOME_PATH}>
        <Button
          type="button"
          size="lg"
          className="rounded-lg px-10"
          disabled={!value.trim()}
          onClick={() => {
            patchCxProject(draft.id, { description: value.trim() });
            onNext();
          }}
        >
          Continue
        </Button>
      </NeedFooter>
    </>
  );
}

function MediaStep({
  draft,
  onNext,
  onBack,
  signedIn,
  handle,
}: {
  draft: CxProject;
  onNext: () => void;
  onBack: () => void;
  signedIn: boolean;
  handle: string;
}) {
  const [email, setEmail] = useState(draft.saveEmail);
  const [phone, setPhone] = useState(draft.savePhone);
  const [error, setError] = useState("");
  const photos = draft.photos;
  const restore = restoreDraftByEmail(email);

  function onFiles(event: ChangeEvent<HTMLInputElement>, kind: "photo" | "video") {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    for (const file of files) {
      if (file.size > 400_000) {
        setError("Keep each file under 400 KB on this device.");
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        if (kind === "video") {
          patchCxProject(draft.id, { video: dataUrl });
          return;
        }
        const current = getActiveDraft();
        const next = [...(current?.photos ?? photos), dataUrl].slice(0, CX_MAX_PHOTOS);
        patchCxProject(draft.id, { photos: next });
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <>
      <NeedHead
        title="Add photos or video"
        lede="Optional. Up to 10 photos and one short video. Then save your project so you can come back."
      />
      <div className="mt-6 space-y-4">
        <Field label="Photos" htmlFor="photos" hint={`${photos.length} of ${CX_MAX_PHOTOS}`}>
          <Input id="photos" type="file" accept="image/*" multiple onChange={(event) => onFiles(event, "photo")} />
        </Field>
        {photos.length > 0 ? (
          <ul className="grid grid-cols-4 gap-2">
            {photos.map((src, index) => (
              <li key={index}>
                <img src={src} alt="" className="h-20 w-full rounded-md object-cover" />
              </li>
            ))}
          </ul>
        ) : null}
        <Field label="Short video" htmlFor="video" hint="Optional. One clip.">
          <Input id="video" type="file" accept="video/*" onChange={(event) => onFiles(event, "video")} />
        </Field>
        {draft.video ? <p className="text-body-sm text-success">Video saved on this device.</p> : null}
        <h2 className="pt-4 text-h4 font-medium text-foreground">Save your project</h2>
        <p className="text-body-sm text-muted">
          This is not creating an account. Email keeps the draft. Phone is confirmed before publishing.
        </p>
        <Field label="Email" htmlFor="save-email" required>
          <Input
            id="save-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
          />
        </Field>
        <Field label="Phone" htmlFor="save-phone" required>
          <Input
            id="save-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Your phone number"
          />
        </Field>
        {error ? <p className="text-label text-destructive">{error}</p> : null}
        {restore && restore.id !== draft.id ? (
          <p className="text-body-sm text-muted">
            A saved draft for this email is on this device.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => {
                restoreDraftByEmail(email);
                onNext();
              }}
            >
              Restore it
            </button>
          </p>
        ) : null}
      </div>
      <NeedFooter backTo={`${NEED_HOME_PATH.replace("/home", "/project")}?step=describe`}>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            size="lg"
            className="rounded-lg px-10"
            onClick={() => {
              if (!looksLikeEmail(email)) {
                setError("Enter an email so we can save the draft.");
                return;
              }
              if (!looksLikePhone(phone)) {
                setError("Enter a phone number.");
                return;
              }
              setError("");
              saveProjectContact(draft.id, email, phone);
              if (signedIn && handle) attachDraftToHandle(draft.id, handle, draft.firstName);
              onNext();
            }}
          >
            Save and continue
          </Button>
        </div>
      </NeedFooter>
    </>
  );
}

function WhereStep({ draft, onNext, onBack }: { draft: CxProject; onNext: () => void; onBack: () => void }) {
  const [city, setCity] = useState(draft.city);
  const [postalCode, setPostalCode] = useState(draft.postalCode);
  return (
    <>
      <NeedHead title="Where?" lede="City and ZIP only. We never ask for the exact address at this stage." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="City / town" htmlFor="city" required>
          <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} />
        </Field>
        <Field label="ZIP / postal code" htmlFor="zip" required>
          <Input id="zip" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} />
        </Field>
      </div>
      <NeedFooter>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!city.trim() || !postalCode.trim()}
            onClick={() => {
              patchCxProject(draft.id, { city: city.trim(), postalCode: postalCode.trim() });
              onNext();
            }}
          >
            Continue
          </Button>
        </div>
      </NeedFooter>
    </>
  );
}

function WhenStep({ draft, onNext, onBack }: { draft: CxProject; onNext: () => void; onBack: () => void }) {
  const [timing, setTiming] = useState<CxTiming | "">(draft.timing);
  return (
    <>
      <NeedHead title="When?" lede="When do you want the work to start?" />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {CX_TIMINGS.map((option) => (
          <li key={option}>
            <ChoiceCard title={option} selected={timing === option} onClick={() => setTiming(option)} />
          </li>
        ))}
      </ul>
      <NeedFooter>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!timing}
            onClick={() => {
              if (!timing) return;
              patchCxProject(draft.id, { timing });
              onNext();
            }}
          >
            Continue
          </Button>
        </div>
      </NeedFooter>
    </>
  );
}

function BudgetStep({ draft, onNext, onBack }: { draft: CxProject; onNext: () => void; onBack: () => void }) {
  const [band, setBand] = useState<CxBudgetBand | "">(draft.budgetBand);
  return (
    <>
      <NeedHead title="Budget?" lede="A range is enough. Not sure yet is a complete answer." />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {CX_BUDGET_BANDS.map((option) => (
          <li key={option}>
            <ChoiceCard title={option} selected={band === option} onClick={() => setBand(option)} />
          </li>
        ))}
      </ul>
      <NeedFooter>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!band}
            onClick={() => {
              if (!band) return;
              patchCxProject(draft.id, { budgetBand: band });
              onNext();
            }}
          >
            Continue
          </Button>
        </div>
      </NeedFooter>
    </>
  );
}

function AccountStep({
  draft,
  signIn,
  onNext,
  onBack,
}: {
  draft: CxProject;
  signIn: (handle: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [firstName, setFirstName] = useState(draft.firstName);
  const [email, setEmail] = useState(draft.saveEmail);
  const [phone, setPhone] = useState(draft.savePhone);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!firstName.trim()) {
      setError("Enter your first name.");
      return;
    }
    if (!looksLikeEmail(email)) {
      setError("Enter an email.");
      return;
    }
    if (!looksLikePhone(phone)) {
      setError("Enter a phone number.");
      return;
    }
    if (password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    saveProjectContact(draft.id, email, phone);
    let account = findAccountByEmail(email);
    if (!account) {
      account = createAccount({
        email,
        handle: suggestHandle(firstName, email),
        displayName: firstName.trim(),
        phone,
      });
    }
    saveProfile({ ...ensureProfile(account.handle), displayName: firstName.trim() });
    startOnboarding(account.handle);
    patchOnboarding(account.handle, {
      intent: "need",
      needPlace: "home",
      districtId: "construction",
      profileType: "individual",
    });
    finishOnboarding(account.handle);
    setContractorExperience(account.handle, "residential");
    setActiveDistrict(account.handle, "construction");
    attachDraftToHandle(draft.id, account.handle, firstName.trim());
    signIn(account.handle);
    onNext();
  }

  return (
    <>
      <NeedHead
        title="Create an account"
        lede="Your project is ready. Create an account to confirm email and phone, then publish."
      />
      <div className="mt-6 space-y-4">
        <Field label="First name" htmlFor="acct-first" required>
          <Input id="acct-first" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        </Field>
        <Field label="Email" htmlFor="acct-email" required>
          <Input id="acct-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Password" htmlFor="acct-password" required hint="Passwords are not stored on this device.">
          <Input
            id="acct-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="Phone" htmlFor="acct-phone" required>
          <Input id="acct-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        {error ? <p className="text-label text-destructive">{error}</p> : null}
      </div>
      <NeedFooter>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button type="button" size="lg" onClick={submit}>
            Create account
          </Button>
        </div>
      </NeedFooter>
    </>
  );
}

function VerifyStep({
  draft,
  handle,
  signIn,
  onBack,
  onPublished,
}: {
  draft: CxProject;
  handle: string;
  signIn: (handle: string) => void;
  onBack: () => void;
  onPublished: (id: string) => void;
}) {
  const [error, setError] = useState("");
  const current = getActiveDraft() ?? draft;
  const ready = current.emailConfirmed && current.phoneConfirmed && intakeReady(current) && Boolean(current.handle || handle);

  function publish() {
    try {
      const attached = current.handle || handle;
      if (attached && current.handle !== attached) attachDraftToHandle(current.id, attached, current.firstName);
      if (attached) signIn(attached);
      const live = publishCxProject(current.id);
      onPublished(live.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish.");
    }
  }

  return (
    <>
      <NeedHead
        title="Confirm email and phone"
        lede="Both must be confirmed before the project goes live. This is a local confirmation on this device."
      />
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border px-5 py-4">
          <div>
            <p className="text-body font-medium">Email</p>
            <p className="text-body-sm text-muted">{current.saveEmail || "Add an email first."}</p>
          </div>
          {current.emailConfirmed ? (
            <span className="text-body-sm text-success">Confirmed</span>
          ) : (
            <Button type="button" variant="outline" onClick={() => confirmCxEmail(current.id)}>
              Confirm email
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border px-5 py-4">
          <div>
            <p className="text-body font-medium">Phone</p>
            <p className="text-body-sm text-muted">{current.savePhone || "Add a phone first."}</p>
          </div>
          {current.phoneConfirmed ? (
            <span className="text-body-sm text-success">Confirmed</span>
          ) : (
            <Button type="button" variant="outline" onClick={() => confirmCxPhone(current.id)}>
              Confirm phone
            </Button>
          )}
        </div>
        {error ? <p className="text-label text-destructive">{error}</p> : null}
      </div>
      <NeedFooter>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button type="button" size="lg" disabled={!ready} onClick={publish}>
            Publish project
          </Button>
        </div>
      </NeedFooter>
      <p className="mt-4 text-body-sm text-muted">
        You can leave and come back. The draft restores from the email you saved.{" "}
        <Link to={NEED_HOME_PATH} className="underline">
          Start another project
        </Link>
      </p>
    </>
  );
}
