/**
 * Presentation-only live projects for the public website.
 * Not connected to homeowner accounts or the Contractor Exchange store.
 */

export type MarketingProjectIcon =
  | "plumbing"
  | "construction"
  | "doors"
  | "roofing"
  | "bathroom"
  | "electrical"
  | "painting";

export type MarketingProject = {
  id: string;
  category: string;
  icon: MarketingProjectIcon;
  name: string;
  posted: string;
  description: string;
  city: string;
  timing: string;
  budget: string;
  daysLeft: number;
  image: string;
};

export const MARKETING_PROJECTS: MarketingProject[] = [
  {
    id: "plumbing-davin",
    category: "Plumbing",
    icon: "plumbing",
    name: "Davin",
    posted: "Posted yesterday",
    description: "New bath tub and kitchen sink installation",
    city: "Jacksonville",
    timing: "In 1 to 3 months",
    budget: "$20,000 to $30,000",
    daysLeft: 6,
    image: "/projects/plumbing.jpg",
  },
  {
    id: "construction-william",
    category: "New Construction",
    icon: "construction",
    name: "William",
    posted: "Posted 3 days ago",
    description:
      "I would like to find an experienced GC for a residential home, 3 bedrooms, 2 1/2 baths and a double car garage.",
    city: "Jacksonville",
    timing: "In 1 to 3 months",
    budget: "Over $100,000",
    daysLeft: 4,
    image: "/projects/construction.jpg",
  },
  {
    id: "doors-tony",
    category: "Doors & Windows",
    icon: "doors",
    name: "Tony",
    posted: "Posted 3 days ago",
    description: "I need to replace my front door and the windows along the front of the house.",
    city: "Jacksonville",
    timing: "In 1 to 3 months",
    budget: "Under $10,000",
    daysLeft: 4,
    image: "/projects/doors.jpg",
  },
  {
    id: "roofing-maya",
    category: "Roofing",
    icon: "roofing",
    name: "Maya",
    posted: "Posted 2 days ago",
    description: "Shingles are lifting on the south side of a one-story home. Looking for a full replacement.",
    city: "Jacksonville",
    timing: "Within 30 days",
    budget: "$10,000 to $20,000",
    daysLeft: 5,
    image: "/projects/roofing.jpg",
  },
  {
    id: "bathroom-elena",
    category: "Bathroom",
    icon: "bathroom",
    name: "Elena",
    posted: "Posted 5 days ago",
    description: "Retile the primary bath, including the shower walls and the floor.",
    city: "Jacksonville",
    timing: "In 1 to 3 months",
    budget: "$20,000 to $30,000",
    daysLeft: 2,
    image: "/projects/bathroom.jpg",
  },
  {
    id: "electrical-chris",
    category: "Electrical",
    icon: "electrical",
    name: "Chris",
    posted: "Posted 4 days ago",
    description: "Add outlets in the living room and replace the panel in a 1970s ranch.",
    city: "Jacksonville",
    timing: "Within 30 days",
    budget: "$5,000 to $10,000",
    daysLeft: 3,
    image: "/projects/electrical.jpg",
  },
  {
    id: "painting-aisha",
    category: "Painting",
    icon: "painting",
    name: "Aisha",
    posted: "Posted 6 days ago",
    description: "Interior paint for the main floor, about 1,400 square feet, walls and trim.",
    city: "Jacksonville",
    timing: "In 1 to 3 months",
    budget: "Under $10,000",
    daysLeft: 1,
    image: "/projects/painting.jpg",
  },
];
