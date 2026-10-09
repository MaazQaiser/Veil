import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reveal } from "@/components/marketing/Reveal";
import { LiveTicker } from "@/components/marketing/LiveTicker";
import { FindYourWay } from "@/components/marketing/FindYourWay";
import { IconChevronDown, IconSearch } from "@/components/ui/icons";
import { primaryDistricts } from "@/lib/districts";

const ROLE_EXAMPLES = ["Product designer", "Site supervisor", "Freight carrier", "Brand strategist"];

function DistrictSelect({
  id,
  value,
  onChange,
  className,
  selectClassName,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
  selectClassName: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        District
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClassName}
      >
        <option value="" className="text-[#0B0C0C]">
          Any district
        </option>
        {primaryDistricts.map((item) => (
          <option key={item.id} value={item.name} className="text-[#0B0C0C]">
            {item.name}
          </option>
        ))}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35 sm:right-1.5" />
    </div>
  );
}

function HeroSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setExampleIndex((value) => (value + 1) % ROLE_EXAMPLES.length), 2600);
    return () => clearInterval(id);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    if (district) params.set("district", district);
    const qs = params.toString();
    navigate(qs ? `/explore?${qs}` : "/explore");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="flex h-12 flex-1 items-center rounded-md border border-white/10 bg-white/[0.05] pl-4 pr-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <IconSearch className="h-4 w-4 shrink-0 text-white/45" />
        <label htmlFor="hero-search" className="sr-only">
          What are you looking for?
        </label>
        <input
          id="hero-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={query ? undefined : `What are you looking for? — try "${ROLE_EXAMPLES[exampleIndex]}"`}
          className="h-full min-w-0 flex-1 bg-transparent px-3 font-sans text-body-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <div className="hidden h-6 w-px shrink-0 bg-white/10 sm:block" aria-hidden />
        <DistrictSelect
          id="hero-district"
          value={district}
          onChange={setDistrict}
          className="relative hidden shrink-0 sm:block"
          selectClassName="h-full appearance-none bg-transparent py-1 pl-4 pr-7 font-sans text-body-sm text-white/70 focus:outline-none"
        />
      </div>
      <DistrictSelect
        id="hero-district-mobile"
        value={district}
        onChange={setDistrict}
        className="relative sm:hidden"
        selectClassName="h-12 w-full appearance-none rounded-md border border-white/10 bg-white/[0.05] py-1 pl-4 pr-8 font-sans text-body-sm text-white/70 focus:outline-none"
      />
      <button
        type="submit"
        className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-[#DE7C40] px-5 font-sans text-body-sm font-medium text-[#0B0C0C] motion-safe:transition-colors hover:bg-[#E89E6E]"
      >
        Find a Match
        <span aria-hidden>→</span>
      </button>
    </form>
  );
}

export function Hero() {
  return (
    <section
      id="hero"
      data-surface="site-dark"
      className="relative isolate flex min-h-screen flex-col overflow-hidden text-white"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C0C]/55 via-[#0B0C0C]/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C0C]/80 via-[#0B0C0C]/30 to-transparent" />

      <div className="relative z-[2] flex flex-1 flex-col">
        <div className="pt-[var(--space-nav)]">
          <LiveTicker />
        </div>

        <div className="site-container flex flex-1 flex-col justify-center pb-14 md:pb-16">
          <Reveal>
            <h1 className="max-w-3xl font-sans text-[clamp(2.75rem,6.6vw,4.5rem)] font-medium leading-[0.98] tracking-tight text-white">
              The right people.
              <br />
              When they&apos;re
              <br />
              available.
            </h1>
          </Reveal>
          <div className="max-w-xl lg:max-w-[38rem]">
            <Reveal delay={120}>
              <p className="mt-5 max-w-xl font-sans text-[1.1875rem] leading-[1.5] text-white/65 md:text-[1.25rem]">
                Your definition of fit is the only one that matters. VAEL connects people and businesses through
                real-time availability and percentage-based matching.
              </p>
            </Reveal>
          </div>
          <Reveal delay={240}>
            <div className="mt-8 max-w-xl md:mt-10">
              <HeroSearch />
            </div>
          </Reveal>
        </div>
      </div>

      <FindYourWay />
    </section>
  );
}
