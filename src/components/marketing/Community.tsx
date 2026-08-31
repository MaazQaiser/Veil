import { Link } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button";
import { SectionHead } from "./primitives";

const FEED = [
  "Discussions",
  "Industry posts",
  "Opportunities",
  "Recommendations",
  "Saved posts",
] as const;

export function Community() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="site-container grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHead title="More than a marketplace." />
          <ul className="mt-10 space-y-4">
            {FEED.map((item) => (
              <li key={item} className="border-b border-border-subtle pb-4 text-body">
                {item}
              </li>
            ))}
          </ul>
          <Link to="/feed" className={buttonClassName({ className: "mt-8 rounded-full" })}>
            Enter Community
          </Link>
        </div>
        <div className="lg:col-span-7">
          <img
            src="/scenes/community.jpg"
            alt=""
            loading="lazy"
            className="site-card h-80 w-full object-cover md:h-[32rem]"
          />
        </div>
      </div>
    </section>
  );
}
