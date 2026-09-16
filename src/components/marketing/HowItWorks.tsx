import { JOIN_ROUTE } from "@/components/city/CityShell";
import { CountUp } from "./CountUp";
import { Reveal } from "./Reveal";
import { PillCta } from "./primitives";

const STATS = [
  { value: 92, suffix: "%", label: "Average Match", copy: "Ranked by fit, updated every week." },
  { value: 847, suffix: "", label: "Available Today", copy: "Real availability across five districts." },
  { value: 18, suffix: "", label: "Handshakes / hr", copy: "Made only once both sides agree." },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-border bg-background py-20 md:py-28">
      <div className="site-container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" aria-hidden />
            How VAEL Works
          </span>
          <h2 className="hero-display mt-4 text-foreground">
            Availability changes
            <br />
            <span className="text-muted">everything.</span>
          </h2>
          <p className="hero-lede mt-5 text-muted">
            No cold outreach, no scrolling through noise — just real people, ranked by fit,
            connecting only once both sides say yes.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-16 grid divide-y divide-border border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {STATS.map((stat, index) => (
              <div key={stat.label} className="py-8 sm:px-8 sm:first:pl-0 sm:last:pr-0">
                <p className="hero-display text-[2.75rem] leading-none text-foreground">
                  <CountUp value={stat.value} duration={1200 + index * 150} />
                  <span className="text-[#CA8A04]">{stat.suffix}</span>
                </p>
                <p className="mt-3 text-body font-medium text-foreground">{stat.label}</p>
                <p className="mt-1 text-body-sm text-muted">{stat.copy}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-14 flex justify-center">
            <PillCta to={JOIN_ROUTE} tone="accent">
              Learn More
            </PillCta>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
