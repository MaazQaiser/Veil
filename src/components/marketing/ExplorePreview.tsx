import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { primaryDistricts } from "@/lib/districts";
import { AVAILABILITY_LABEL, MARKETING_DIRECTORY } from "@/lib/marketingDirectory";
import { Reveal } from "./Reveal";
import { PillCta } from "./primitives";

const TABS = ["All", ...primaryDistricts.map((district) => district.name)];

export function ExplorePreview() {
  const [activeTab, setActiveTab] = useState<string>("All");

  const rows = (
    activeTab === "All"
      ? MARKETING_DIRECTORY
      : MARKETING_DIRECTORY.filter((person) => person.district === activeTab)
  ).slice(0, 6);

  return (
    <section
      id="explore"
      data-surface="site-dark"
      className="relative overflow-hidden border-t border-border bg-[#0B0C0C] py-20 text-white md:py-28"
    >
      <img
        src="/scenes/city-skyline-wide.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C0C]/75 via-[#0B0C0C]/90 to-[#0B0C0C]" />

      <div className="site-container relative z-[2]">
        <Reveal className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[0.75rem] font-medium uppercase tracking-[0.12em] text-[#0B0C0C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0B0C0C]" aria-hidden />
            Available Now
          </span>
          <h2 className="hero-display mt-5 max-w-2xl">
            See who&apos;s
            <br />
            <span className="text-white/80">available right now.</span>
          </h2>
          <p className="hero-lede mt-5 max-w-lg text-white/70">
            Real people, ranked by fit — not by who applied first. Every profile below is live on
            VAEL today.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={cn(
                "rounded-full px-5 py-2.5 text-[0.9375rem] font-medium motion-safe:transition-colors motion-safe:duration-200",
                activeTab === tab
                  ? "bg-white text-[#0B0C0C]"
                  : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white",
              )}
            >
              {tab}
            </button>
          ))}
        </Reveal>

        <Reveal delay={150} className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md">
          {rows.map((person, index) => (
            <Link
              key={person.id}
              to="/explore"
              className={cn(
                "flex flex-col gap-3 px-6 py-6 motion-safe:transition-all motion-safe:duration-200 hover:bg-white/[0.05] sm:flex-row sm:items-center sm:gap-6 sm:px-8",
                index > 0 && "border-t border-dashed border-white/10",
              )}
            >
              <span className="hero-display text-[1.5rem] text-white/35 sm:w-10">
                {String(index + 1).padStart(2, "0")}
              </span>
              <img
                src={person.photo}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-white/15"
              />
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium text-white">{person.name}</p>
                <p className="mt-1 truncate text-body-sm text-white/45">
                  {person.district} · {person.location}
                </p>
              </div>
              <div className="flex items-center gap-4 text-body-sm text-white/70 sm:gap-6">
                <span className="whitespace-nowrap text-white/50">{person.role}</span>
                <span className="whitespace-nowrap">{AVAILABILITY_LABEL[person.availability]}</span>
              </div>
              <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-white/25 px-5 text-body-sm font-medium text-white motion-safe:transition-colors motion-safe:duration-200 hover:bg-white hover:text-[#0B0C0C]">
                View Profile
              </span>
            </Link>
          ))}
        </Reveal>

        <Reveal delay={200} className="mt-10 flex justify-center">
          <PillCta to="/explore" tone="light">
            Open Explore
          </PillCta>
        </Reveal>
      </div>
    </section>
  );
}
