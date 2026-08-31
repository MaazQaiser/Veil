import { describe, expect, it } from "vitest";
import { hasPublicDocuments, listedCount } from "./profileTrust";
import {
  DEMO_PRICING_LABEL,
  VISIBILITY_PLANS,
  planById,
  visibilityKindFromListing,
} from "./visibilityPlans";

describe("visibility plans catalog", () => {
  it("keeps Free Daily as the current 24-hour plan and Extended as a non-purchasable demo", () => {
    const daily = planById("daily");
    const extended = planById("extended");
    expect(daily?.status).toBe("current");
    expect(daily?.duration).toContain("24");
    expect(extended?.status).toBe("demo");
    expect(extended?.purchasable).toBe(false);
    expect(VISIBILITY_PLANS.every((item) => item.purchasable === false)).toBe(true);
    expect(DEMO_PRICING_LABEL).toBe("DEMO PRICING — NOT YET AVAILABLE FOR PURCHASE");
  });

  it("maps listing clocks without inventing a new expiry model", () => {
    expect(visibilityKindFromListing(undefined)).toBe("none");
    expect(
      visibilityKindFromListing({ side: "in", expiresAt: new Date(Date.now() - 1000).toISOString() }),
    ).toBe("expired");
    expect(
      visibilityKindFromListing({ side: "out", expiresAt: new Date(Date.now() + 20 * 3600000).toISOString() }),
    ).toBe("out");
  });
});

describe("profile fill count", () => {
  it("counts listed details without producing a trust score", () => {
    expect(listedCount(["Ada", "", [], "Atlanta"]).count).toBe(2);
    expect(listedCount(["Ada", "Editor", "Bio"]).complete).toBe(true);
  });

  it("does not treat private documents as listed on Match Detail", () => {
    expect(hasPublicDocuments([{ publicFlag: false }])).toBe(false);
    expect(hasPublicDocuments([{ publicFlag: true }])).toBe(true);
  });
});
