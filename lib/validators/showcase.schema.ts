import { z } from "zod/v4";

export const createShowcaseSessionSchema = z.object({
  refresh: z.boolean().optional(),
});

export type CreateShowcaseSessionInput = z.infer<typeof createShowcaseSessionSchema>;
