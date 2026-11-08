export const BASIC = { trials: 3, maxLines: 5 };
export const PRO_RATE = 6.99; // per file, per hour

export const LANG_FACTOR: Record<string, number> = {
  "Modern (JS, Python, PHP…)": 1, "Java / C#": 1.2, "BASIC / Pascal": 1.4, "FORTRAN": 1.6, "COBOL / RPG / PL/I": 1.9, "Assembly": 2.3,
};
export const TYPE_FACTOR: Record<string, number> = {
  "Script / utility": 1, "Web app": 1.3, "Business / batch system": 1.5, "Scientific / numeric": 1.4, "Embedded / low-level": 1.8,
};
export const URGENCY_FACTOR: Record<string, number> = { Standard: 1, "Fast (48h)": 1.25, "Rush (24h)": 1.5 };

export type PremiumInput = {
  lines: number; files: number; language: string; type: string;
  dependencies: number; databases: boolean; tests: boolean; security: boolean; docs: boolean; urgency: string;
};

/** One-time Premium price per project, in dollars (rounded to cents). */
export function premiumPrice(i: PremiumInput): number {
  const size = 49 + Math.max(0, i.lines) * 0.02 + Math.max(0, i.files) * 1.5 + Math.max(0, i.dependencies) * 3;
  let mult = (LANG_FACTOR[i.language] ?? 1) * (TYPE_FACTOR[i.type] ?? 1) * (URGENCY_FACTOR[i.urgency] ?? 1);
  if (i.databases) mult *= 1.2;
  if (i.tests) mult *= 1.15;
  if (i.security) mult *= 1.1;
  if (i.docs) mult *= 1.05;
  return Math.round(size * mult * 100) / 100;
}
