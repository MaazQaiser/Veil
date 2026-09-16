import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { Reveal } from "./Reveal";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5L9.5 17L19 7"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CARDS = [
  {
    id: "professionals",
    eyebrow: "For Professionals",
    bold: "Join as a",
    italic: "Professional",
    features: [
      "Set your own availability",
      "Percentage-fit matching",
      "Private handshake before contact",
      "No cold outreach, ever",
    ],
    cta: "Join as a Professional",
    to: JOIN_ROUTE,
    dark: false,
  },
  {
    id: "businesses",
    eyebrow: "For Businesses",
    bold: "Find",
    italic: "Talent",
    features: [
      "Browse verified availability",
      "Filter by district & skill",
      "Message only after a match",
      "Fill roles faster",
    ],
    cta: "Find Talent",
    to: "/join?intent=out",
    dark: true,
  },
] as const;

export function SplitAudience() {
  return (
    <section id="split-audience" className="border-t border-border py-24 md:py-32">
      <div className="site-container">
        <div className="grid gap-6 md:grid-cols-2">
          {CARDS.map((card, index) => (
            <Reveal key={card.id} delay={index * 120}>
              <div
                className={cn(
                  "flex min-h-[32rem] flex-col rounded-3xl px-8 py-12 motion-safe:transition-transform motion-safe:duration-300 hover:-translate-y-1 md:px-10 md:py-14",
                  card.dark
                    ? "bg-[#0B0C0C] text-white"
                    : "border border-border bg-surface text-foreground",
                )}
              >
                <p
                  className={cn(
                    "text-[0.75rem] font-medium uppercase tracking-[0.14em]",
                    card.dark ? "text-[#FACC15]" : "text-[#CA8A04]",
                  )}
                >
                  {card.eyebrow}
                </p>
                <h3 className="hero-display mt-4 text-[2.25rem] leading-[1.05] md:text-[2.5rem]">
                  {card.bold} <span className="opacity-70">{card.italic}</span>
                </h3>

                <ul className="mt-10 flex-1 space-y-4">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                          card.dark ? "bg-white/10 text-[#FACC15]" : "bg-[#CA8A04]/10 text-[#CA8A04]",
                        )}
                      >
                        <CheckIcon />
                      </span>
                      <span className={cn("text-body", card.dark ? "text-white/80" : "text-muted")}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={card.to}
                  className={cn(
                    "mt-10 inline-flex h-12 w-full items-center justify-center rounded-full text-[0.9375rem] font-medium transition-opacity hover:opacity-90",
                    card.dark ? "bg-[#FACC15] text-[#0B0C0C]" : "bg-[#0B0C0C] text-white",
                  )}
                >
                  {card.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
