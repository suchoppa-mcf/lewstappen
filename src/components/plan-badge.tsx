import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { useAccount } from "./plan-provider";
import { BASIC } from "@/lib/pricing";

export function PlanBadge() {
  const { plan, planReady } = useAccount();
  return <Link to="/pricing" aria-label="Current plan" className="flex min-h-9 items-center justify-center gap-2 rounded-md bg-accent px-3 py-1 text-center text-xs font-medium text-accent-foreground sm:text-sm">
    <Crown className="h-4 w-4 shrink-0" />
    <span>{!planReady ? "Loading plan…" : `${plan.tier[0]?.toUpperCase()}${plan.tier.slice(1)} Plan`}
      {planReady && plan.tier === "basic" && <span className="block text-xs sm:inline"> · {Math.max(0, BASIC.trials - plan.trials_used)}/{BASIC.trials} trials left</span>}
    </span>
  </Link>;
}