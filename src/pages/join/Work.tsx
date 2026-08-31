import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/controls";
import { PortfolioEditor } from "@/components/vael/profileForm";
import { completeOnboardingStep } from "@/lib/onboarding";
import { useNavigate } from "react-router-dom";
import { JoinHead } from "./JoinLayout";
import { useJoinProfile } from "./useJoinProfile";

export function JoinWorkPage() {
  const { session, form, set, persist } = useJoinProfile();
  const navigate = useNavigate();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    persist();
    completeOnboardingStep(session.handle, "Work");
    navigate("/join/credentials");
  }

  return (
    <div>
      <JoinHead
        title="Show your work"
        lede="Recommended, not required. A short bio, experience, and a few links help a counterpart understand you."
      />
      <form className="mt-10 space-y-8" onSubmit={onSubmit} noValidate>
        <Field label="Short bio" htmlFor="about" hint="A few lines. Opens to a counterpart after a Handshake.">
          <Textarea id="about" value={form.bio} onChange={(event) => set("bio", event.target.value)} />
        </Field>
        <Field label="Years of experience" htmlFor="yrs">
          <Input
            id="yrs"
            type="number"
            min={0}
            max={60}
            inputMode="numeric"
            value={form.experienceYears ?? ""}
            onChange={(event) => set("experienceYears", event.target.value === "" ? undefined : Number(event.target.value))}
          />
        </Field>
        <Field label="Experience" htmlFor="exp" hint="What you specialise in, in a sentence or two.">
          <Textarea id="exp" value={form.experience} onChange={(event) => set("experience", event.target.value)} />
        </Field>
        <div>
          <p className="text-label font-medium text-foreground">Portfolio</p>
          <p className="mt-1 text-label text-muted">Links to projects or a site. Optional description on each.</p>
          <div className="mt-4">
            <PortfolioEditor items={form.portfolio} onChange={(next) => set("portfolio", next)} />
          </div>
        </div>
        <Button type="submit" size="lg" className="rounded-full px-7">
          Continue
        </Button>
      </form>
    </div>
  );
}
