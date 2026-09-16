import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Hero } from "@/components/marketing/Hero";
import { AvailabilityBand } from "@/components/marketing/AvailabilityBand";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ExplorePreview } from "@/components/marketing/ExplorePreview";
import { DistrictsGrid } from "@/components/marketing/DistrictsGrid";
import { Matching } from "@/components/marketing/Matching";
import { Handshake } from "@/components/marketing/Handshake";
import { Community } from "@/components/marketing/Community";
import { SplitAudience } from "@/components/marketing/SplitAudience";
import { FinalCta } from "@/components/marketing/FinalCta";
import { SectionRail } from "@/components/marketing/SectionRail";

function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const target = document.querySelector(hash);
    if (!target) return;
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [hash]);
}

export function MarketingHome() {
  useHashScroll();

  return (
    <div data-surface="site" className="bg-background text-foreground">
      <Hero />
      <AvailabilityBand />
      <HowItWorks />
      <ExplorePreview />
      <DistrictsGrid />
      <Matching />
      <Handshake />
      <Community />
      <SplitAudience />
      <FinalCta />
      <SectionRail />
    </div>
  );
}
