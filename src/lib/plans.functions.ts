import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const getSpecials = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Pricing settings are unavailable.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client.from("pricing_settings").select("all_plans_free,special_tag,promo_description,is_active").eq("id", "specials").maybeSingle();
  if (error) throw new Error("Pricing settings are unavailable. Please try again.");
  return data;
});

export const activatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ tier: z.enum(["basic", "pro", "premium"]) }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("activate_free_plan", { selected_tier: data.tier });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });