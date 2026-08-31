import { Link } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button";
import { JOIN_ROUTE } from "@/components/city/CityShell";

export function SplitAudience() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="site-container grid gap-px overflow-hidden rounded-[1rem] border border-border bg-border md:grid-cols-2">
        <div className="bg-surface px-8 py-14 md:px-12 md:py-20">
          <p className="site-eyebrow">For Professionals</p>
          <h2 className="site-h2 mt-5">Be visible when you're available.</h2>
          <Link to={JOIN_ROUTE} className={buttonClassName({ className: "mt-8 rounded-full" })}>
            Join as a Professional
          </Link>
        </div>
        <div className="bg-surface px-8 py-14 md:px-12 md:py-20">
          <p className="site-eyebrow">For Businesses</p>
          <h2 className="site-h2 mt-5">Find the right person when you need them.</h2>
          <Link to="/explore" className={buttonClassName({ className: "mt-8 rounded-full" })}>
            Find Talent
          </Link>
        </div>
      </div>
    </section>
  );
}
