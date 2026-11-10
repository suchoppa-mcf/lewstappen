import { BASIC } from "./pricing";

export type PlanTier = "basic" | "pro" | "premium";
export type PlanState = { tier: PlanTier; trials_used: number };
export const DEFAULT_PLAN: PlanState = { tier: "basic", trials_used: 0 };
export function basicLimitError(code: string, plan: PlanState): string | null {
  if (plan.tier !== "basic") return null;
  if (code.split("\n").filter((line) => line.trim()).length > BASIC.maxLines)
    return "Basic allows up to 5 non-blank lines per update. Choose Pro or Premium for more.";
  if (plan.trials_used >= BASIC.trials)
    return "All 3 Basic trials have been used. Choose Pro or Premium to continue.";
  return null;
}
export function specialIsFree(settings: { is_active: boolean; all_plans_free: boolean } | null | undefined) {
  return Boolean(settings?.is_active && settings.all_plans_free);
}