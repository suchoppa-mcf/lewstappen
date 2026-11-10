import { describe, expect, it } from "vitest";
import { basicLimitError, specialIsFree } from "./plans";

describe("free plans and Basic limits", () => {
  it("allows five lines but rejects six on Basic", () => {
    expect(basicLimitError("1\n2\n3\n4\n5", { tier: "basic", trials_used: 0 })).toBeNull();
    expect(basicLimitError("1\n2\n3\n4\n5\n6", { tier: "basic", trials_used: 0 })).not.toBeNull();
  });
  it("allows the third use but blocks the fourth", () => {
    expect(basicLimitError("code", { tier: "basic", trials_used: 2 })).toBeNull();
    expect(basicLimitError("code", { tier: "basic", trials_used: 3 })).not.toBeNull();
  });
  it("does not cap Pro or Premium", () => {
    for (const tier of ["pro", "premium"] as const)
      expect(basicLimitError("1\n2\n3\n4\n5\n6", { tier, trials_used: 3 })).toBeNull();
  });
  it("waives the charge only when the database special is active and free", () => {
    expect(specialIsFree({ is_active: true, all_plans_free: true })).toBe(true);
    expect(specialIsFree({ is_active: false, all_plans_free: true })).toBe(false);
    expect(specialIsFree({ is_active: true, all_plans_free: false })).toBe(false);
    expect(specialIsFree(null)).toBe(false);
  });
});