import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "how-it-works", label: "How it works" },
  { id: "explore", label: "Explore" },
  { id: "districts", label: "Districts" },
  { id: "matching", label: "Matching" },
  { id: "handshake", label: "Handshake" },
  { id: "community", label: "Community" },
  { id: "split-audience", label: "Get started" },
] as const;

export function SectionRail() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const elements = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Page sections"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <div className="flex flex-col items-center gap-2.5 rounded-full border border-white/10 bg-[#0B0C0C]/70 px-2 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
        {SECTIONS.map((section) => {
          const isActive = section.id === activeId;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-label={section.label}
              aria-current={isActive ? "true" : undefined}
              className="group relative flex h-3 w-3 items-center justify-center"
            >
              <span
                className={cn(
                  "block rounded-full transition-all duration-300",
                  isActive ? "h-2.5 w-2.5 bg-[#FACC15]" : "h-1.5 w-1.5 bg-white/35 group-hover:bg-white/70",
                )}
              />
              <span
                className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full border border-white/10 bg-[#0B0C0C] px-3 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
              >
                {section.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
