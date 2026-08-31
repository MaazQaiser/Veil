import { useNavigate } from "react-router-dom";
import { useCitySession } from "@/lib/citySession";
import { patchOnboarding } from "@/lib/onboarding";
import { useVael } from "@/lib/vaelCore";
import { JoinHead } from "./JoinLayout";
import { cn } from "@/lib/cn";

const TYPES = [
  {
    id: "individual" as const,
    title: "Professional",
    body: "I offer my skills, services, or availability.",
  },
  {
    id: "business" as const,
    title: "Organization",
    body: "I represent a business or team.",
  },
];

export function JoinTypePage() {
  const { session } = useCitySession();
  const vael = useVael();
  const navigate = useNavigate();

  function choose(profileType: "individual" | "business") {
    const profile = vael.ensureMine();
    if (profile) vael.writeProfile({ ...profile, profileType });
    patchOnboarding(session.handle, { profileType, completedStep: "Profile Type" });
    navigate("/join/district");
  }

  return (
    <div>
      <JoinHead title="How will you use VAEL?" />
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {TYPES.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => choose(item.id)}
              className={cn(
                "site-card flex h-full w-full flex-col border border-border bg-surface px-6 py-8 text-left",
                "hover:border-foreground focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(11,12,12,0.12)]",
              )}
            >
              <h2 className="site-h3">{item.title}</h2>
              <p className="mt-3 text-body-sm text-muted">{item.body}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
