import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { accountUpdateSchema, directorySchema, normalizePromo } from "./developer";

export const getAccountAccess = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [role, special] = await Promise.all([context.supabase.rpc("is_developer"), context.supabase.rpc("has_special_eligibility")]);
  if (role.error || special.error) throw new Error("Couldn't load account access.");
  return { developer: role.data, special: special.data };
});
export const redeemPromotion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ code: z.string().min(1).max(100) })).handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("redeem_promo", { entered_code: normalizePromo(data.code) });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });

export const getDeveloperDashboard = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const role = await context.supabase.rpc("is_developer");
  if (role.error || !role.data) throw new Error("Developer access required.");
  const [directory, promos, whitelist, settings] = await Promise.all([
    context.supabase.rpc("developer_overview"), context.supabase.from("promo_codes").select("*").order("created_at"),
    context.supabase.from("special_access_whitelist").select("*").order("email"),
    context.supabase.from("pricing_settings").select("*").eq("id", "specials").single(),
  ]);
  if (directory.error || promos.error || whitelist.error || settings.error) throw new Error("Couldn't load developer data.");
  return { ...directorySchema.parse(directory.data), promos: promos.data, whitelist: whitelist.data, settings: settings.data };
});
export const updateDeveloperAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(accountUpdateSchema).handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("developer_update_account", { account_id: data.accountId, selected_tier: data.tier, special_access: data.specialAccess, reset_trials: data.resetTrials });
    if (result.error) throw new Error(result.error.message);
    return true;
  });
const managementSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("settings"), tag: z.string().min(1).max(100), description: z.string().max(500), active: z.boolean(), allFree: z.boolean() }),
  z.object({ kind: z.literal("whitelist"), email: z.string().email(), remove: z.boolean() }),
  z.object({ kind: z.literal("promo"), code: z.string().min(1).max(100), active: z.boolean(), expires: z.string().datetime().nullable(), maxUses: z.number().int().positive().nullable() }),
]);
export const manageDeveloperSpecials = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(managementSchema).handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("is_developer");
    if (role.error || !role.data) throw new Error("Developer access required.");
    let error;
    if (data.kind === "settings") {
      ({ error } = await context.supabase.from("pricing_settings").update({ special_tag: data.tag, promo_description: data.description, is_active: data.active, all_plans_free: data.allFree }).eq("id", "specials"));
    } else if (data.kind === "whitelist") {
      const email = data.email.trim().toLowerCase();
      ({ error } = data.remove ? await context.supabase.from("special_access_whitelist").delete().eq("email", email) : await context.supabase.from("special_access_whitelist").upsert({ email }));
    } else {
      ({ error } = await context.supabase.from("promo_codes").upsert({ code: normalizePromo(data.code), is_active: data.active, expires_at: data.expires, max_uses: data.maxUses }));
    }
    if (error) throw new Error("Couldn't save these changes.");
    return true;
  });