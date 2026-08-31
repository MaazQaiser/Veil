import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";
import { ProfilePhotoField } from "@/components/vael/profileForm";
import { completeOnboardingStep } from "@/lib/onboarding";
import { sectionErrors } from "@/lib/profileFields";
import { useNavigate } from "react-router-dom";
import { JoinHead } from "./JoinLayout";
import { useJoinProfile } from "./useJoinProfile";

export function JoinIdentityPage() {
  const { session, form, set, persist, errors, setErrors } = useJoinProfile();
  const navigate = useNavigate();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next = sectionErrors("identity", form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    persist();
    completeOnboardingStep(session.handle, "Identity");
    navigate("/join/expertise");
  }

  return (
    <div>
      <JoinHead title="Let's build your profile" lede="Start with who you are. You can add more as you go." />
      <form className="mt-10 space-y-8" onSubmit={onSubmit} noValidate>
        <ProfilePhotoField
          name={form.displayName || session.handle}
          src={form.avatarUrl}
          onChange={(dataUrl) => set("avatarUrl", dataUrl)}
        />
        <Field label="Display name" htmlFor="name" required error={errors.displayName}>
          <Input id="name" value={form.displayName} onChange={(event) => set("displayName", event.target.value)} />
        </Field>
        <Field label="VAEL handle" htmlFor="handle" hint="Claimed when you joined.">
          <Input id="handle" value={`@${session.handle}`} readOnly className="bg-surface-muted text-muted" />
        </Field>
        <Field label="Location" htmlFor="location" required error={errors.location}>
          <Input id="location" value={form.location} onChange={(event) => set("location", event.target.value)} />
        </Field>
        <Button type="submit" size="lg" className="rounded-full px-7">
          Continue
        </Button>
      </form>
    </div>
  );
}
