import type { VaelSide } from "./vaelStore";

/** Single source of truth for Vael In / Vael Out copy so both sides stay symmetric. */
export function vaelSideLabel(side: VaelSide) {
  return side === "in" ? "Vael In" : "Vael Out";
}

export function vaelSideVerb(side: VaelSide) {
  return side === "in" ? "available" : "looking to hire";
}

export function vaelSideCta(side: VaelSide) {
  return side === "in" ? "Vael In" : "Vael Out";
}

export function vaelSideStatusLabel(side: VaelSide) {
  return side === "in" ? "Vaeled In" : "Vaeled Out";
}

/** Switch accounts — Vael Out is a second sign-in, not a form on the current profile. */
export function vaelSideSignInHref(side: VaelSide) {
  return `/sign-in?intent=${side}`;
}

export function homeNetworkLede(side: VaelSide) {
  return side === "out"
    ? "Here's what's happening with people who match what you're hiring."
    : "Here's what's happening in your VAEL network.";
}

export function matchesDiscoverLede(side: VaelSide) {
  return side === "out"
    ? "Discover people who match what you're hiring for."
    : "Discover people who match your profile and availability.";
}

export function matchesRailLede(side: VaelSide) {
  return side === "out"
    ? "People VAEL has identified as a strong fit for what you're hiring."
    : "People VAEL has identified as a strong fit for you.";
}

export function matchesRailEmpty(side: VaelSide, visible: boolean) {
  if (!visible) return "Vael In or Vael Out to become visible to relevant matches.";
  return side === "out"
    ? "No matches yet. Check back once more availability opens in your district."
    : "No matches yet. Check back once more hiring opens in your district.";
}

export function matchesGoVisibleCta(side: VaelSide) {
  return side === "out" ? "Say what you need →" : "Set availability →";
}

export function handshakePageLede(side: VaelSide) {
  return side === "out"
    ? "Requests you send and requests you receive live here, next to your matches."
    : "Board matches and direct handshakes live here, side by side.";
}

export function handshakeWindowNote(side: VaelSide) {
  return side === "out"
    ? "Your free VAEL remains active for 24 hours. If a professional responds and you do not act before expiration, they will be released back to the Board. You may VAEL again and contact them later if they remain available."
    : "Your free VAEL remains active for 24 hours. If someone responds and you do not act before expiration, they will be released back to the Board. You may VAEL again and contact them later if they remain available.";
}

export function handshakeRequestsEmpty(side: VaelSide) {
  return side === "out"
    ? {
        title: "No requests yet.",
        description: "Request a handshake from a match to start one.",
        cta: "Browse matches",
      }
    : {
        title: "No requests yet.",
        description: "Accept a VAEL on the board to start one.",
        cta: "Browse the board",
      };
}

export function handshakeIncomingLede(side: VaelSide) {
  return side === "out"
    ? "Professionals who want to connect with you right now."
    : "People who want to connect with you right now.";
}

export function communityComposerPlaceholder(side: VaelSide) {
  return side === "out"
    ? "Share a hiring update, opportunity, or question..."
    : "Share an update, opportunity, highlight, or question...";
}

export function communityComposerDefaultKind(side: VaelSide) {
  return side === "out" ? "opportunity" : "update";
}

export function ownVisibilityChip(side: VaelSide | null) {
  if (side === "in") return "Available";
  if (side === "out") return "Hiring";
  return "Not visible";
}
