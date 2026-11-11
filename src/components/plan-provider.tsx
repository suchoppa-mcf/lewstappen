import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getAccountAccess } from "@/lib/developer.functions";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PLAN, type PlanState } from "@/lib/plans";

const AccountContext = createContext<{ user: User | null; ready: boolean; plan: PlanState; planReady: boolean; developer: boolean; specialAccess: boolean; refreshAccess: () => Promise<unknown>; refreshPlan: () => Promise<unknown> }>({
  user: null, ready: false, plan: DEFAULT_PLAN, planReady: false, developer: false, specialAccess: false, refreshAccess: async () => undefined, refreshPlan: async () => undefined,
});

export function PlanProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const fetchAccess = useServerFn(getAccountAccess);
  const access = useQuery({ queryKey: ["account-access", user?.id], enabled: ready && Boolean(user), queryFn: () => fetchAccess() });
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
      setUser(session?.user ?? null); setReady(true);
      if (event === "INITIAL_SESSION") return;
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
      else { queryClient.clear(); }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient, router]);
  const query = useQuery({
    queryKey: ["account-plan", user?.id], enabled: ready && Boolean(user),
    queryFn: async (): Promise<PlanState> => {
      if (!user) return DEFAULT_PLAN;
      const { data, error } = await supabase.from("user_plans").select("tier,trials_used").eq("user_id", user.id).maybeSingle();
      if (error) throw new Error("Couldn't load your plan. Please reload.");
      if (!data) return DEFAULT_PLAN;
      const tier = data.tier;
      if (tier !== "basic" && tier !== "pro" && tier !== "premium") return DEFAULT_PLAN;
      return { tier, trials_used: data.trials_used };
    },
  });
  return <AccountContext.Provider value={{ user, ready, plan: query.data ?? DEFAULT_PLAN, planReady: ready && (!user || query.isSuccess), developer: Boolean(user && access.data?.developer), specialAccess: Boolean(user && access.data?.special), refreshAccess: access.refetch, refreshPlan: query.refetch }}>{children}</AccountContext.Provider>;
}
export const useAccount = () => useContext(AccountContext);