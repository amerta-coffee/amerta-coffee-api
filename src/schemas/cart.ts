import { z } from "zod";
import { productIdSchema } from "./product";

export const cartItemSchema = z.object({
  productId: productIdSchema,
  quantity: z.coerce.number().int().min(0).openapi({
    default: 0,
    description: "Item quantity.",
  }),
});

export const cartCheckoutSchema = z.object({
  shippingAddressId: z.string().cuid().openapi({
    description: "Shipping address ID.",
  }),
});

export { productIdSchema };
