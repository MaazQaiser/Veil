/** Homeowner-facing routes. Copy and URLs never name districts or Residential mode. */

export const NEED_PATH = "/need";
export const NEED_HOME_PATH = "/need/home";
export const NEED_DESCRIBE_PATH = "/need/describe";
export const NEED_MEDIA_PATH = "/need/media";
export const NEED_SAVE_PATH = "/need/save";
export const NEED_LOCATION_PATH = "/need/location";
export const NEED_TIMING_PATH = "/need/timing";
export const NEED_BUDGET_PATH = "/need/budget";
export const NEED_ACCOUNT_PATH = "/need/account";
export const NEED_CONFIRM_PATH = "/need/confirm";
export const NEED_CONTINUE_PATH = "/need/continue";
export const NEED_VERIFY_PATH = "/need/verify";
export const NEED_PUBLISH_PATH = "/need/publish";
export const NEED_REVIEW_PATH = "/need/review";
export const NEED_PUBLISHED_PATH = "/need/published";

export function publishedProjectHref(projectId: string) {
  return `${NEED_PUBLISHED_PATH}/${projectId}`;
}

/** Edit from review returns here instead of walking the rest of the flow. */
export function needContinueTarget(fallback: string, search: string) {
  return new URLSearchParams(search).get("return") === "review" ? NEED_REVIEW_PATH : fallback;
}
export const NEED_PROJECT_PATH = "/need/project";
export const CONTRACTOR_HOME_PATH = NEED_HOME_PATH;
export const PROJECTS_PATH = "/districts/contractor/projects";
export const CONTRACTOR_RESIDENTIAL_PATH = "/districts/contractor/residential";
export const CONTRACTOR_OPPS_PATH = "/districts/contractor/opportunities";
/** The top-level Opportunity entry — Create or Avail — not nested inside Contractor Exchange. */
export const OPPORTUNITY_PATH = "/opportunities";
export const CONTRACTOR_VAELANCE_SETUP_PATH = "/districts/contractor/vaelance";
export const CONTRACTOR_BUSINESS_PATH = "/districts/contractor/vael?side=out";

export function projectHref(projectId: string) {
  return `${PROJECTS_PATH}/${projectId}`;
}

export function projectHandshakeHref(projectId: string, connectionId: string) {
  return `${PROJECTS_PATH}/${projectId}/handshake/${connectionId}`;
}

export function opportunityHref(projectId: string) {
  return `${CONTRACTOR_OPPS_PATH}/${projectId}`;
}

export function vaelanceHref(handle: string) {
  return `/vaelance/${handle}`;
}

export function vaelanceCompareHref(a: string, b: string) {
  return `/vaelance/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`;
}

export function isHomeownerPath(pathname: string) {
  if (pathname === NEED_PATH || pathname.startsWith(`${NEED_PATH}/`)) return true;
  if (pathname === "/vaelance" || pathname.startsWith("/vaelance/")) return true;
  return false;
}
