import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Hero } from "@/components/marketing/Hero";
import { AvailabilityBand } from "@/components/marketing/AvailabilityBand";
import { CityScene } from "@/components/marketing/CityScene";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ExplorePreview } from "@/components/marketing/ExplorePreview";
import { DistrictsGrid } from "@/components/marketing/DistrictsGrid";
import { Matching } from "@/components/marketing/Matching";
import { Handshake } from "@/components/marketing/Handshake";
import { Community } from "@/components/marketing/Community";
import { FinalCta } from "@/components/marketing/FinalCta";

function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    let cancelled = false;
    function go() {
      if (cancelled) return;
      const target = document.querySelector(hash);
      if (!target) return;
      target.scrollIntoView({ behavior: "auto", block: "start" });
    }
    go();
    const frame = requestAnimationFrame(go);
    const timer = window.setTimeout(go, 60);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [hash]);
}

export function MarketingHome() {
  useHashScroll();

  return (
    <div data-surface="site" className="bg-[#0B0C0C] text-foreground">
      <div className="relative bg-[#0B0C0C]">
        <div
          className="absolute inset-0"
          style={{ filter: "sepia(0.25) saturate(1.4) hue-rotate(-10deg) brightness(0.95)" }}
          aria-hidden
        >
          <CityScene />
        </div>
        <div className="relative">
          <Hero />
          <AvailabilityBand />
        </div>
      </div>
      <HowItWorks />
      <ExplorePreview />
      <DistrictsGrid />
      <Matching />
      <Handshake />
      <Community />
      <FinalCta />
    </div>
  );
}
