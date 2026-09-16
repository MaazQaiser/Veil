import { cn } from "@/lib/cn";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { IconSearch, IconUser } from "@/components/ui/icons";
import { Reveal } from "./Reveal";
import { PillCta } from "./primitives";

const CARDS = [
  {
    id: "vael-in",
    icon: IconUser,
    eyebrow: "For Professionals",
    title: "Vael In",
    description: "Turn on your availability and get matched to real opportunities this cycle.",
    cta: "Vael In",
    to: JOIN_ROUTE,
    tone: "plain",
  },
  {
    id: "vael-out",
    icon: IconSearch,
    eyebrow: "For Businesses",
    title: "Vael Out",
    description: "Signal who you need and see percentage-fit people available right now.",
    cta: "Vael Out",
    to: "/explore",
    tone: "yellow",
  },
] as const;

/** A short, wide follow-up to the Hero — the two-sided pitch in one glance, not the full SplitAudience pitch below. */
export function AvailabilityBand() {
  return (
    <section className="border-t border-border py-12 md:py-16">
      <div className="site-container">
        <div className="grid gap-5 md:grid-cols-2">
          {CARDS.map((card, index) => {
            const Icon = card.icon;
            const yellow = card.tone === "yellow";
            return (
              <Reveal key={card.id} delay={index * 120}>
                <div
                  className={cn(
                    "flex flex-col gap-5 rounded-3xl px-7 py-7 motion-safe:transition-transform motion-safe:duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center md:px-8 md:py-8",
                    yellow
                      ? "border border-[#FFC555]/50 bg-[#FFF3D0] text-foreground"
                      : "border border-border bg-surface text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                      yellow ? "bg-[#FFC555]/30 text-[#8A6D00]" : "bg-[#CA8A04]/10 text-[#CA8A04]",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[0.6875rem] font-medium uppercase tracking-[0.14em]",
                        yellow ? "text-[#8A6D00]" : "text-[#CA8A04]",
                      )}
                    >
                      {card.eyebrow}
                    </p>
                    <h3 className="mt-1 text-[1.375rem] font-semibold tracking-tight">{card.title}</h3>
                    <p className={cn("mt-1.5 text-body-sm", yellow ? "text-[#6B5300]" : "text-muted")}>
                      {card.description}
                    </p>
                  </div>

                  <PillCta to={card.to} tone="dark" className="shrink-0">
                    {card.cta}
                  </PillCta>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
