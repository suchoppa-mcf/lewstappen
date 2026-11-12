import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hardwareEnquirySchema } from "./hardware";

export const submitHardwareEnquiry = createServerFn({ method: "POST" })
  .inputValidator(hardwareEnquirySchema)
  .handler(async ({ data }) => {
    // Public, validated lead capture: visitors can submit but never read enquiries.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { website: _website, ...enquiry } = data;
    const result = await supabaseAdmin.from("hardware_enquiries").upsert(enquiry, { onConflict: "id", ignoreDuplicates: true });
    if (result.error) throw new Error("Couldn't send your enquiry. Please try again.");
    return { id: data.id };
  });

export const getHardwareEnquiries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await context.supabase.rpc("is_developer");
    if (role.error || !role.data) throw new Error("Developer access required.");
    const result = await context.supabase.from("hardware_enquiries").select("*").order("created_at", { ascending: false });
    if (result.error) throw new Error("Couldn't load hardware enquiries.");
    return result.data;
  });