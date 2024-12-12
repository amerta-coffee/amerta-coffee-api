import { z } from "@hono/zod-openapi";

export const querySchema = z.object({
  filter: z.string().optional().openapi({
    description: "Filters based on the specified key-value pairs.",
  }),
  sort: z.string().optional().openapi({
    description: "Sorts based on the specified key-value pairs.",
  }),
  page: z.coerce.number().min(1).optional().openapi({
    description: "Page number for pagination.",
  }),
  limit: z.coerce.number().min(1).optional().openapi({
    description: "Number of items per page.",
  }),
});
