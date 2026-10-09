import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/controls";
import { IconCheck, IconGrid, IconHome, IconSearch, IconUser } from "@/components/ui/icons";
import { handleIssue, isHandleAvailable } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import {
  claimOnboardingHandle,
  districtProfileEditRoute,
  finishOnboarding,
  getOnboardingDraft,
  isNeedIntent,
  onboardingRoute,
  patchOnboarding,
} from "@/lib/onboarding";
import { DISTRICT_CARDS } from "@/lib/marketingDirectory";
import { districts } from "@/lib/districts";
import { setActiveDistrict } from "@/lib/myDistricts";
import { useVael } from "@/lib/vaelCore";
import { cn } from "@/lib/cn";
import { JoinFieldCard, JoinFooterBar, JoinHead } from "./JoinLayout";

// Districts shown on this step, in this order. Names come from the district registry.
const SETUP_DISTRICT_IDS = [
  "media-technology",
  "construction",
  "trucking",
  "residential",
  "commercial",
  "nursing-healthcare",
  "equipment",
  "government",
  "real-estate",
  "legal-finance",
];
// Only these districts have a real profile-edit page built today — everything
// else falls back to the standard Identity wizard instead of a dead route.
const LIVE_PROFILE_DISTRICT_IDS = ["construction", "trucking", "residential", "commercial"];
const setupDistricts = SETUP_DISTRICT_IDS.map((id) => districts.find((d) => d.id === id)).filter(
  (d): d is (typeof districts)[number] => Boolean(d),
);

const TYPES_IN = [
  {
    id: "individual" as const,
    title: "Individual",
    body: "I offer my skills, services, or availability.",
  },
  {
    id: "business" as const,
    title: "Business",
    body: "I represent a company or team.",
  },
];

const TYPES_OUT = [
  {
    id: "individual" as const,
    title: "Individual",
    body: "I'm hiring for myself or my household.",
  },
  {
    id: "business" as const,
    title: "Organization",
    body: "I'm hiring on behalf of a business or team.",
  },
];

