import { useState } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

const STAGES = [
  {
    n: "01",
    title: "Share Profile",
    copy: "Limited view — fit, discipline, availability. Nothing more, until it matters.",
    image: "/people/p07.jpg",
  },
  {
    n: "02",
    title: "Send a Request",
    copy: "You ask to open the door. No cold outreach, ever.",
    image: "/scenes/handshake.jpg",
  },
  {
    n: "03",
    title: "Both Accept",
    copy: "Both sides choose to connect. Either party can walk away first.",
    image: "/scenes/community.jpg",
  },
  {
    n: "04",
    title: "Open the Handshake",
    copy: "Full profile and a private room, unlocked only once it's mutual.",
    image: "/scenes/willowform.jpg",
  },
] as const;

export function Handshake() {
  const [active, setActive] = useState(0);

  return (
    <section id="handshake" className="border-t border-border bg-background py-20 md:py-28">
      <div className="site-container">
        <Reveal>
          <span className="inline-flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" aria-hidden />
            What Happens Next
          </span>
          <h2 className="hero-display mt-5 max-w-2xl text-foreground sm:whitespace-nowrap lg:max-w-none">
            Your profile stays private,
            <br />
            <span className="text-muted">until it&apos;s mutual.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[13rem_1fr] lg:gap-16">
          <Reveal delay={80} className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative aspect-square w-full max-w-[13rem] overflow-hidden rounded-2xl shadow-[0_20px_45px_rgba(11,12,12,0.12)] ring-1 ring-black/5">
              {STAGES.map((stage, index) => (
                <img
                  key={stage.n}
                  src={stage.image}
                  alt=""
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover motion-safe:transition-opacity motion-safe:duration-500",
                    index === active ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </div>
          </Reveal>

          <Reveal delay={140}>
            <ol className="border-t border-border">
              {STAGES.map((stage, index) => (
                <li key={stage.n} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    aria-pressed={index === active}
                    className="grid w-full gap-3 py-9 text-left md:grid-cols-[3.5rem_1.4fr_1fr] md:items-baseline md:gap-8 md:py-10"
                  >
                    <span
                      className={cn(
                        "text-body-sm motion-safe:transition-colors motion-safe:duration-300",
                        index === active ? "text-[#CA8A04]" : "text-quiet",
                      )}
                    >
                      [{stage.n}]
                    </span>
                    <h3
                      className={cn(
                        "hero-display text-[2rem] leading-none motion-safe:transition-colors motion-safe:duration-300 md:text-[2.75rem]",
                        index === active ? "text-foreground" : "text-quiet",
                      )}
                    >
                      {stage.title}
                    </h3>
                    <p
                      className={cn(
                        "max-w-sm text-body-sm motion-safe:transition-colors motion-safe:duration-300 md:justify-self-end md:text-right",
                        index === active ? "text-muted" : "text-quiet/70",
                      )}
                    >
                      {stage.copy}
                    </p>
                  </button>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
