import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { PixelReveal } from "./PixelReveal";

const CARDS = [
  {
    id: "professionals",
    eyebrow: "For Professionals",
    bold: "Join as a",
    italic: "Professional",
    cta: "Join as a Professional",
    to: JOIN_ROUTE,
    ctaStyle: "white",
  },
  {
    id: "businesses",
    eyebrow: "For Businesses",
    bold: "Find",
    italic: "Talent",
    cta: "Find Talent",
    to: "/sign-in?intent=out",
    ctaStyle: "orange",
  },
] as const;

export function SplitAudience() {
  return (
    <section
      id="split-audience"
      data-surface="site-dark"
      className="relative flex min-h-screen items-center overflow-hidden py-24 md:py-32"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0C0C]/50 to-[#0B0C0C]" aria-hidden />

      <div className="site-container relative z-[1] w-full">
        <div className="grid gap-6 md:grid-cols-2">
          {CARDS.map((card) => (
            <PixelReveal key={card.id} tint="#141414" className="overflow-hidden rounded-md">
              <div className="flex flex-col rounded-md border border-[#DE7C40]/50 bg-[#141414]/90 px-8 py-10 text-white motion-safe:transition-colors motion-safe:duration-300 md:px-10 md:py-12">
                <p className="font-sans text-caption font-medium text-[#DE7C40]">{card.eyebrow}</p>
                <h3 className="mt-4 font-sans text-[clamp(1.75rem,3.2vw,2.25rem)] font-medium leading-[1.1] tracking-tight text-white">
                  {card.bold} <span className="text-white/65">{card.italic}</span>
                </h3>

                <Link
                  to={card.to}
                  className={cn(
                    "mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md font-sans text-body-sm font-medium motion-safe:transition-colors",
                    card.ctaStyle === "orange"
                      ? "bg-[#DE7C40] text-[#0B0C0C] hover:bg-[#E89E6E]"
                      : "bg-white text-[#0B0C0C] hover:bg-white/90",
                  )}
                >
                  {card.cta}
                  {card.ctaStyle === "orange" ? <span aria-hidden>→</span> : null}
                </Link>
              </div>
            </PixelReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
