import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { IconClock, IconEdit, IconLock, IconMapPin } from "@/components/ui/icons";
import { useState } from "react";
import { useCitySession } from "@/lib/citySession";
import { findAccountByHandle } from "@/lib/accounts";
import { clearDemoDraft, loadDemoDraft, type DemoDraft } from "@/lib/demoJourney";
import { JOIN_CONFIRM_PHONE_PATH, finishOnboarding, getOnboardingDraft } from "@/lib/onboarding";
import type { ProfileRecord } from "@/lib/vaelStore";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import { useVael } from "@/lib/vaelCore";
import { CardChips, JoinFooterBar, JoinHead } from "./JoinLayout";

function EditLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#EE8A4A]/40 text-[#F2BA8B] motion-safe:transition-colors motion-safe:duration-150 hover:bg-[#EE8A4A]/15"
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
      <div className="mt-4 border-t border-border-subtle pt-4">{children}</div>
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

      <div className="mt-6 rounded-lg border border-[#EE8A4A]/25 bg-[#141414] p-6 sm:p-7">
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

function ReviewRow({ label, value, to }: { label: string; value: string; to?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border-subtle py-3 first:border-t-0 first:pt-0 last:pb-0">
      <p className="text-body-sm text-muted">{label}</p>
      {value ? (
        <p className="max-w-[60%] text-right text-body-sm text-foreground">{value}</p>
      ) : to ? (
        <Link to={to} className="text-body-sm text-[#F2BA8B] underline underline-offset-4 hover:text-foreground">
          Add
        </Link>
      ) : (
        <p className="text-body-sm text-quiet">Not added yet.</p>
      )}
    </div>
  );
}

/** Why this profile cannot go visible yet, or "" when it can. */
export function vaelInMissing(profile: ProfileRecord | undefined, draft: DemoDraft | null | undefined): string {
  if (!profile) return "Your profile is not ready yet.";
  if (!profile.disciplines[0]) return "Choose a discipline so VAEL knows where you fit.";
  if (profile.skills.length === 0) return "Add at least one skill to become visible to relevant matches.";
  if (!(draft?.location || profile.location)) return "Add the location you work from.";
  return "";
}

/** Posts the VAEL IN listing and finishes onboarding. Called once the phone is confirmed. */
export function publishVaelIn(
  handle: string,
  vael: ReturnType<typeof useVael>,
  setVael: (side: "in" | "out") => void,
): boolean {
  const profile = vael.profile(handle);
  const draft = loadDemoDraft(handle);
  if (!profile || vaelInMissing(profile, draft)) return false;
  const discipline = profile.disciplines[0] || "";
  vael.saveListing({
    handle,
    side: "in",
    category: draft?.category || profile.offers?.[0] || discipline,
    discipline,
    skills: profile.skills,
    tools: profile.tools,
    certifications: profile.credentials
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    location: draft?.location || profile.location || "",
    remoteOnsite: profile.workPreference || draft?.remoteOnsite || "remote",
    timing: draft?.timing || "This cycle",
    experienceYears: profile.experienceYears ?? 0,
    engagement: draft?.engagement || "Project",
    budgetProxy: "To discuss",
    description: profile.bio.trim() || profile.experience.trim() || profile.headline.trim() || "Available this cycle.",
    requirements: draft?.requirements || "",
    contact: "",
    timeline: draft?.timeline || "This cycle",
  });
  setVael("in");
  clearDemoDraft(handle);
  finishOnboarding(handle);
  return true;
}

