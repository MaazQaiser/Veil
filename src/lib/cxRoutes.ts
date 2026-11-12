/** Homeowner-facing routes. Copy and URLs never name districts or Residential mode. */

export const NEED_PATH = "/need";
export const NEED_HOME_PATH = "/need/home";
export const NEED_SAVE_PATH = "/need/save";
export const NEED_LOCATION_PATH = "/need/location";
export const NEED_REVIEW_PATH = "/need/review";

/** Edit from review returns here instead of walking the rest of the flow. */
export function needContinueTarget(fallback: string, search: string) {
  return new URLSearchParams(search).get("return") === "review" ? NEED_REVIEW_PATH : fallback;
}
export const CONTRACTOR_HOME_PATH = NEED_HOME_PATH;
export const PROJECTS_PATH = "/districts/contractor/projects";
export const CONTRACTOR_RESIDENTIAL_PATH = "/districts/contractor/residential";
export const CONTRACTOR_OPPS_PATH = "/districts/contractor/opportunities";
/** The top-level Opportunity entry — Create or Avail — not nested inside Contractor Exchange. */
export const OPPORTUNITY_PATH = "/opportunities";
/** Where contractors browse, and where posters manage what they posted. */
export const BROWSE_OPPORTUNITIES_PATH = "/opportunities";
export const MY_OPPORTUNITIES_PATH = "/opportunities?tab=mine";
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

/** Go Visible is where the website starts an opportunity. */
export const GO_VISIBLE_PATH = "/go-visible";

/**
 * Posting an opportunity from either dashboard runs the same flow as the website: straight into
 * "Is this for your home or your business?", with no extra district step first.
 */
export function opportunityStart(_intent: "create" | "avail") {
  return { to: NEED_PATH, state: undefined };
}

/** Where each dashboard keeps its opportunities. Out posts them, In responds to them. */
export function opportunitiesHomeFor(side: "in" | "out") {
  return side === "out" ? `${OPPORTUNITY_PATH}?tab=mine` : `${OPPORTUNITY_PATH}?tab=browse`;
}
