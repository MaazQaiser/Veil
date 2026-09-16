import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reveal } from "@/components/marketing/Reveal";
import { LiveTicker } from "@/components/marketing/LiveTicker";
import { CityScene } from "@/components/marketing/CityScene";
import { FindYourWay } from "@/components/marketing/FindYourWay";
import { IconChevronDown, IconSearch } from "@/components/ui/icons";
import { primaryDistricts } from "@/lib/districts";

const ROLE_EXAMPLES = ["Product designer", "Site supervisor", "Freight carrier", "Brand strategist"];

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
    <form
      onSubmit={handleSubmit}
      className="flex h-14 items-center rounded-full border border-white/15 bg-white/10 pl-6 pr-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl"
    >
      <IconSearch className="h-4 w-4 shrink-0 text-white/50" />
      <label htmlFor="hero-search" className="sr-only">
        What are you looking for?
      </label>
      <input
        id="hero-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={query ? undefined : `What are you looking for? — try "${ROLE_EXAMPLES[exampleIndex]}"`}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-[0.9375rem] text-white placeholder:text-white/45 focus:outline-none"
      />
      <div className="hidden h-6 w-px shrink-0 bg-white/15 sm:block" aria-hidden />
      <div className="relative hidden shrink-0 sm:block">
        <label htmlFor="hero-district" className="sr-only">
          District
        </label>
        <select
          id="hero-district"
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          className="h-full appearance-none bg-transparent py-1 pl-4 pr-7 text-[0.8125rem] text-white/80 focus:outline-none"
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
        <IconChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
      </div>
      <button
        type="submit"
        className="ml-2 flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-[0.875rem] font-medium text-[#0B0C0C] motion-safe:transition-opacity hover:opacity-90"
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
      className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[#0B0C0C] text-white"
    >
      <CityScene />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C0C]/55 via-[#0B0C0C]/25 to-[#0B0C0C]/88" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C0C]/65 via-[#0B0C0C]/15 to-transparent" />

      <div className="relative z-[2] flex flex-1 flex-col">
        <div className="pt-[var(--space-nav)]">
          <LiveTicker />
        </div>

        <div className="site-container flex flex-1 flex-col justify-center pb-14 md:pb-16">
          <Reveal>
            <h1 className="hero-display max-w-2xl text-white sm:whitespace-nowrap lg:max-w-none">
              The right people.
              <br />
              <span className="text-white/80">When they&apos;re available.</span>
            </h1>
          </Reveal>
          <div className="max-w-xl lg:max-w-[38rem]">
            <Reveal delay={120}>
              <p className="hero-lede mt-6 max-w-md text-white/78">
                Your definition of fit is the only one that matters. VAEL connects people and
                businesses through real-time availability and percentage-based matching.
              </p>
            </Reveal>
          </div>
          <Reveal delay={240}>
            <div className="mt-8 max-w-lg md:mt-10">
              <HeroSearch />
            </div>
          </Reveal>
        </div>
      </div>

      <FindYourWay />
    </section>
  );
}
