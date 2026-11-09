import { describe, expect, it } from "vitest";
import { analyzeProject } from "./analyze";

describe("automatic project pricing", () => {
  it("detects COBOL batch with database, no tests", () => {
    const a = analyzeProject([{ name: "PAY.cbl", text: "IDENTIFICATION DIVISION.\nPROCEDURE DIVISION.\nEXEC SQL SELECT X FROM T END-EXEC.\n" }]);
    expect(a.language).toBe("COBOL / RPG / PL/I");
    expect(a.type).toBe("Business / batch system");
    expect(a.databases).toBe(true);
    expect(a.tests).toBe(true);
    expect(a.files).toBe(1);
    expect(a.lines).toBe(3);
  });
  it("skips tests extra when project has tests and flags PHP risks", () => {
    const a = analyzeProject([{ name: "index.php", text: "<?php echo $_GET['x'];" }, { name: "index.test.php", text: "ok" }, { name: "README.md", text: "hi" }]);
    expect(a.tests).toBe(false);
    expect(a.security).toBe(true);
    expect(a.docs).toBe(false);
  });
});