/** Review the saved VAEL IN profile, then publish availability. The full profile stays private until a Handshake. */
function VaelInReview() {
  const { session } = useCitySession();
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

  function onReview() {
    const missing = vaelInMissing(profile, draft);
    if (missing || !profile) {
      setError(missing);
      return;
    }
    navigate(JOIN_CONFIRM_PHONE_PATH);
  }

  const firstName = profile.displayName.split(" ")[0] || profile.displayName;
  const certifications = profile.credentials
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const offers = profile.offers ?? [];
  const account = findAccountByHandle(session.handle);
  const boardLocation = draft?.location || profile.location;
  const boardDiscipline = profile.disciplines[0] || "";
  const missingToGoVisible = [
    !profile.disciplines[0] ? "a discipline" : "",
    profile.skills.length === 0 ? "your skills" : "",
    !(draft?.location || profile.location) ? "a location" : "",
  ].filter(Boolean);

  return (
    <>
      <JoinHead
        title={`Ready to go visible, ${firstName}!`}
        lede="Other people will see that you are available. The full profile, including contact, opens after a Handshake."
        center
      />
      {missingToGoVisible.length > 0 ? (
        <p className="mt-6 rounded-lg border border-[#EE8A4A]/30 bg-[#EE8A4A]/10 px-4 py-2.5 text-center text-body-sm text-[#F2BA8B]">
          Add {missingToGoVisible.join(", ")} to go visible.
        </p>
      ) : null}

      <div className="mt-6 rounded-lg border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-body font-medium text-foreground">How it shows on the board</p>
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-caption text-muted">Draft, not posted yet</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border-subtle pt-4">
          <Avatar name={profile.displayName} src={profile.avatarUrl} size="lg" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-medium text-foreground">{profile.displayName}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-muted">
              {boardDiscipline ? <span>{boardDiscipline}</span> : null}
              {boardLocation ? (
                <span className="inline-flex items-center gap-1.5">
                  <IconMapPin className="h-3.5 w-3.5 shrink-0" />
                  {boardLocation}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-[#EE8A4A]/15 px-3 py-1 text-caption font-medium text-[#EE8A4A]">Vael In</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-caption text-muted">
              <IconClock className="h-3.5 w-3.5" />
              24h left
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <SectionCard title={business ? "About my business" : "About me"} editTo="/join/setup" editLabel="Edit about me">
          <ReviewRow label="Profile type" value={business ? "Business" : "Individual"} />
          <ReviewRow label={business ? "Company discipline" : "Discipline"} value={profile.disciplines.join(", ")} to="/join/identity" />
          <ReviewRow label="Location" value={profile.location} to="/join/identity" />
          <ReviewRow
            label="Experience level"
            value={profile.experienceYears ? `${profile.experienceYears} years` : ""}
            to="/join/identity"
          />
          <ReviewRow label="Employment type" value={draft?.engagement ?? ""} />
          <div className="border-t border-border-subtle pt-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-body-sm text-muted">{business ? "Company description" : "Short description"}</p>
              {profile.bio || profile.experience ? null : (
                <Link to="/join/identity" className="text-body-sm text-[#F2BA8B] underline underline-offset-4 hover:text-foreground">
                  Add
                </Link>
              )}
            </div>
            {profile.bio || profile.experience ? (
              <p className="mt-1.5 text-body-sm leading-relaxed text-foreground">{profile.bio || profile.experience}</p>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title={business ? "Team skills & tools" : "Skills & tools"} editTo="/join/credentials" editLabel="Edit skills and tools">
          {profile.skills.length > 0 ? (
            <CardChips items={profile.skills} />
          ) : (
            <Link to="/join/identity" className="text-body-sm text-[#F2BA8B] underline underline-offset-4 hover:text-foreground">
              Add your skills
            </Link>
          )}
          {profile.tools.length > 0 ? (
            <div className="mt-3">
              <p className="mb-2 text-body-sm text-muted">Tools and tech stack</p>
              <CardChips items={profile.tools} />
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="Work and capability" editTo="/join/credentials" editLabel="Edit work and capability">
          {offers.length > 0 ? (
            <div className="mb-3">
              <p className="mb-2 text-body-sm text-muted">Project categories</p>
              <CardChips items={offers} />
            </div>
          ) : null}
          <ReviewRow label="Participation" value={profile.specialization ?? ""} to="/join/credentials" />
          <ReviewRow label={business ? "Workstation" : "Own gear"} value={draft?.requirements ?? ""} to="/join/credentials" />
          {certifications.length > 0 ? (
            <div className="mt-3">
              <p className="mb-2 text-body-sm text-muted">Certifications</p>
              <CardChips items={certifications} />
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="Working preference" editTo="/join/credentials" editLabel="Edit working preference">
          <ReviewRow label="Remote, on-site, or hybrid" value={workLabel(profile.workPreference || draft?.remoteOnsite)} />
          <ReviewRow label="Service area" value={draft?.location || profile.location} to="/join/credentials" />
          <ReviewRow label="Availability needed" value={draft?.timing ?? ""} />
        </SectionCard>

        <SectionCard title="Current availability" editTo="/join/credentials" editLabel="Edit current availability">
          <ReviewRow label="Available today" value={availableToday ? "Yes" : "No"} />
          <ReviewRow label="Available right now" value={availableNow ? "Yes" : "No"} />
        </SectionCard>

        <div className="rounded-lg border border-border-subtle bg-white/[0.03] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <IconLock className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-medium text-foreground">Shared after a handshake</p>
              <p className="mt-1 text-body-sm text-muted">
                Your contact is revealed only after both sides accept and acknowledge the terms, never on the board.
              </p>
              <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-3">
                {[
                  ["Name", profile.displayName || account?.displayName || ""],
                  ["Email", account?.email ?? ""],
                  ["Phone", account?.phone ?? ""],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-caption text-quiet">{label}</dt>
                    <dd className="mt-0.5 truncate text-body-sm text-foreground">{value || "Not provided"}</dd>
                  </div>
                ))}
              </dl>
              <Link
                to="/account"
                className="mt-4 inline-block text-body-sm text-[#F2BA8B] underline underline-offset-4 hover:text-foreground"
              >
                Edit on your account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-label text-destructive">
          {error}
        </p>
      ) : null}

      <JoinFooterBar>
        <Button type="button" size="lg" className="rounded-lg px-10" onClick={onReview}>
          Review
        </Button>
      </JoinFooterBar>
    </>
  );
}
