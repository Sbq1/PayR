import { z } from "zod/v4";

export const startSessionSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug inválido"),
  tableId: z.string().uuid(),
  qrToken: z
    .string()
    .min(20) // HMAC base64url es 43 chars; 20 mínimo defensivo
    .max(128),
  qrVersion: z.number().int().positive().max(1_000_000),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
