import type { DistrictLotStatus } from "@/components/vael/status";

export type CityDistrict = {
  id: string;
  slug: string;
  name: string;
  registryName?: string;
  status: DistrictLotStatus;
  route: string;
  summary: string;
  /** One plain line for a Provider choosing where to work. `summary` stays the build note. */
  blurb: string;
  /** Shown in the City district switcher (PRD Rooms). */
  primary: boolean;
};

/**
 * Map of lots. Primary five match the City Shell IA.
 * Construction keeps the existing `/districts/contractor` slug (PL-020).
 * Extra registry lots from the original product are listed but not in the switcher.
 */
export const districts: CityDistrict[] = [
  {
    id: "media-technology",
    slug: "media-technology",
    name: "Media & Technology",
    status: "live",
    route: "/media-technology",
    summary: "Live Room. Board, Veil, and Handshake for media and technology availability.",
    blurb: "Technology, design, media, and digital professionals.",
    primary: true,
  },
  {
    id: "construction",
    slug: "contractor",
    name: "Construction",
    registryName: "Contractor",
    status: "live",
    route: "/districts/contractor",
    summary: "Live Room. Available construction work and construction need. Own fields and a sibling matching engine — not Media & Technology scoring. URL slug remains contractor.",
    blurb: "Trades, site work, and construction contracting.",
    primary: true,
  },
  {
    id: "trucking",
    slug: "trucking",
    name: "Trucking",
    status: "live",
    route: "/districts/trucking",
    summary: "Live Room. Available capacity and load need. Own fields and a sibling matching engine — not Media & Technology or Construction scoring.",
    blurb: "Carriers, drivers, and freight capacity.",
    primary: true,
  },
  {
    id: "residential",
    slug: "residential",
    name: "Residential",
    status: "live",
    route: "/districts/residential",
    summary: "Live Room. Homeowner need → available people. Own fields and a sibling matching engine. Not Real Estate, not Construction Exchange.",
    blurb: "Home services for homeowner projects.",
    primary: true,
  },
  {
    id: "commercial",
    slug: "commercial",
    name: "Commercial",
    status: "live",
    route: "/districts/commercial",
    summary: "Live Room. Business need → company/provider capability. Own fields and a sibling matching engine. Not Residential, not Construction Exchange.",
    blurb: "Business services and commercial providers.",
    primary: true,
  },
  {
    id: "nursing-healthcare",
    slug: "nursing-healthcare",
    name: "Nursing / Healthcare",
    status: "soon",
    route: "/districts/nursing-healthcare",
    summary: "Coming Soon. Out of PRD scope unless a Change Order.",
    blurb: "Clinical and care professionals.",
    primary: false,
  },
  {
    id: "equipment",
    slug: "equipment",
    name: "Equipment",
    status: "early",
    route: "/districts/equipment",
    summary: "Early Access placeholder. Out of PRD scope unless a Change Order.",
    blurb: "Equipment supply, rental, and operators.",
    primary: false,
  },
  {
    id: "government",
    slug: "government",
    name: "Government",
    status: "early",
    route: "/districts/government",
    summary: "Early Access placeholder. Out of PRD scope unless a Change Order.",
    blurb: "Public sector work and contracting.",
    primary: false,
  },
  {
    id: "real-estate",
    slug: "real-estate",
    name: "Real Estate",
    status: "early",
    route: "/districts/real-estate",
    summary: "Early Access placeholder. This is not the Residential homeowner flow.",
    blurb: "Property professionals. Separate from the Residential Room.",
    primary: false,
  },
  {
    id: "legal-finance",
    slug: "legal-finance",
    name: "Legal & Finance",
    status: "early",
    route: "/districts/legal-finance",
    summary: "Early Access placeholder. Out of PRD scope unless a Change Order.",
    blurb: "Legal, accounting, and financial services.",
    primary: false,
  },
];

export const primaryDistricts = districts.filter((d) => d.primary);

export const CITY_CONTEXT = {
  id: "city",
  name: "The City",
  route: "/",
} as const;

export function districtBySlug(slug: string | undefined): CityDistrict | undefined {
  if (!slug) return undefined;
  return districts.find((d) => d.slug === slug || d.id === slug);
}

export function districtFromPath(pathname: string): CityDistrict | undefined {
  if (pathname === "/media-technology" || pathname.startsWith("/media-technology/")) {
    return districts.find((d) => d.id === "media-technology");
  }
  const match = pathname.match(/^\/districts\/([^/]+)/);
  if (match) return districtBySlug(match[1]);
  return undefined;
}

export function isDistrictEnterable(district: CityDistrict): boolean {
  return district.status === "live";
}
