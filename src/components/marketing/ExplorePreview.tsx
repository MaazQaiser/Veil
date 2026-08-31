import { Link, useNavigate } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button";
import { MARKETING_DIRECTORY } from "@/lib/marketingDirectory";
import { FilterChipRow, HonestyNote, PersonCard, SectionHead } from "./primitives";

const PREVIEW_FILTERS = ["District", "Location", "Availability", "Category", "Skills", "Match %", "Verified"];

export function ExplorePreview() {
  const navigate = useNavigate();
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="site-container">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHead title="See who’s available now." />
          <Link to="/explore" className={buttonClassName({ variant: "outline", className: "rounded-full" })}>
            Open Explore
          </Link>
        </div>
        <div className="mt-10">
          <FilterChipRow labels={PREVIEW_FILTERS} active="District" onSelect={() => navigate("/explore")} />
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MARKETING_DIRECTORY.slice(0, 6).map((person) => (
            <PersonCard key={person.id} person={person} href="/explore" />
          ))}
        </div>
        <HonestyNote className="mt-6" />
      </div>
    </section>
  );
}
