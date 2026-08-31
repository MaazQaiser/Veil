import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/feedback";
import { FilterBar } from "@/components/ui/search";
import { FilterChipRow, HonestyNote, PersonCard, SectionHead } from "@/components/marketing/primitives";
import {
  AVAILABILITY_LABEL,
  MARKETING_DIRECTORY,
  matchBand,
  uniqueSkills,
  uniqueValues,
  type AvailabilityWindow,
} from "@/lib/marketingDirectory";
import { JOIN_ROUTE } from "@/components/city/CityShell";

const ALL = "All";
const MATCH_BANDS = ["All", "80+", "60+", "Below 60"] as const;

export function ExplorePage() {
  const [district, setDistrict] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [availability, setAvailability] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [skill, setSkill] = useState(ALL);
  const [band, setBand] = useState<(typeof MATCH_BANDS)[number]>("All");
  const [verified, setVerified] = useState<"All" | "Verified">("All");

  const people = useMemo(() => {
    return MARKETING_DIRECTORY.filter((person) => {
      if (district !== ALL && person.district !== district) return false;
      if (location !== ALL && person.location !== location) return false;
      if (availability !== ALL && AVAILABILITY_LABEL[person.availability as AvailabilityWindow] !== availability)
        return false;
      if (category !== ALL && person.category !== category) return false;
      if (skill !== ALL && !person.skills.includes(skill)) return false;
      if (band !== "All" && matchBand(person.match) !== band) return false;
      if (verified === "Verified" && !person.verified) return false;
      return true;
    }).sort((a, b) => b.match - a.match);
  }, [district, location, availability, category, skill, band, verified]);

  return (
    <div data-surface="site" className="bg-background pb-24 pt-14 text-foreground">
      <div className="site-container">
        <SectionHead
          eyebrow="Explore"
          title="See who’s available now."
          lede="See who's available. Find who fits. Make the connection. Full profiles open after a Handshake."
        />

        <div className="sticky top-[4.5rem] z-20 mt-10 space-y-3 border-b border-border bg-background/95 py-4 backdrop-blur">
          <FilterBar count={people.length}>
            <span className="sr-only">Directory filters</span>
          </FilterBar>
          <FilterChipRow labels={[ALL, ...uniqueValues("district")]} active={district} onSelect={setDistrict} />
          <FilterChipRow labels={[ALL, ...uniqueValues("location")]} active={location} onSelect={setLocation} />
          <FilterChipRow
            labels={[ALL, ...uniqueValues("availability").map((value) => AVAILABILITY_LABEL[value as AvailabilityWindow])]}
            active={availability}
            onSelect={setAvailability}
          />
          <FilterChipRow labels={[ALL, ...uniqueValues("category")]} active={category} onSelect={setCategory} />
          <FilterChipRow labels={[ALL, ...uniqueSkills()]} active={skill} onSelect={setSkill} />
          <FilterChipRow labels={[...MATCH_BANDS]} active={band} onSelect={(label) => setBand(label as (typeof MATCH_BANDS)[number])} />
          <FilterChipRow labels={["All", "Verified"]} active={verified} onSelect={(label) => setVerified(label as "All" | "Verified")} />
        </div>

        {people.length === 0 ? (
          <EmptyState
            title="No one matches those filters"
            description="Clear a filter to see more availability."
          />
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((person) => (
              <PersonCard key={person.id} person={person} href={JOIN_ROUTE} />
            ))}
          </div>
        )}
        <HonestyNote className="mt-8" />
      </div>
    </div>
  );
}
