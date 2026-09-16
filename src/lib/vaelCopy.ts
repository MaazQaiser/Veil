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
