import { Link } from "react-router-dom";
import { DISTRICT_CARDS } from "@/lib/marketingDirectory";
import { ParallaxImage } from "./ParallaxImage";
import { Reveal } from "./Reveal";

export function DistrictsGrid() {
  return (
    <section id="districts" className="border-t border-black/10 bg-white py-20 text-[#0B0C0C] md:py-28">
      <div className="site-container">
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="font-sans text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[#DE7C40]">
              One Network, Five Districts
            </span>
            <h2 className="mt-4 max-w-2xl font-sans text-[clamp(1.75rem,3.2vw,2.75rem)] font-medium leading-[1.1] tracking-tight text-[#0B0C0C]">
              One network. <span className="text-[#0B0C0C]/65">Different worlds.</span>
            </h2>
          </div>
          <Link
            to="/districts"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#DE7C40] px-5 font-sans text-body-sm font-medium text-[#0B0C0C] hover:bg-[#E89E6E]"
          >
            Explore Districts
            <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>

      <div className="relative mt-16">
        {DISTRICT_CARDS.map((district, index) => (
          <div key={district.id} className="sticky top-20 mb-4 md:top-24" style={{ zIndex: index + 1 }}>
            <Reveal className="site-container">
              <Link
                to={district.route}
                className="group grid grid-cols-1 items-start gap-x-12 gap-y-6 rounded-md border border-black/10 bg-white p-6 shadow-[0_8px_30px_rgba(11,12,12,0.06)] md:grid-cols-2 md:p-8"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#0B0C0C]">
                  <ParallaxImage
                    src={district.image}
                    strength={40}
                    className="absolute inset-x-0 -top-[12%] h-[124%] w-full object-cover will-change-transform motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md bg-[#DE7C40] px-3 py-1.5 font-sans text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#0B0C0C]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0B0C0C]" aria-hidden />
                    Live
                  </span>
                </div>

                <div className="md:pt-1">
                  <h3 className="inline-flex items-center gap-3 font-sans text-[2rem] font-medium tracking-tight text-[#0B0C0C] md:text-[2.25rem]">
                    {district.name}
                    <span
                      aria-hidden
                      className="text-[1.5rem] text-quiet opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                    >
                      →
                    </span>
                  </h3>
                  <p className="mt-4 max-w-md text-body text-[#0B0C0C]/70">{district.blurb}</p>
                  <p className="mt-3 max-w-md text-body-sm text-[#0B0C0C]/45">{district.description}</p>
                </div>
              </Link>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
