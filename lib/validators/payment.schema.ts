import { z } from "zod/v4";

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, "orderId es requerido"),
  // slug + tableId obligatorios: el server valida que orderId pertenece
  // a esta combinación (defensa contra manipulación cross-mesa/cross-restaurante).
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug inválido"),
  tableId: z.string().min(1, "tableId es requerido"),
  tipPercentage: z.number().int().min(0).max(100).default(0),
  // tipAmount en centavos COP. Max de seguridad aquí (1M COP); el server
  // además valida que no exceda el subtotal de la orden.
  tipAmount: z.number().int().min(0).max(100_000_000).default(0),
  customerEmail: z.email().max(254).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
