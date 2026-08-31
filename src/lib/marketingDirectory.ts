/**
 * Presentation-only directory for the public website.
 * Not connected to vaelStore sample personas or localStorage.
 */

export type AvailabilityWindow = "today" | "this-week" | "next-cycle";

export type DirectoryPerson = {
  id: string;
  name: string;
  role: string;
  match: number;
  district: string;
  location: string;
  availability: AvailabilityWindow;
  category: string;
  skills: string[];
  verified: boolean;
  photo: string;
};

export const AVAILABILITY_LABEL: Record<AvailabilityWindow, string> = {
  today: "Available today",
  "this-week": "Available this week",
  "next-cycle": "Available next cycle",
};

export const MARKETING_DIRECTORY: DirectoryPerson[] = [
  {
    id: "sarah-mitchell",
    name: "Sarah Mitchell",
    role: "Creative Director",
    match: 92,
    district: "Media & Technology",
    location: "New York, NY",
    availability: "today",
    category: "Design",
    skills: ["Brand Strategy", "Figma", "UX Design"],
    verified: true,
    photo: "/people/p01.jpg",
  },
  {
    id: "marcus-chen",
    name: "Marcus Chen",
    role: "Product Designer",
    match: 88,
    district: "Media & Technology",
    location: "Austin, TX",
    availability: "today",
    category: "Design",
    skills: ["Design Systems", "Prototyping", "Figma"],
    verified: true,
    photo: "/people/p02.jpg",
  },
  {
    id: "amara-okonkwo",
    name: "Amara Okonkwo",
    role: "Project Manager",
    match: 84,
    district: "Construction",
    location: "Atlanta, GA",
    availability: "this-week",
    category: "Operations",
    skills: ["Scheduling", "Site Coordination"],
    verified: true,
    photo: "/people/p03.jpg",
  },
  {
    id: "elena-voss",
    name: "Elena Voss",
    role: "Brand Strategist",
    match: 81,
    district: "Commercial",
    location: "Chicago, IL",
    availability: "today",
    category: "Strategy",
    skills: ["Brand", "Art Direction"],
    verified: false,
    photo: "/people/p04.jpg",
  },
  {
    id: "james-park",
    name: "James Park",
    role: "Dispatcher",
    match: 78,
    district: "Trucking",
    location: "Dallas, TX",
    availability: "this-week",
    category: "Logistics",
    skills: ["Routing", "Capacity"],
    verified: true,
    photo: "/people/p05.jpg",
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    role: "Motion Designer",
    match: 74,
    district: "Media & Technology",
    location: "Portland, OR",
    availability: "next-cycle",
    category: "Motion",
    skills: ["After Effects", "Cinema 4D"],
    verified: false,
    photo: "/people/p06.jpg",
  },
  {
    id: "david-ruiz",
    name: "David Ruiz",
    role: "Home Services Lead",
    match: 71,
    district: "Residential",
    location: "Miami, FL",
    availability: "today",
    category: "Trades",
    skills: ["HVAC", "Electrical"],
    verified: true,
    photo: "/people/p07.jpg",
  },
  {
    id: "hannah-cole",
    name: "Hannah Cole",
    role: "Operations Lead",
    match: 68,
    district: "Commercial",
    location: "Denver, CO",
    availability: "this-week",
    category: "Operations",
    skills: ["Process", "Staffing"],
    verified: false,
    photo: "/people/p08.jpg",
  },
  {
    id: "malik-johnson",
    name: "Malik Johnson",
    role: "Superintendent",
    match: 64,
    district: "Construction",
    location: "Houston, TX",
    availability: "today",
    category: "Trades",
    skills: ["Safety", "Trades"],
    verified: true,
    photo: "/people/p09.jpg",
  },
  {
    id: "sofia-alvarez",
    name: "Sofia Alvarez",
    role: "Editor",
    match: 59,
    district: "Media & Technology",
    location: "Los Angeles, CA",
    availability: "next-cycle",
    category: "Editorial",
    skills: ["Documentary", "Color"],
    verified: false,
    photo: "/people/p10.jpg",
  },
];

export const DISTRICT_CARDS = [
  {
    id: "media-technology",
    name: "Media & Technology",
    blurb: "Designers, developers, studios & creative professionals.",
    image: "/districts/media-technology.jpg",
    route: "/media-technology",
  },
  {
    id: "construction",
    name: "Construction",
    blurb: "Contractors, trades & construction professionals.",
    image: "/districts/construction.jpg",
    route: "/districts/contractor",
  },
  {
    id: "trucking",
    name: "Trucking",
    blurb: "Loads, routes & available capacity.",
    image: "/districts/trucking.jpg",
    route: "/districts/trucking",
  },
  {
    id: "residential",
    name: "Residential",
    blurb: "Homeowners looking for available professionals.",
    image: "/districts/residential.jpg",
    route: "/districts/residential",
  },
  {
    id: "commercial",
    name: "Commercial",
    blurb: "Businesses looking for available talent.",
    image: "/districts/commercial.jpg",
    route: "/districts/commercial",
  },
] as const;

export function uniqueValues(key: "district" | "location" | "category" | "availability") {
  return [...new Set(MARKETING_DIRECTORY.map((person) => person[key]))];
}

export function uniqueSkills() {
  return [...new Set(MARKETING_DIRECTORY.flatMap((person) => person.skills))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function matchBand(percent: number) {
  if (percent >= 80) return "80+";
  if (percent >= 60) return "60+";
  return "Below 60";
}
