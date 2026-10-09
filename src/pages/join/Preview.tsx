import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { IconEdit } from "@/components/ui/icons";
import { useState } from "react";
import { useCitySession } from "@/lib/citySession";
import { clearDemoDraft, loadDemoDraft } from "@/lib/demoJourney";
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
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#DE7C40]/40 text-[#F2BA8B] motion-safe:transition-colors motion-safe:duration-150 hover:bg-[#DE7C40]/15"
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
    <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
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
  const intent = getOnboardingDraft(session.handle)?.intent;
  const hiring = intent === "out";

  if (intent === "in" && profile) {
    return <VaelInReview />;
  }

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

      <div className="mt-6 rounded-lg border border-[#DE7C40]/25 bg-[#141414] p-6 sm:p-7">
        <h2 className="text-h4 font-medium text-white">{hiring ? `Ready to post, ${firstName}!` : `Looking good, ${firstName}!`}</h2>
        <p className="mt-2 max-w-md text-body-sm text-white/70">
          Edit any section below, then continue when you're ready. You can always come back and change more later.
        </p>
        <Button type="button" size="lg" className="mt-5 rounded-lg px-8" onClick={onContinue}>
          Continue to VAEL
        </Button>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-5 sm:p-6">
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
                    className="text-foreground underline underline-offset-4 hover:text-[#F2BA8B]"
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

function workLabel(value: string | undefined) {
  if (value === "onsite") return "On-site";
  if (value === "hybrid") return "Hybrid";
  if (value === "remote") return "Remote";
  return "Not added yet.";
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border-subtle py-3 first:border-t-0 first:pt-0">
      <p className="text-body-sm text-muted">{label}</p>
      <p className="max-w-[60%] text-right text-body-sm text-foreground">{value || "Not added yet."}</p>
    </div>
  );
}

/** Review the saved VAEL IN profile, then publish availability. The full profile stays private until a Handshake. */
function VaelInReview() {
  const { session, setVael } = useCitySession();
  const vael = useVael();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const profile = vael.profile(session.handle);
  const draft = loadDemoDraft(session.handle);
  if (!profile) return null;

  const business = profile.profileType === "business" || profile.profileType === "studio";
  const timeline = draft?.timeline ?? "";
  const availableToday = timeline.includes("today");
  const availableNow = timeline.includes("now");

  function goVisible() {
    const discipline = profile?.disciplines[0] || "";
    const skills = profile?.skills ?? [];
    const location = draft?.location || profile?.location || "";
    const description =
      profile?.bio.trim() ||
      profile?.experience.trim() ||
      profile?.headline.trim() ||
      "Available this cycle.";
    const missing = !discipline
      ? "Choose a discipline so VAEL knows where you fit."
      : skills.length === 0
        ? "Add at least one skill to become visible to relevant matches."
        : !location
          ? "Add the location you work from."
          : "";
    if (missing || !profile) {
      setError(missing);
      return;
    }
    vael.saveListing({
      handle: session.handle,
      side: "in",
      category: draft?.category || profile.offers?.[0] || discipline,
      discipline,
      skills,
      tools: profile.tools,
      certifications: profile.credentials
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      location,
      remoteOnsite: profile.workPreference || draft?.remoteOnsite || "remote",
      timing: draft?.timing || "This cycle",
      experienceYears: profile.experienceYears ?? 0,
      engagement: draft?.engagement || "Project",
      budgetProxy: "To discuss",
      description,
      requirements: draft?.requirements || "",
      contact: "",
      timeline: draft?.timeline || "This cycle",
    });
    setVael("in");
    clearDemoDraft(session.handle);
    finishOnboarding(session.handle);
    navigate(PRODUCT_HOME, { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-h3 font-medium tracking-tight text-foreground">Review your VAEL IN profile</h1>
      <p className="mt-2 text-body-sm text-muted">
        This is saved to your account. Other people will see that you are available. The full profile, including contact, opens after a Handshake.
      </p>

      <div className="mt-6 space-y-4">
        <SectionCard title={business ? "Business" : "Individual"} editTo="/join/setup" editLabel="Edit profile type">
          <ReviewRow label="Profile type" value={business ? "Business" : "Individual"} />
          <ReviewRow label={business ? "Company discipline" : "Discipline"} value={profile.disciplines.join(", ")} />
          <ReviewRow label="Location" value={profile.location} />
          <ReviewRow label="Experience" value={profile.experience} />
          <ReviewRow
            label="Experience level"
            value={profile.experienceYears ? `${profile.experienceYears} years` : ""}
          />
          <ReviewRow label="Employment type" value={draft?.engagement ?? ""} />
          <ReviewRow label={business ? "Team skills" : "Additional skills"} value={profile.skills.join(", ")} />
          <ReviewRow label={business ? "Company description" : "Short description"} value={profile.bio} />
        </SectionCard>

        <SectionCard title="Work and capability" editTo="/join/credentials" editLabel="Edit work and capability">
          <ReviewRow label="Project categories" value={(profile.offers ?? []).join(", ")} />
          <ReviewRow label="Participation" value={profile.specialization ?? ""} />
          <ReviewRow label="Certifications" value={profile.credentials} />
          <ReviewRow label="Tools and tech stack" value={profile.tools.join(", ")} />
          <ReviewRow label={business ? "Workstation" : "Own gear"} value={draft?.requirements ?? ""} />
        </SectionCard>

        <SectionCard title="Working preference" editTo="/join/credentials" editLabel="Edit working preference">
          <ReviewRow label="Remote, on-site, or hybrid" value={workLabel(profile.workPreference || draft?.remoteOnsite)} />
          <ReviewRow label="Service area" value={draft?.location || profile.location} />
          <ReviewRow label="Availability needed" value={draft?.timing ?? ""} />
        </SectionCard>

        <SectionCard title="Current availability" editTo="/join/credentials" editLabel="Edit current availability">
          <ReviewRow label="Available today" value={availableToday ? "Yes" : "No"} />
          <ReviewRow label="Available right now" value={availableNow ? "Yes" : "No"} />
        </SectionCard>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-label text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-8">
        <Button type="button" size="lg" className="w-full rounded-lg" onClick={goVisible}>
          VAEL — GO VISIBLE
        </Button>
      </div>
    </div>
  );
}