export function JoinSetupPage() {
  const { session, signIn } = useCitySession();
  const vael = useVael();
  const navigate = useNavigate();
  const draft = getOnboardingDraft(session.handle);
  const TYPES = draft?.intent === "out" ? TYPES_OUT : TYPES_IN;

  const [handleValue, setHandleValue] = useState(session.handle);
  const [handleError, setHandleError] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [profileType, setProfileType] = useState<"individual" | "business" | "">("");
  const [query, setQuery] = useState("");
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

  useEffect(() => {
    const clean = handleValue.trim().toLowerCase().replace(/^@/, "");
    const issue = handleIssue(clean);
    if (issue) {
      setAvailable(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setAvailable(isHandleAvailable(clean, session.handle));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [handleValue, session.handle]);

  const visibleDistricts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return setupDistricts;
    return setupDistricts.filter((district) => {
      const card = DISTRICT_CARDS.find((item) => item.id === district.id);
      return `${district.name} ${card?.blurb ?? district.blurb}`.toLowerCase().includes(q);
    });
  }, [query]);

  const vaelIn = draft?.intent !== "out";

  function toggleDistrict(districtId: string) {
    if (vaelIn) {
      setSelectedDistricts([districtId]);
      return;
    }
    setSelectedDistricts((prev) =>
      prev.includes(districtId) ? prev.filter((id) => id !== districtId) : [...prev, districtId],
    );
  }

  const clean = handleValue.trim().toLowerCase().replace(/^@/, "");
  const wellFormed = !handleIssue(clean);
  const canContinue = wellFormed && available !== false && Boolean(profileType) && selectedDistricts.length > 0;

  if (isNeedIntent(draft)) {
    return <Navigate to={onboardingRoute(session.handle)} replace />;
  }

  function onContinue() {
    if (!canContinue || !profileType) return;

    const result = claimOnboardingHandle(session.handle, handleValue);
    if (!result.ok) {
      setHandleError(result.error);
      setAvailable(false);
      return;
    }
    const handle = result.handle;
    if (handle !== session.handle) signIn(handle);

    const profile = vael.ensureMine();
    if (profile) vael.writeProfile({ ...profile, profileType });

    // Only one district drives the immediate profile/board flow today, so the
    // first pick leads — the rest stay selected for when multi-district
    // matching exists.
    const districtId = selectedDistricts[0];
    patchOnboarding(handle, { profileType, districtId, completedStep: "Profile Setup" });

    if (vaelIn) {
      setActiveDistrict(handle, districtId);
      navigate("/join/identity");
      return;
    }

    if (!LIVE_PROFILE_DISTRICT_IDS.includes(districtId) || districtId === "media-technology") {
      navigate("/join/identity");
      return;
    }
    finishOnboarding(handle);
    navigate(districtProfileEditRoute(districtId, handle));
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <JoinHead
        title="Your VAEL Identity"
        lede="Your handle, how you'll use VAEL, and the districts your matches are drawn from."
        center
      />
      <div className="mt-10 space-y-5">
        <JoinFieldCard icon={<IconGrid />} title="VAEL handle" badge="Required" hint="Your unique name on VAEL.">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">@</span>
            <Input
              id="handle"
              className="pl-8"
              autoComplete="username"
              value={handleValue}
              onChange={(event) => {
                setHandleValue(event.target.value.replace(/^@/, ""));
                setHandleError("");
              }}
            />
          </div>
          {handleError ? <p className="mt-2 text-label text-destructive">{handleError}</p> : null}
          {!handleError && wellFormed && available === true ? (
            <p className="mt-2 text-body-sm text-success">✓ @{clean} is available</p>
          ) : null}
          {!handleError && wellFormed && available === false ? (
            <p className="mt-2 text-body-sm text-destructive">@{clean} is taken</p>
          ) : null}
        </JoinFieldCard>

        <JoinFieldCard icon={<IconUser />} title="How will you use VAEL?" badge="Required">
          <div className="grid gap-3 sm:grid-cols-2">
            {TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setProfileType(item.id)}
                className={cn(
                  "flex h-full flex-col rounded-lg border bg-surface px-4 py-4 text-left motion-safe:transition-colors motion-safe:duration-150",
                  "hover:border-[#DE7C40] hover:bg-[#DE7C40]/[0.06]",
                  profileType === item.id ? "border-foreground" : "border-border",
                )}
              >
                <p className="text-body font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-body-sm text-muted">{item.body}</p>
              </button>
            ))}
          </div>
        </JoinFieldCard>

        <JoinFieldCard
          icon={<IconHome />}
          title={vaelIn ? "Select your district" : "Select your districts"}
          badge="Required"
          hint={
            vaelIn
              ? "Choose the one district you will be live in. You can switch later from Districts."
              : "Choose the districts where you want to participate. This determines which district profiles you'll complete next."
          }
        >
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet" />
            <Input
              type="search"
              placeholder="Search districts"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-11"
              aria-label="Search districts"
            />
          </div>
          <ul className="mt-3 space-y-1">
            {visibleDistricts.map((district) => {
              const checked = selectedDistricts.includes(district.id);
              const inputId = `district-${district.id}`;
              return (
                <li key={district.id}>
                  <label
                    htmlFor={inputId}
                    className="flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2.5 motion-safe:transition-colors motion-safe:duration-150 hover:bg-surface-muted"
                  >
                    <input
                      id={inputId}
                      type={vaelIn ? "radio" : "checkbox"}
                      name={vaelIn ? "vael-in-district" : undefined}
                      className="peer sr-only"
                      checked={checked}
                      onChange={() => toggleDistrict(district.id)}
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border bg-transparent",
                        "peer-focus-visible:shadow-[0_0_0_3px_rgba(222,124,64,0.35)]",
                        checked ? "border-accent bg-accent text-[#1A1410]" : "border-foreground/40 text-transparent",
                      )}
                    >
                      <IconCheck className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-body font-medium text-foreground">{district.name}</span>
                  </label>
                </li>
              );
            })}
            {visibleDistricts.length === 0 ? (
              <li className="px-3 py-3 text-body-sm text-muted">No districts match "{query}".</li>
            ) : null}
          </ul>
        </JoinFieldCard>
      </div>

      <JoinFooterBar>
        <Button type="button" size="lg" className="rounded-lg px-10" disabled={!canContinue} onClick={onContinue}>
          Continue
        </Button>
      </JoinFooterBar>
    </div>
  );
}
