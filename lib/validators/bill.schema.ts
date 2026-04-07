import { z } from "zod/v4";

export const getBillQuerySchema = z.object({
  slug: z
    .string()
    .min(1, "slug es requerido")
    .regex(/^[a-z0-9-]+$/, "slug invalido"),
  tableId: z.string().min(1, "tableId es requerido"),
});

export type GetBillQuery = z.infer<typeof getBillQuerySchema>;
