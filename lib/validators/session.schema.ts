import { z } from "zod/v4";

export const startSessionSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug inválido"),
  // Los tableId en DB pueden ser UUIDs generados por `gen_random_uuid()::text`
  // o IDs custom del seed (e.g. "table_001"). Validar forma liberal;
  // la lookup en DB es el verdadero gatekeeper.
  tableId: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-zA-Z0-9_-]+$/, "tableId inválido"),
  qrToken: z.string().min(20).max(128), // HMAC base64url ~43 chars
  qrVersion: z.number().int().positive().max(1_000_000),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
