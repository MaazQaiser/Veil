const KEY = "vael_need_work_v1";

export type NeedWork = {
  categories: string[];
  description: string;
  photos: string[];
  video: string;
  city: string;
  postalCode: string;
  timing: string;
  budget: string;
  saveEmail: string;
  savePhone: string;
};

const EMPTY: NeedWork = {
  categories: [],
  description: "",
  photos: [],
  video: "",
  city: "",
  postalCode: "",
  timing: "",
  budget: "",
  saveEmail: "",
  savePhone: "",
};

export function readNeedWork(): NeedWork {
  if (typeof sessionStorage === "undefined") return EMPTY;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<NeedWork>;
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories.filter((item) => typeof item === "string") : [],
      description: typeof parsed.description === "string" ? parsed.description : "",
      photos: Array.isArray(parsed.photos) ? parsed.photos.filter((item) => typeof item === "string").slice(0, 10) : [],
      video: typeof parsed.video === "string" ? parsed.video : "",
      city: typeof parsed.city === "string" ? parsed.city : "",
      postalCode: typeof parsed.postalCode === "string" ? parsed.postalCode : "",
      timing: typeof parsed.timing === "string" ? parsed.timing : "",
      budget: typeof parsed.budget === "string" ? parsed.budget : "",
      saveEmail: typeof parsed.saveEmail === "string" ? parsed.saveEmail : "",
      savePhone: typeof parsed.savePhone === "string" ? parsed.savePhone : "",
    };
  } catch {
    return EMPTY;
  }
}

export function saveNeedWork(patch: Partial<NeedWork>) {
  const next = { ...readNeedWork(), ...patch };
  if (typeof sessionStorage === "undefined") return next;
  sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
