import { z } from "zod";

// Shared by the enquiry form (client) and POST /enquiries (server) so validation
// is identical on both sides (api-contract.md §4).
export const enquirySchema = z.object({
  counselIds: z.array(z.uuid()).default([]),
  enquirerName: z.string().trim().min(1, "Enter your name."),
  firm: z.string().trim().max(200).optional().default(""),
  email: z.email("Enter a valid email address."),
  // When case type is "Other", the detail lives in the message.
  caseType: z.string().trim().max(120).optional().default(""),
  urgency: z.enum(["routine", "soon", "urgent"]).default("routine"),
  message: z.string().trim().min(1, "Add a short message.").max(4000),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const URGENCY_OPTIONS = [
  { value: "routine", label: "Routine" },
  { value: "soon", label: "Soon" },
  { value: "urgent", label: "Urgent" },
] as const;
