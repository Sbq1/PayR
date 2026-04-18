import { z } from "zod/v4";

export const createRefundSchema = z.object({
  paymentId: z.string().min(1, "paymentId requerido"),
  amountInCents: z
    .number()
    .int()
    .positive("amount debe ser positivo")
    .max(1_000_000_000, "amount fuera de rango"),
  reason: z
    .string()
    .min(5, "reason mínimo 5 chars")
    .max(500, "reason máximo 500 chars"),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
