import { z } from "@hono/zod-openapi";

export const productIdSchema = z
  .string()
  .cuid()
  .openapi({
    param: {
      required: true,
      in: "path",
    },
    description: "Product ID.",
  });

export const productSlugSchema = z
  .string()
  .min(5)
  .regex(/^[a-z0-9-]+$/, { message: "Invalid slug!" })
  .openapi({
    description: "Product slug.",
  });

const productAssetSchema = z
  .array(
    z.object({
      url: z.string().url().openapi({
        description: "The URL of the product asset.",
      }),
      type: z.enum(["IMAGE", "VIDEO"]).openapi({
        description: "The type of the product asset, either IMAGE or VIDEO.",
      }),
      order: z.coerce.number().min(0).openapi({
        description: "The order in which the asset should appear.",
      }),
    })
  )
  .min(1, { message: "At least one product image must be provided." })
  .max(10, { message: "A maximum of 10 product assets are allowed." })
  .refine(
    (assets) => {
      const videoCount = assets.filter(
        (asset) => asset.type === "VIDEO"
      ).length;
      if (videoCount > 3) {
        return false;
      }
      return true;
    },
    {
      message: "A maximum of 3 videos are allowed.",
      path: ["productAssets"],
    }
  )
  .refine(
    (assets) => {
      const hasVideo = assets.some((asset) => asset.type === "VIDEO");
      const hasImage = assets.some((asset) => asset.type === "IMAGE");

      if (hasVideo && !hasImage) {
        return false;
      }
      return true;
    },
    {
      message:
        "If a video is provided, an image (thumbnail) must also be provided.",
      path: ["productAssets"],
    }
  )
  .openapi({
    description:
      "Array of product assets (images or videos) with order and URL.",
  });

export const productDiscountSchema = z
  .array(
    z.object({
      value: z.coerce.number().min(1).openapi({
        description: "Product discount value.",
      }),
      type: z.enum(["percentage", "fixed"]).openapi({
        description: "Product discount type (percentage or fixed).",
      }),
      startDate: z.string().datetime().openapi({
        description: "Start date for the product discount.",
      }),
      endDate: z.string().datetime().openapi({
        description: "End date for the product discount.",
      }),
    })
  )
  .max(5, { message: "Array can only have up to 5 discounts." })
  .openapi({
    description: "Array of product discounts.",
  });

export const productSchema = z.object({
  slug: productSlugSchema.nullish().optional(),
  sku: z.string().min(1).max(128).nullish().optional().openapi({
    description: "Product SKU.",
  }),
  name: z.string().min(3).max(255).openapi({
    description: "Product name.",
  }),
  description: z.string().min(10).max(1000).nullish().optional().openapi({
    description: "Product description.",
  }),
  price: z.coerce.number().min(1).openapi({
    description: "Product price.",
  }),
  stockQty: z.number().min(1).openapi({
    description: "Product stock quantity. Can be null in drafts.",
  }),
  status: z
    .enum(["DRAFT", "INACTIVE", "ACTIVE", "PREORDER", "OUTOFSTOCK", "ARCHIVED"])
    .nullish()
    .optional()
    .openapi({
      default: "DRAFT",
      description: "Product status.",
    }),
  category: z.string().min(1).max(100).nullish().optional().openapi({
    description: "Product category.",
  }),
  productAssets: productAssetSchema.nullish().optional(),
  productDiscounts: productDiscountSchema.nullish().optional(),
});
