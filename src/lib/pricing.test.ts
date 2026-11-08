import { describe, expect, it } from "vitest";
import { BASIC, PRO_RATE, premiumPrice } from "./pricing";

const base = { lines: 0, files: 0, language: "Modern (JS, Python, PHP…)", type: "Script / utility", dependencies: 0, databases: false, tests: false, security: false, docs: false, urgency: "Standard" };

describe("plans", () => {
  it("Basic gives 3 trials of 5 lines", () => { expect(BASIC).toEqual({ trials: 3, maxLines: 5 }); });
  it("Pro is $6.99 per file", () => { expect(PRO_RATE).toBe(6.99); });
  it("Premium grows with size", () => { expect(premiumPrice({ ...base, lines: 1000 })).toBeGreaterThan(premiumPrice(base)); });
  it("Premium costs more for COBOL than modern code", () => {
    expect(premiumPrice({ ...base, language: "COBOL / RPG / PL/I" })).toBeGreaterThan(premiumPrice(base));
  });
});
