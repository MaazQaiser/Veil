import { Link } from "react-router-dom";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { Reveal } from "./Reveal";

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
        <span className="font-sans text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[#DE7C40]">Join VAEL</span>
        <h2 className="mt-6 max-w-xl font-sans text-[clamp(1.75rem,3.2vw,2.75rem)] font-medium leading-[1.1] tracking-tight text-white">
          Ready to
          <br />
          <span className="text-white/65">enter VAEL?</span>
        </h2>
        <p className="mt-5 max-w-sm font-sans text-[1.0625rem] leading-[1.55] text-white/65">
          Set your availability once. Let percentage-fit matching do the rest.
        </p>
        <Link
          to={JOIN_ROUTE}
          className="mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#DE7C40] px-5 font-sans text-body-sm font-medium text-[#0B0C0C] hover:bg-[#E89E6E]"
        >
          Find Your Match
          <span aria-hidden>→</span>
        </Link>
      </Reveal>
    </section>
  );
}
