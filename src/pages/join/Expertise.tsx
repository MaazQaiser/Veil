import { Button } from "@/components/ui/button";
import { TagField } from "@/components/ui/tags";
import { completeOnboardingStep } from "@/lib/onboarding";
import { sectionErrors } from "@/lib/profileFields";
import { capabilityOptions, M_T_DISCIPLINES } from "@/lib/vaelStore";
import { useNavigate } from "react-router-dom";
import { JoinHead } from "./JoinLayout";
import { useJoinProfile } from "./useJoinProfile";

export function JoinExpertisePage() {
  const { session, form, set, persist, errors, setErrors } = useJoinProfile();
  const navigate = useNavigate();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next = sectionErrors("expertise", form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    persist();
    completeOnboardingStep(session.handle, "Expertise");
    navigate("/join/work");
  }

  return (
    <div>
      <JoinHead title="What do you do?" lede="These details feed matches. Be specific about the work you take on." />
      <form className="mt-10 space-y-8" onSubmit={onSubmit} noValidate>
        <TagField
          id="discipline"
          label="Discipline"
          values={form.disciplines}
          options={[...M_T_DISCIPLINES]}
          placeholder="Search disciplines"
          onChange={(next) => set("disciplines", next)}
        />
        {errors.disciplines ? <p className="text-label text-destructive">{errors.disciplines}</p> : null}
        <TagField
          id="skills"
          label="Skills"
          values={form.skills}
          options={capabilityOptions("skills")}
          placeholder="Search or add a skill"
          onChange={(next) => set("skills", next)}
        />
        {errors.skills ? <p className="text-label text-destructive">{errors.skills}</p> : null}
        <TagField
          id="tools"
          label="Tools / technologies"
          values={form.tools}
          options={capabilityOptions("tools")}
          placeholder="Search or add a tool"
          onChange={(next) => set("tools", next)}
        />
        {errors.tools ? <p className="text-label text-destructive">{errors.tools}</p> : null}
        <Button type="submit" size="lg" className="rounded-full px-7">
          Continue
        </Button>
      </form>
    </div>
  );
}
