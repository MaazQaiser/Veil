import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { IconEdit } from "@/components/ui/icons";
import { useCitySession } from "@/lib/citySession";
import { finishOnboarding, getOnboardingDraft } from "@/lib/onboarding";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { useVael } from "@/lib/vaelCore";
import { CardChips } from "./JoinLayout";

function EditLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#CA8A04]/25 text-[#8A6D00] motion-safe:transition-colors motion-safe:duration-150 hover:bg-[#FFC555]/15"
    >
      <IconEdit className="h-3.5 w-3.5" />
    </Link>
  );
}

function SectionCard({
  title,
  editTo,
  editLabel,
  children,
}: {
  title: string;
  editTo: string;
  editLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body font-medium text-foreground">{title}</p>
        <EditLink to={editTo} label={editLabel} />
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function JoinPreviewPage() {
  const { session, setVael } = useCitySession();
  const vael = useVael();
  const navigate = useNavigate();
  const profile = vael.profile(session.handle);
  const hiring = getOnboardingDraft(session.handle)?.intent === "out";

  function onContinue() {
    if (profile) {
      const side = hiring ? "out" : "in";
      const discipline =
        profile.disciplines[0] || profile.headline || (profile.profileType === "business" ? "Business" : "Professional");
      vael.saveListing({
        handle: session.handle,
        side,
        category: discipline,
        discipline,
        skills: profile.skills,
        tools: profile.tools,
        certifications: profile.credentials
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        location: profile.location,
        remoteOnsite: profile.workPreference || "remote",
        timing: "This cycle",
        experienceYears: profile.experienceYears ?? 0,
        engagement: "Project",
        budgetProxy: "To discuss",
        description:
          profile.bio ||
          (side === "out"
            ? `${profile.displayName} is looking to hire this cycle.`
            : `${profile.displayName} is available this cycle.`),
        requirements: "",
        contact: "",
        timeline: "This cycle",
      });
      setVael(side);
    }
    finishOnboarding(session.handle);
    navigate(PRODUCT_HOME, { replace: true });
  }

  if (!profile) return null;

  const firstName = profile.displayName.split(" ")[0] || profile.displayName;
  const portfolio = profile.portfolio.filter((item) => item.url);
  const credentials = profile.credentials
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-h3 font-medium tracking-tight text-foreground">{hiring ? "Preview your listing" : "Preview profile"}</h1>

      <div className="mt-6 rounded-2xl bg-[#0B0C0C] p-6 sm:p-7">
        <h2 className="text-h4 font-medium text-white">{hiring ? `Ready to post, ${firstName}!` : `Looking good, ${firstName}!`}</h2>
        <p className="mt-2 max-w-md text-body-sm text-white/60">
          Edit any section below, then continue when you're ready. You can always come back and change more later.
        </p>
        <Button type="button" size="lg" className="mt-5 rounded-full px-8" onClick={onContinue}>
          Continue to VAEL
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Avatar name={profile.displayName} src={profile.avatarUrl} size="lg" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-h4 font-medium tracking-tight text-foreground">{profile.displayName}</p>
            {profile.location ? <p className="mt-1 text-body-sm text-muted">{profile.location}</p> : null}
          </div>
          <EditLink to="/join/identity" label="Edit name, photo, and location" />
        </div>

        {profile.headline ? (
          <div className="mt-5 flex items-start justify-between gap-4 border-t border-border-subtle pt-5">
            <p className="text-body font-medium text-foreground">{profile.headline}</p>
            <EditLink to="/join/identity" label="Edit headline" />
          </div>
        ) : null}

        {profile.bio ? (
          <div className="mt-5 flex items-start justify-between gap-4 border-t border-border-subtle pt-5">
            <p className="flex-1 text-body-sm leading-relaxed text-muted">{profile.bio}</p>
            <EditLink to="/join/identity" label="Edit bio" />
          </div>
        ) : null}

        {profile.experience || profile.experienceYears ? (
          <div className="mt-5 flex items-start justify-between gap-4 border-t border-border-subtle pt-5">
            <div className="min-w-0">
              {profile.experienceYears ? (
                <p className="text-body font-medium text-foreground">
                  {profile.experienceYears} {profile.experienceYears === 1 ? "year" : "years"}
                </p>
              ) : null}
              {profile.experience ? <p className="mt-0.5 text-body-sm text-muted">{profile.experience}</p> : null}
            </div>
            <EditLink to="/join/identity" label="Edit experience" />
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <SectionCard
          title={hiring ? "Requirements" : "Credentials"}
          editTo="/join/credentials"
          editLabel={hiring ? "Edit requirements" : "Edit credentials"}
        >
          {credentials.length > 0 ? (
            <CardChips items={credentials} />
          ) : (
            <p className="text-body-sm text-quiet">Not added yet.</p>
          )}
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title={hiring ? "Links" : "Portfolio"} editTo="/join/identity" editLabel={hiring ? "Edit links" : "Edit portfolio"}>
          {portfolio.length > 0 ? (
            <ul className="space-y-1.5 text-body-sm">
              {portfolio.map((item) => (
                <li key={item.url}>
                  <a
                    href={item.url}
                    className="text-foreground underline underline-offset-4 hover:text-[#8A6D00]"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.label || item.url}
                  </a>
                  {item.note ? <p className="text-caption text-quiet">{item.note}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-sm text-quiet">Not added yet.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
