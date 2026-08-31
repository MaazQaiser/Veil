import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCitySession } from "@/lib/citySession";
import { completeOnboardingStep } from "@/lib/onboarding";
import { useVael } from "@/lib/vaelCore";
import { JoinHead } from "./JoinLayout";
import { cn } from "@/lib/cn";

export function JoinVeilPage() {
  const { session, setVeil } = useCitySession();
  const vael = useVael();
  const navigate = useNavigate();
  const [choice, setChoice] = useState<"in" | "out">("in");

  function onVeilIn() {
    const profile = vael.profile(session.handle);
    if (!profile) return;
    const discipline = profile.disciplines[0] || profile.headline || "Designer";
    vael.saveListing({
      handle: session.handle,
      side: "in",
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
      description: profile.bio || `${profile.displayName} is available this cycle.`,
      requirements: "",
      contact: "",
      timeline: "This cycle",
    });
    setVeil("in");
    completeOnboardingStep(session.handle, "Veil In");
    navigate("/join/done");
  }

  return (
    <div className="max-w-lg">
      <JoinHead
        title="Are you available?"
        lede="Veil In when you're available to be discovered by relevant matches."
      />
      <ul className="mt-10 grid gap-4">
        <li>
          <button
            type="button"
            onClick={() => setChoice("in")}
            className={cn(
              "site-card w-full border px-6 py-6 text-left",
              choice === "in" ? "border-foreground bg-surface" : "border-border bg-surface",
            )}
            aria-pressed={choice === "in"}
          >
            <p className="site-meta">Veil In</p>
            <p className="mt-3 text-h4 font-medium">Available to connect.</p>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => setChoice("out")}
            className={cn(
              "site-card w-full border px-6 py-6 text-left",
              choice === "out" ? "border-foreground bg-surface" : "border-border bg-surface",
            )}
            aria-pressed={choice === "out"}
          >
            <p className="site-meta">Veil Out</p>
            <p className="mt-3 text-h4 font-medium">Not currently available.</p>
          </button>
        </li>
      </ul>
      <Button
        type="button"
        size="lg"
        className="mt-10 rounded-full px-7"
        disabled={choice !== "in"}
        onClick={onVeilIn}
      >
        Veil In
      </Button>
    </div>
  );
}
