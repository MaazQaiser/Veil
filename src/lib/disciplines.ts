/** Disciplines offered in the minimum-information step (Go Visible and onboarding). */
export const DISCIPLINES: Record<string, string[]> = {
  "media-technology": ["Video Editing", "Design", "Software Development", "Photography", "Writing & Content"],
  construction: ["General Contracting", "Electrical", "Plumbing", "Carpentry", "Concrete & Masonry"],
  trucking: ["Long-Haul Driving", "Local Delivery", "Fleet Operations", "Dispatch"],
};
export const OTHER_DISCIPLINES = ["Operations", "Management", "Sales & Business Development", "Other"];

export function disciplinesFor(districtId: string): string[] {
  return DISCIPLINES[districtId] ?? OTHER_DISCIPLINES;
}

const GO_VISIBLE_KEY = "vael:go-visible";

export type GoVisibleInfo = { discipline: string; location: string; districtIds: string[] };

export function saveGoVisibleInfo(info: GoVisibleInfo) {
  try {
    sessionStorage.setItem(GO_VISIBLE_KEY, JSON.stringify(info));
  } catch {
    /* storage unavailable: onboarding asks again */
  }
}

export function readGoVisibleInfo(): GoVisibleInfo | null {
  try {
    const raw = sessionStorage.getItem(GO_VISIBLE_KEY);
    return raw ? (JSON.parse(raw) as GoVisibleInfo) : null;
  } catch {
    return null;
  }
}
