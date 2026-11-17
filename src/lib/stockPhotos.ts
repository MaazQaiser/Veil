/**
 * Stand-in photos for opportunities that have none, so cards and pages look full for the demo.
 * `exact` photos match the trade. The others are a related interior shown blurred, so nobody
 * mistakes them for the homeowner's own photo.
 */
export type StockPhoto = { src: string; exact: boolean };

const BY_CATEGORY: Record<string, StockPhoto> = {
  Plumbing: { src: "/projects/plumbing.jpg", exact: true },
  "New Construction": { src: "/projects/construction.jpg", exact: true },
  Construction: { src: "/projects/construction.jpg", exact: true },
  "Doors & Windows": { src: "/projects/doors.jpg", exact: true },
  Roofing: { src: "/projects/roofing.jpg", exact: true },
  Bathroom: { src: "/projects/bathroom.jpg", exact: true },
  Electrical: { src: "/projects/electrical.jpg", exact: true },
  Painting: { src: "/projects/painting.jpg", exact: true },
  // No kitchen photo on hand yet: a blurred interior stands in.
  Kitchen: { src: "/projects/bathroom.jpg", exact: false },
};

export function stockPhoto(category: string): StockPhoto {
  return BY_CATEGORY[category] ?? { src: "/projects/construction.jpg", exact: false };
}
