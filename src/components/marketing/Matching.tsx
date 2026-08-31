import { Link } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button";
import { MARKETING_DIRECTORY } from "@/lib/marketingDirectory";
import { HonestyNote, MatchBadge } from "./primitives";

const FEATURED = MARKETING_DIRECTORY[0];

export function Matching() {
  return (
    <section data-surface="site-dark" className="bg-background py-20 text-foreground md:py-28">
      <div className="site-container">
        <h2 className="site-h2 max-w-4xl">Stop searching. Start matching.</h2>
        <div className="mt-14 grid items-center gap-10 lg:grid-cols-12">
          <article className="site-card border border-border bg-surface p-8 lg:col-span-7 lg:p-12">
            <MatchBadge percent={FEATURED.match} />
            <div className="mt-8 flex items-center gap-5">
              <img
                src={FEATURED.photo}
                alt=""
                loading="lazy"
                className="h-20 w-20 rounded-full object-cover"
              />
              <div>
                <p className="text-h3 font-medium tracking-tight">{FEATURED.name}</p>
                <p className="mt-1 text-body text-muted">{FEATURED.role}</p>
              </div>
            </div>
            <ul className="mt-8 space-y-3 text-body">
              {FEATURED.skills.map((skill) => (
                <li key={skill}>✓ {skill}</li>
              ))}
              <li>✓ Available Today</li>
            </ul>
            <Link
              to="/explore"
              className={buttonClassName({ size: "lg", className: "mt-10 rounded-full" })}
            >
              View Match →
            </Link>
            <HonestyNote className="mt-4" />
          </article>
          <p className="site-lede text-muted lg:col-span-5">
            Percentage-fit matching is how VAEL ranks availability. Fit first. Then a Handshake.
          </p>
        </div>
      </div>
    </section>
  );
}
