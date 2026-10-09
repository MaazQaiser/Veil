import { Link } from "react-router-dom";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { cn } from "@/lib/cn";
import { NEED_PATH } from "@/lib/cxRoutes";
import { Reveal } from "./Reveal";

const CARDS = [
  {
    id: "vael-in",
    eyebrow: "VAEL IN",
    title: "I'm available to work",
    description: "I offer my skills, services, or availability to be matched.",
    cta: "Vael In",
    to: `${JOIN_ROUTE}?intent=in`,
    accent: false,
  },
  {
    id: "vael-out",
    eyebrow: "VAEL OUT",
    title: "I'm looking to hire",
    description: "I need someone available for a role or opportunity.",
    cta: "Vael Out",
    to: "/sign-in?intent=out",
    accent: false,
  },
  {
    id: "need",
    eyebrow: "I NEED SOMETHING DONE",
    title: "I need work done",
    description: "Tell us what you need and we'll take you to people who can help.",
    cta: "Get started",
    to: NEED_PATH,
    accent: true,
  },
] as const;

/** Three ways into VAEL, sitting under the Hero. In and Out stay the existing flows. */
export function AvailabilityBand() {
  return (
    <section className="relative z-[1] border-t border-white/10 py-16 md:py-20">
      <div className="site-container">
        <div className="grid gap-5 md:grid-cols-3">
          {CARDS.map((card, index) => (
            <Reveal key={card.id} delay={index * 80}>
              <div className="flex h-full flex-col rounded-md border border-[#DE7C40]/50 bg-[#141414]/90 px-7 py-8 text-white">
                <p className="font-sans text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[#DE7C40]">
                  {card.eyebrow}
                </p>
                <h3 className="mt-3 font-sans text-[1.375rem] font-medium tracking-tight text-white">{card.title}</h3>
                <p className="mt-2 flex-1 text-body-sm text-white/70">{card.description}</p>
                <Link
                  to={card.to}
                  className={cn(
                    "mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-md font-sans text-body-sm font-medium motion-safe:transition-colors",
                    card.accent
                      ? "bg-[#DE7C40] text-[#0B0C0C] hover:bg-[#E89E6E]"
                      : "bg-white text-[#0B0C0C] hover:bg-white/90",
                  )}
                >
                  {card.cta}
                  {card.accent ? <span aria-hidden>→</span> : null}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
