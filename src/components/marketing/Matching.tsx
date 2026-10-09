import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

type CompanyAd = {
  id: string;
  name: string;
  district: string;
  tagline: string;
  openRoles: number;
  initials: string;
  image: string;
};

const COMPANIES: CompanyAd[] = [
  { id: "northlight", name: "Northlight Studio", district: "Media & Technology", tagline: "Documentary & brand studio", openRoles: 14, initials: "NL", image: "/scenes/northlight.jpg" },
  { id: "atlasbuild", name: "Atlas Build Co.", district: "Contractor Exchange", tagline: "Commercial general contractor", openRoles: 22, initials: "AB", image: "/districts/construction.jpg" },
  { id: "fleetline", name: "Fleetline Logistics", district: "Trucking", tagline: "Regional freight carrier", openRoles: 30, initials: "FL", image: "/districts/trucking.jpg" },
  { id: "willowform", name: "Willowform", district: "Media & Technology", tagline: "Product design studio", openRoles: 9, initials: "WF", image: "/scenes/willowform.jpg" },
  { id: "harborview", name: "Harborview Homes", district: "Residential", tagline: "Home renovation & repair", openRoles: 11, initials: "HH", image: "/districts/residential.jpg" },
  { id: "meridian", name: "Meridian Commercial", district: "Commercial", tagline: "Facilities & operations", openRoles: 18, initials: "MC", image: "/districts/commercial.jpg" },
  { id: "brightpath", name: "Brightpath Media", district: "Media & Technology", tagline: "Post-production house", openRoles: 7, initials: "BP", image: "/districts/media-technology.jpg" },
  { id: "ironclad", name: "Ironclad Contractors", district: "Contractor Exchange", tagline: "Industrial & infrastructure", openRoles: 16, initials: "IC", image: "/districts/construction.jpg" },
];

const FEATURED_ID = COMPANIES[0].id;

function CompanyCard({ company }: { company: CompanyAd }) {
  const isFeatured = company.id === FEATURED_ID;

  return (
    <Link
      to={`/explore?district=${encodeURIComponent(company.district)}`}
      className={cn(
        "group flex w-64 shrink-0 flex-col overflow-hidden rounded-md motion-safe:transition-transform motion-safe:duration-300 hover:-translate-y-1 md:w-72",
        isFeatured
          ? "bg-[#DE7C40] text-[#0B0C0C]"
          : "border border-[#DE7C40]/50 bg-[#141414]/90 text-white",
      )}
    >
      <div className="relative h-40 w-full shrink-0 overflow-hidden">
        <img
          src={company.image}
          alt=""
          className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.04]"
        />
        <span
          className={cn(
            "absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-md text-caption font-semibold",
            isFeatured ? "bg-[#0B0C0C] text-[#DE7C40]" : "bg-[#1A1A1C] text-white ring-1 ring-[#DE7C40]/40",
          )}
        >
          {company.initials}
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-6 text-center">
        <p className="text-h4 font-medium tracking-tight">{company.name}</p>
        <p className={cn("mt-1 text-body-sm", isFeatured ? "text-[#0B0C0C]/70" : "text-white/60")}>
          {company.tagline}
        </p>
        <p
          className={cn(
            "mt-4 text-caption font-medium uppercase tracking-[0.08em]",
            isFeatured ? "text-[#0B0C0C]/70" : "text-white/45",
          )}
        >
          Hiring {company.openRoles} roles
        </p>
        <p className={cn("mt-1 text-caption", isFeatured ? "text-[#0B0C0C]/70" : "text-white/45")}>
          {company.district}
        </p>
      </div>
    </Link>
  );
}

export function Matching() {
  return (
    <section
      id="matching"
      data-surface="site-dark"
      className="relative overflow-hidden border-t border-white/10 bg-[#0B0C0C] py-20 text-white md:py-28"
    >
      <div className="pointer-events-none absolute -top-40 right-0 h-[36rem] w-[36rem] rounded-full bg-[#DE7C40]/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#DE7C40]/10 blur-[120px]" />
      <span
        aria-hidden
        className="hero-display pointer-events-none absolute -top-[0.3em] left-1/2 -translate-x-1/2 select-none text-[36rem] leading-none text-white/[0.03]"
      >
        V
      </span>

      <div className="site-container relative z-[2]">
        <Reveal className="mx-auto max-w-xl text-center">
          <span className="font-sans text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[#DE7C40]">
            Now Hiring
          </span>
          <h2 className="mt-4 font-sans text-[clamp(1.75rem,3.2vw,2.75rem)] font-medium leading-[1.1] tracking-tight text-white">
            Teams growing
            <br />
            <span className="text-white/65">right now.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-sm font-sans text-[1.0625rem] leading-[1.55] text-white/65">
            These companies are mass hiring across VAEL this cycle — Vael In to land in front of them first.
          </p>
          <Link
            to="/explore"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-[#DE7C40] px-5 font-sans text-body-sm font-medium text-[#0B0C0C] hover:bg-[#E89E6E]"
          >
            See who&apos;s hiring →
          </Link>
        </Reveal>
      </div>

      <div
        className="mt-16 w-full overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)" }}
      >
        <div className="card-marquee-track flex w-max items-center gap-6">
          {[...COMPANIES, ...COMPANIES].map((company, index) => (
            <CompanyCard key={`${company.id}-${index}`} company={company} />
          ))}
        </div>
      </div>
    </section>
  );
}
