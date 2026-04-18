import { z } from "zod/v4";

// Body de POST /api/payment/create. Desde Fase 2 incluye evidencia legal
// (Ley 2300) + documento DIAN condicional + expectedVersion para el
// lock optimista.
export const createPaymentSchema = z
  .object({
    orderId: z.string().min(1, "orderId es requerido"),
    // slug + tableId: defensivos. El server revalida contra la sesión.
    slug: z
      .string()
      .min(2)
      .max(60)
      .regex(/^[a-z0-9-]+$/, "Slug inválido"),
    tableId: z.string().min(1, "tableId es requerido"),

    // Tip — en centavos COP. Límite superior defensivo (el server
    // además valida contra subtotal de la orden).
    tipPercentage: z.number().int().min(0).max(100).default(0),
    tipAmount: z.number().int().min(0).max(100_000_000).default(0),

    // Ley 2300: aceptación explícita obligatoria cuando hay propina > 0.
    acceptedTipDisclaimer: z.boolean().default(false),
    tipDisclaimerTextVersion: z.string().max(40).default("ley-2300-v1"),

    // DIAN 5 UVT: identificación del adquiriente. Opcional en el schema,
    // pero el service rechaza 422 si fe_regime='MANDATORY' y total >= 5UVT
    // sin documento (lógica final en Fase 3).
    customerDocument: z
      .object({
        type: z.enum(["CC", "CE", "NIT", "PASSPORT"]),
        number: z
          .string()
          .min(4)
          .max(20)
          .regex(/^[A-Z0-9-]+$/i, "Documento inválido"),
      })
      .optional(),

    customerEmail: z.email().max(254).optional(),

    // Lock optimista: version que el cliente leyó del bill. Si la orden
    // avanzó mientras tanto (otra sesión ganó), el server retorna 409.
    expectedVersion: z.number().int().nonnegative().default(0),
  })
  .superRefine((v, ctx) => {
    if (v.tipAmount > 0 && v.acceptedTipDisclaimer !== true) {
      ctx.addIssue({
        code: "custom",
        path: ["acceptedTipDisclaimer"],
        message: "Debe aceptar que la propina es voluntaria (Ley 2300)",
      });
    }
  });

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
