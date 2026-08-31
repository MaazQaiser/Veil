import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button";

export function Hero() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <section data-surface="site-dark" className="relative isolate min-h-[88vh] overflow-hidden bg-background text-foreground">
      {reduceMotion ? (
        <img
          src="/video/hero-poster.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/video/hero-poster.jpg"
          aria-hidden
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 bg-[#0B0C0C]/70" />
      <div className="site-container relative flex min-h-[88vh] flex-col justify-end pb-16 pt-28 md:pb-24 md:pt-36">
        <p className="site-eyebrow">The City of VAEL</p>
        <h1 className="site-display mt-6 max-w-4xl">The right people. When they’re available.</h1>
        <p className="site-lede mt-6 max-w-xl text-muted">
          VAEL connects people and businesses through real-time availability and percentage-based matching.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/explore" className={buttonClassName({ size: "lg", className: "rounded-full px-7" })}>
            Find a Match
          </Link>
          <Link
            to="/districts"
            className={buttonClassName({ variant: "outline", size: "lg", className: "rounded-full px-7" })}
          >
            Explore VAEL
          </Link>
        </div>
      </div>
    </section>
  );
}
