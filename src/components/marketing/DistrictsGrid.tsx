import { Link } from "react-router-dom";
import { DISTRICT_CARDS } from "@/lib/marketingDirectory";
import { ParallaxImage } from "./ParallaxImage";
import { Reveal } from "./Reveal";
import { PillCta } from "./primitives";

export function DistrictsGrid() {
  return (
    <section id="districts" className="border-t border-border py-20 md:py-28">
      <div className="site-container">
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" aria-hidden />
              One Network, Five Districts
            </span>
            <h2 className="hero-display mt-4 max-w-2xl text-foreground">
              One network. <span className="text-muted">Different worlds.</span>
            </h2>
          </div>
          <PillCta to="/districts" tone="accent">
            Explore Districts
          </PillCta>
        </Reveal>
      </div>

      <div className="relative mt-16">
        {DISTRICT_CARDS.map((district, index) => (
          <div key={district.id} className="sticky top-20 md:top-24" style={{ zIndex: index + 1 }}>
            <Reveal className="site-container">
              <Link
                to={district.route}
                className="group grid grid-cols-1 items-start gap-x-12 gap-y-6 border-t border-border bg-background py-12 md:grid-cols-2 md:py-16"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-muted">
                  <ParallaxImage
                    src={district.image}
                    strength={40}
                    className="absolute inset-x-0 -top-[12%] h-[124%] w-full object-cover will-change-transform motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-success backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                    Live
                  </span>
                </div>

                <div className="md:pt-1">
                  <h3 className="hero-display inline-flex items-center gap-3 text-[2.25rem] text-foreground md:text-[2.5rem]">
                    {district.name}
                    <span
                      aria-hidden
                      className="text-[1.5rem] text-quiet opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                    >
                      →
                    </span>
                  </h3>
                  <p className="mt-4 max-w-md text-body text-muted">{district.blurb}</p>
                  <p className="mt-3 max-w-md text-body-sm text-quiet">{district.description}</p>
                </div>
              </Link>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
