import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SkillChips } from "@/components/mt/BoardMatchCard";
import { useCitySession } from "@/lib/citySession";
import { completeOnboardingStep } from "@/lib/onboarding";
import { useVael } from "@/lib/vaelCore";
import { JoinHead } from "./JoinLayout";

export function JoinPreviewPage() {
  const { session } = useCitySession();
  const vael = useVael();
  const navigate = useNavigate();
  const profile = vael.profile(session.handle);

  function onContinue() {
    completeOnboardingStep(session.handle, "Preview");
    navigate("/join/veil");
  }

  if (!profile) return null;

  const discipline = profile.disciplines[0] || profile.headline;
  const tools = profile.tools;
  const portfolio = profile.portfolio.filter((item) => item.url);

  return (
    <div>
      <JoinHead title="Your VAEL profile is ready" />
      <article className="site-card mt-10 max-w-lg border border-border bg-surface px-6 py-8">
        <p className="site-meta">@{session.handle}</p>
        <div className="mt-5 flex items-center gap-4">
          <Avatar name={profile.displayName} src={profile.avatarUrl} size="lg" />
          <div>
            <h2 className="text-h3 font-medium tracking-tight">{profile.displayName}</h2>
            <p className="mt-1 text-body-sm text-muted">
              {discipline}
              {profile.location ? ` · ${profile.location}` : ""}
            </p>
          </div>
        </div>
        {profile.bio ? <p className="mt-6 text-body text-muted">{profile.bio}</p> : null}
        {profile.experience || profile.experienceYears ? (
          <p className="mt-4 text-body-sm text-muted">
            {[profile.experienceYears ? `${profile.experienceYears} years` : "", profile.experience]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {profile.skills.length > 0 ? (
          <div className="mt-6">
            <p className="text-caption text-quiet">Skills</p>
            <div className="mt-2">
              <SkillChips skills={profile.skills} />
            </div>
          </div>
        ) : null}
        {tools.length > 0 ? (
          <div className="mt-6">
            <p className="text-caption text-quiet">Tools</p>
            <div className="mt-2">
              <SkillChips skills={tools} />
            </div>
          </div>
        ) : null}
        {portfolio.length > 0 ? (
          <div className="mt-6">
            <p className="text-caption text-quiet">Portfolio</p>
            <ul className="mt-2 space-y-1 text-body-sm">
              {portfolio.map((item) => (
                <li key={item.url}>
                  <a href={item.url} className="underline underline-offset-4" target="_blank" rel="noreferrer">
                    {item.label || item.url}
                  </a>
                  {item.note ? <p className="text-caption text-muted">{item.note}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>
      <div className="mt-8 max-w-lg">
        <p className="site-eyebrow">Profile visibility</p>
        <p className="mt-3 text-body-sm text-muted">
          Your full profile is revealed through a Handshake after both sides accept.
        </p>
      </div>
      <Button type="button" size="lg" className="mt-10 rounded-full px-7" onClick={onContinue}>
        Continue to VAEL
      </Button>
    </div>
  );
}
