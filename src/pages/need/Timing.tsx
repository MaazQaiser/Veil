export const NEED_START_OPTIONS = ["ASAP", "Within 30 days", "1–3 months", "Just planning"] as const;

export type NeedStart = (typeof NEED_START_OPTIONS)[number];
