import { Link } from "react-router-dom";
import { DISTRICT_CARDS } from "@/lib/marketingDirectory";
import { SectionHead } from "./primitives";

export function DistrictsGrid() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="site-container">
        <SectionHead title="One network. Different worlds." />
        <ul className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {DISTRICT_CARDS.map((district) => (
            <li key={district.id}>
              <Link
                to={district.route}
                className="site-card group block border border-border bg-surface focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(11,12,12,0.12)]"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={district.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="px-6 py-6">
                  <p className="site-meta text-success">LIVE</p>
                  <h3 className="site-h3 mt-3">{district.name}</h3>
                  <p className="mt-3 text-body-sm text-muted">{district.blurb}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
