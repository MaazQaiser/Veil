import { JOIN_ROUTE } from "@/components/city/CityShell";
import { Reveal } from "./Reveal";
import { PillCta, PillEyebrow } from "./primitives";

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src="/scenes/city.jpg"
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C0C]/70 via-[#0B0C0C]/65 to-[#0B0C0C]" />

      <Reveal className="relative flex flex-col items-center px-6 py-24 text-center text-white sm:px-10 md:py-32">
        <PillEyebrow className="border-white/20 bg-white/10 text-white">Join VAEL</PillEyebrow>
        <h2 className="hero-display mt-6 max-w-xl text-white">
          Ready to
          <br />
          <span className="text-white/80">enter VAEL?</span>
        </h2>
        <p className="hero-lede mt-5 max-w-sm text-white/70">
          Set your availability once. Let percentage-fit matching do the rest.
        </p>
        <div className="mt-9">
          <PillCta to={JOIN_ROUTE} tone="accent">
            Find Your Match
          </PillCta>
        </div>
      </Reveal>
    </section>
  );
}
