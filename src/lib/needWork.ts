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
  /** Ticked on Review: a home project, not work subcontracted for a client. */
  homeProject: boolean;
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
  homeProject: false,
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
      homeProject: parsed.homeProject === true,
    };
  } catch {
    return EMPTY;
  }
}

/** Forget what was entered in the posting steps, once it has been published. */
export function clearNeedWork() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(KEY);
}

export function saveNeedWork(patch: Partial<NeedWork>) {
  const next = { ...readNeedWork(), ...patch };
  if (typeof sessionStorage === "undefined") return next;
  sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
