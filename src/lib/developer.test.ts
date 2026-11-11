import { describe, expect, it } from "vitest";
import { accountUpdateSchema, normalizePromo } from "./developer";

describe("developer account rules", () => {
  it("accepts the MCFAIC26 promotion regardless of casing and surrounding spaces", () => {
    expect(normalizePromo(" mcfaic26 ")).toBe("MCFAIC26");
  });
  it("restricts account membership updates to the three plans", () => {
    const account = { accountId: "507b32f1-2a3c-4158-a2a5-38b62cecdc7f", specialAccess: false, resetTrials: false };
    for (const tier of ["basic", "pro", "premium"]) expect(accountUpdateSchema.safeParse({ ...account, tier }).success).toBe(true);
    expect(accountUpdateSchema.safeParse({ ...account, tier: "developer" }).success).toBe(false);
  });
});