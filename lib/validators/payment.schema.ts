import { z } from "zod/v4";

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, "orderId es requerido"),
  tipPercentage: z.number().min(0).max(100).default(0),
  tipAmount: z.number().min(0).default(0),
  customerEmail: z.email().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
