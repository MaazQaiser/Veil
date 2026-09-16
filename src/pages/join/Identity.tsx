import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/controls";
import { IconBriefcase, IconClock, IconDocument, IconGrid, IconMapPin, IconUser } from "@/components/ui/icons";
import { ProfilePhotoField, PortfolioEditor } from "@/components/vael/profileForm";
import { completeOnboardingStep } from "@/lib/onboarding";
import { sectionErrors } from "@/lib/profileFields";
import { useNavigate } from "react-router-dom";
import { JoinFieldCard, JoinFooterBar, JoinHead } from "./JoinLayout";
import { useJoinProfile } from "./useJoinProfile";

export function JoinIdentityPage() {
  const { session, intent, form, set, persist, errors, setErrors } = useJoinProfile();
  const navigate = useNavigate();
  const hiring = intent === "out";

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next = sectionErrors("identity", form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    persist();
    completeOnboardingStep(session.handle, "Identity");
    navigate("/join/credentials");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <JoinHead
        title={hiring ? "Build your hiring profile" : "Build your generic profile"}
        lede={
          hiring
            ? "This is your VAEL identity — the same across every district. Start with who's hiring."
            : "This is your VAEL identity — the same across every district. Start with who you are."
        }
        center
      />
      <form className="mt-10 space-y-5" onSubmit={onSubmit} noValidate>
        <JoinFieldCard
          icon={<IconUser />}
          title="Name & photo"
          badge="Required"
          hint={hiring ? "How you'll appear to people you match with." : "How you'll appear across VAEL."}
        >
          <div className="space-y-6">
            <ProfilePhotoField
              name={form.displayName || session.handle}
              src={form.avatarUrl}
              onChange={(dataUrl) => set("avatarUrl", dataUrl)}
            />
            <Field label="Display name" htmlFor="name" required error={errors.displayName}>
              <Input id="name" value={form.displayName} onChange={(event) => set("displayName", event.target.value)} />
            </Field>
          </div>
        </JoinFieldCard>

        <JoinFieldCard
          icon={<IconMapPin />}
          title="Location"
          badge="Required"
          hint={hiring ? "Where the work is based, or where you need someone." : "Where you're based or primarily work."}
        >
          <Field label="City, region" htmlFor="location" required error={errors.location}>
            <Input id="location" value={form.location} onChange={(event) => set("location", event.target.value)} />
          </Field>
        </JoinFieldCard>

        {hiring ? (
          <JoinFieldCard icon={<IconBriefcase />} title="What are you hiring for?" hint="The role or need, in a few words.">
            <Field label="What are you hiring for?" htmlFor="headline">
              <Input
                id="headline"
                placeholder="Creative Director"
                value={form.headline}
                onChange={(event) => set("headline", event.target.value)}
              />
            </Field>
          </JoinFieldCard>
        ) : (
          <JoinFieldCard icon={<IconBriefcase />} title="Headline" hint="How you describe what you do, in a few words.">
            <Field label="Headline" htmlFor="headline">
              <Input
                id="headline"
                placeholder="Product Designer"
                value={form.headline}
                onChange={(event) => set("headline", event.target.value)}
              />
            </Field>
          </JoinFieldCard>
        )}

        {hiring ? (
          <JoinFieldCard
            icon={<IconDocument />}
            title="Describe what you need"
            hint="What the work involves and what a great fit looks like."
          >
            <Field label="Describe what you need" htmlFor="about">
              <Textarea id="about" value={form.bio} onChange={(event) => set("bio", event.target.value)} />
            </Field>
          </JoinFieldCard>
        ) : (
          <JoinFieldCard icon={<IconDocument />} title="About" hint="Short introduction about yourself.">
            <Field label="About" htmlFor="about">
              <Textarea id="about" value={form.bio} onChange={(event) => set("bio", event.target.value)} />
            </Field>
          </JoinFieldCard>
        )}

        {!hiring ? (
          <>
            <JoinFieldCard icon={<IconDocument />} title="Experience" hint="What you specialise in, in a sentence or two.">
              <Field label="Experience" htmlFor="exp">
                <Textarea id="exp" value={form.experience} onChange={(event) => set("experience", event.target.value)} />
              </Field>
            </JoinFieldCard>

            <JoinFieldCard icon={<IconClock />} title="Years of experience">
              <Field label="Years of experience" htmlFor="yrs">
                <Input
                  id="yrs"
                  type="number"
                  min={0}
                  max={60}
                  inputMode="numeric"
                  value={form.experienceYears ?? ""}
                  onChange={(event) =>
                    set("experienceYears", event.target.value === "" ? undefined : Number(event.target.value))
                  }
                />
              </Field>
            </JoinFieldCard>
          </>
        ) : null}

        <JoinFieldCard
          icon={<IconGrid />}
          title={hiring ? "Links" : "Portfolio / Website"}
          hint={
            hiring
              ? "Company website, job post, or a brief. Optional."
              : "Links to your work or a site. Optional description on each."
          }
        >
          <PortfolioEditor items={form.portfolio} onChange={(next) => set("portfolio", next)} />
        </JoinFieldCard>

        <JoinFooterBar>
          <Button type="submit" size="lg" className="rounded-full px-10">
            Continue
          </Button>
        </JoinFooterBar>
      </form>
    </div>
  );
}
