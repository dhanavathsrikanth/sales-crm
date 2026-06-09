import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.string().default("new"),
});

export type LeadFormValues = z.infer<typeof leadSchema>;
