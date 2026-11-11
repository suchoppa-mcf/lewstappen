import { z } from "zod";

export const normalizePromo = (code: string) => code.trim().toUpperCase();
export const accountUpdateSchema = z.object({
  accountId: z.string().uuid(), tier: z.enum(["basic", "pro", "premium"]),
  specialAccess: z.boolean(), resetTrials: z.boolean(),
});
export const directorySchema = z.object({
  totalUsers: z.number(), totalUses: z.number(),
  users: z.array(z.object({
    id: z.string(), email: z.string().nullable(), created_at: z.string(), email_confirmed_at: z.string().nullable(),
    tier: z.enum(["basic", "pro", "premium"]), trials_used: z.number(), has_special_access: z.boolean(),
    uses: z.number(), last_use: z.string().nullable(),
  })),
});
export type DirectoryUser = z.infer<typeof directorySchema>["users"][number];