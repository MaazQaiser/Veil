import { Link } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section data-surface="site-dark" className="relative isolate overflow-hidden bg-background py-28 text-foreground md:py-36">
      <img
        src="/scenes/city.jpg"
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-[#0B0C0C]/75" />
      <div className="site-container relative text-center">
        <h2 className="site-h2">Ready to enter VAEL?</h2>
        <Link
          to="/explore"
          className={buttonClassName({ size: "lg", className: "mt-10 rounded-full px-8" })}
        >
          Find Your Match →
        </Link>
      </div>
    </section>
  );
}
