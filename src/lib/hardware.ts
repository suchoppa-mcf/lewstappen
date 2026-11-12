import { z } from "zod";

export const hardwareEnquirySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Enter your name.").max(100),
  email: z.string().trim().email("Enter a valid email.").max(254),
  area: z.string().trim().min(1, "Enter your city or postal code.").max(150),
  device: z.enum(["Desktop / PC", "Laptop", "Server / NAS", "Other device"]),
  model: z.string().trim().max(200),
  goals: z.string().trim().min(1, "Tell us what you want to improve.").max(2000),
  details: z.string().trim().max(2000),
  website: z.string().max(0, "Couldn't send this enquiry."),
});