import { describe, expect, it } from "vitest";
import {
  brand,
  contrastRatio,
  matchBand,
  semanticTokenNames,
  typeRoles,
} from "./tokens";

describe("VAEL tokens", () => {
  it("keeps the editorial Inter palette", () => {
    expect(brand.background).toBe("#FDFCF9");
    expect(brand.surface).toBe("#FFFFFF");
    expect(brand.ink).toBe("#111111");
    expect(brand.accent).toBe("#66758A");
    expect(brand.success).toBe("#2F6B4F");
  });

  it("exports the semantic token set without a large extra palette", () => {
    expect(semanticTokenNames.length).toBeGreaterThanOrEqual(18);
    expect(typeRoles).toContain("display");
    expect(typeRoles).toContain("label");
  });

  it("uses the protected match bands", () => {
    expect(matchBand(84)).toBe("strong");
    expect(matchBand(60)).toBe("good");
    expect(matchBand(41)).toBe("possible");
    expect(matchBand(39)).toBe("low");
  });

  it("meets AA contrast for body and secondary text on paper", () => {
    expect(contrastRatio(brand.ink, brand.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(brand.textSecondary, brand.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(brand.surface, brand.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps muted captions readable without using decorative gold", () => {
    expect(contrastRatio(brand.textMuted, brand.background)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(brand.accent, brand.background)).toBeGreaterThanOrEqual(4.5);
  });
});
