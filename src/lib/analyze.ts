import type { PremiumInput } from "./pricing";

export type SourceFile = { name: string; text: string };
export type Analysis = PremiumInput & { reasons: string[] };

const EXT_LANG: [RegExp, string][] = [
  [/\.(asm|s|mac|a51)$/i, "Assembly"],
  [/\.(cbl|cob|cpy|rpg|rpgle|pli|pl1)$/i, "COBOL / RPG / PL/I"],
  [/\.(f|for|f77|f90|f95|ftn)$/i, "FORTRAN"],
  [/\.(bas|vb|vbs|frm|pas|pp|dpr)$/i, "BASIC / Pascal"],
  [/\.(java|cs)$/i, "Java / C#"],
  [/\.(js|jsx|ts|tsx|py|php|rb|go|c|h|cpp|lisp|lsp|apl|ada|adb|alg|sh|pl)$/i, "Modern (JS, Python, PHP…)"],
];
const CODE = /\.(asm|s|mac|a51|cbl|cob|cpy|rpg|rpgle|pli|pl1|f|for|f77|f90|f95|ftn|bas|vb|vbs|frm|pas|pp|dpr|java|cs|js|jsx|ts|tsx|py|php|rb|go|c|h|cpp|lisp|lsp|apl|ada|adb|alg|sh|pl|sql|html?|jcl)$/i;

export function analyzeProject(all: SourceFile[]): Analysis {
  const files = all.filter((f) => CODE.test(f.name) && !/(^|\/)(node_modules|vendor|\.git)\//.test(f.name));
  const text = files.map((f) => f.text).join("\n");
  const lines = files.reduce((n, f) => n + f.text.split("\n").filter((l) => l.trim()).length, 0);
  const reasons: string[] = [];

  // Language = the one with the most lines (legacy wins ties)
  const tally: Record<string, number> = {};
  for (const f of files) {
    const lang = EXT_LANG.find(([re]) => re.test(f.name))?.[1];
    if (lang) tally[lang] = (tally[lang] ?? 0) + f.text.split("\n").length;
  }
  const language = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Modern (JS, Python, PHP…)";

  // Dependencies from manifests and imports
  const deps = new Set<string>();
  for (const f of all) {
    if (/package\.json$/.test(f.name)) { try { const j = JSON.parse(f.text); Object.keys({ ...j.dependencies, ...j.devDependencies }).forEach((d) => deps.add(d)); } catch { /* ignore */ } }
    if (/requirements\.txt$/.test(f.name)) f.text.split("\n").map((l) => l.split(/[=<>~ ]/)[0]!.trim()).filter(Boolean).forEach((d) => deps.add(d));
    if (/composer\.json$/.test(f.name)) { try { Object.keys(JSON.parse(f.text).require ?? {}).forEach((d) => deps.add(d)); } catch { /* ignore */ } }
  }
  for (const m of text.matchAll(/^\s*(?:import\s+([\w.]+)|from\s+([\w.]+)\s+import|COPY\s+([\w-]+)|USE\s+([\w]+))/gim)) deps.add((m[1] || m[2] || m[3] || m[4])!.split(".")[0]!);
  const dependencies = Math.min(deps.size, 200);

  const databases = /\b(EXEC\s+SQL|SELECT\s+.+\s+FROM|INSERT\s+INTO|mysql_|mysqli|PDO|sqlite|psycopg|jdbc|mongoose|prisma|VSAM|DB2|IMS)\b/i.test(text);
  const hasTests = all.some((f) => /(test|spec)/i.test(f.name));
  const security = /\b(eval\(|exec\(|mysql_query|\$_GET|\$_POST|md5\(|password\s*=|innerHTML|system\(|strcpy|gets\()/i.test(text);
  const docs = !all.some((f) => /readme/i.test(f.name));

  let type = "Script / utility";
  if (language === "Assembly" || /\b(interrupt|volatile|register|#include\s*<avr|MOV\s+[A-Z]{2},)/i.test(text)) type = "Embedded / low-level";
  else if (/\b(IDENTIFICATION\s+DIVISION|JCL|//\s*EXEC|FILE-CONTROL)\b/i.test(text) || language === "COBOL / RPG / PL/I") type = "Business / batch system";
  else if (/<html|\$_(GET|POST)|express\(|flask|django|jquery|\$\(document\)/i.test(text)) type = "Web app";
  else if (language === "FORTRAN" || /\b(numpy|DIMENSION|REAL\*8|DOUBLE PRECISION|matrix)\b/i.test(text)) type = "Scientific / numeric";

  reasons.push(`${files.length} code file${files.length === 1 ? "" : "s"}, ${lines.toLocaleString()} lines`);
  reasons.push(`Mostly ${language}`, `Looks like: ${type}`, `${dependencies} outside librar${dependencies === 1 ? "y" : "ies"}`);
  if (databases) reasons.push("Uses a database");
  reasons.push(hasTests ? "Already has tests" : "No tests found — we'll write them");
  if (security) reasons.push("Risky code patterns found — deep security review added");
  if (docs) reasons.push("No README — we'll write documentation");

  return { lines, files: files.length, language, type, dependencies, databases, tests: !hasTests, security, docs, urgency: "Standard", reasons };
}

export async function readUploads(list: FileList | File[]): Promise<SourceFile[]> {
  const out: SourceFile[] = [];
  for (const f of Array.from(list)) {
    if (/\.zip$/i.test(f.name)) {
      const JSZip = (await import("jszip")).default;
      const z = await JSZip.loadAsync(f);
      for (const e of Object.values(z.files)) if (!e.dir && e.name.length < 300) out.push({ name: e.name, text: await e.async("string") });
    } else out.push({ name: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name, text: await f.text() });
  }
  return out;
}
