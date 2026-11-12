import { describe, expect, it } from "vitest";
import { hardwareEnquirySchema } from "./hardware";

const enquiry = { id: "00000000-0000-4000-8000-000000000001", name: "Test visitor", email: "visitor@example.com", area: "Test city", device: "Server / NAS", model: "Home server", goals: "Add storage", details: "", website: "" };
describe("hardware enquiries", () => {
  it("accepts requests for PCs, laptops, servers and other devices", () => {
    for (const device of ["Desktop / PC", "Laptop", "Server / NAS", "Other device"]) expect(hardwareEnquirySchema.parse({ ...enquiry, device }).device).toBe(device);
    expect(hardwareEnquirySchema.safeParse({ ...enquiry, device: "invalid" }).success).toBe(false);
  });
  it("requires usable contact details and upgrade goals", () => {
    for (const field of ["name", "email", "area", "goals"]) expect(hardwareEnquirySchema.safeParse({ ...enquiry, [field]: " " }).success).toBe(false);
  });
  it("rejects filled spam traps", () => {
    expect(hardwareEnquirySchema.safeParse({ ...enquiry, website: "spam" }).success).toBe(false);
  });
});