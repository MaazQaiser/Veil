import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { primaryDistricts } from "@/lib/districts";
import { AVAILABILITY_LABEL, MARKETING_DIRECTORY } from "@/lib/marketingDirectory";
import { Reveal } from "./Reveal";

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
      className="relative overflow-hidden border-t border-white/10 bg-[#0B0C0C] py-20 text-white md:py-28"
    >
      <img
        src="/scenes/city-skyline-wide.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C0C]/75 via-[#0B0C0C]/90 to-[#0B0C0C]" />

      <div className="site-container relative z-[2]">
        <Reveal className="flex flex-col items-center text-center">
          <span className="font-sans text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[#DE7C40]">
            Available Now
          </span>
          <h2 className="mt-5 max-w-2xl font-sans text-[clamp(1.75rem,3.2vw,2.75rem)] font-medium leading-[1.1] tracking-tight text-white">
            See who&apos;s
            <br />
            <span className="text-white/65">available right now.</span>
          </h2>
          <p className="mt-5 max-w-lg font-sans text-[1.0625rem] leading-[1.55] text-white/65">
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
                "rounded-md px-5 py-2.5 font-sans text-body-sm font-medium motion-safe:transition-colors motion-safe:duration-200",
                activeTab === tab
                  ? "bg-[#DE7C40] text-[#0B0C0C]"
                  : "border border-white/10 bg-white/[0.05] text-white/70 hover:border-[#DE7C40]/50 hover:text-white",
              )}
            >
              {tab}
            </button>
          ))}
        </Reveal>

        <Reveal delay={150} className="mt-10 overflow-hidden rounded-md border border-[#DE7C40]/50 bg-[#141414]/90">
          {rows.length === 0 ? (
            <p className="px-8 py-10 text-center font-sans text-body-sm text-white/60">
              No one in {activeTab} is listed right now.
            </p>
          ) : null}
          {rows.map((person, index) => (
            <Link
              key={person.id}
              to={`/explore?q=${encodeURIComponent(person.name)}`}
              className={cn(
                "flex flex-col gap-3 px-6 py-6 motion-safe:transition-all motion-safe:duration-200 hover:bg-white/[0.05] sm:flex-row sm:items-center sm:gap-6 sm:px-8",
                index > 0 && "border-t border-dashed border-white/10",
              )}
            >
              <span className="font-sans text-[1.25rem] font-medium text-white/35 sm:w-10">
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
              <span className="inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-white px-5 font-sans text-body-sm font-medium text-[#0B0C0C] motion-safe:transition-colors hover:bg-white/90">
                View Profile
              </span>
            </Link>
          ))}
        </Reveal>

        <Reveal delay={200} className="mt-10 flex justify-center">
          <Link
            to="/explore"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#DE7C40] px-5 font-sans text-body-sm font-medium text-[#0B0C0C] hover:bg-[#E89E6E]"
          >
            Open Explore
            <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
