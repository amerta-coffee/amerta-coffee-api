import type { Context } from "hono";
import { OpenAPIHono, z } from "@hono/zod-openapi";
import { querySchema } from "@/schemas/query";
import { respondError, responseSuccess } from "@/utils/response";
import * as productService from "@/services/product";
import * as productSchema from "@/schemas/product";
import authMiddleware from "@/middlewares/auth";

const productRoute = new OpenAPIHono();
const API_TAGS = ["Products"];

// Register security scheme
productRoute.openAPIRegistry.registerComponent(
  "securitySchemes",
  "AuthorizationBearer",
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Bearer token",
  }
);

// Get Products
productRoute.openapi(
  {
    method: "get",
    path: "/",
    summary: "Get Products",
    request: {
      query: querySchema,
    },
    responses: {
      200: {
        description: "Get Products",
      },
      400: {
        description: "Invalid Input Data",
      },
      500: {
        description: "Internal Server Error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const { filter, sort, limit, page } = c.req.valid("query");

    try {
      const products = await productService.getAll(filter, sort, limit, page);

      return responseSuccess(c, "Success to get products!", products, 200);
    } catch (error: any) {
      return respondError(
        c,
        error?.error,
        error?.message || "Failed to get products!",
        error?.code
      );
    }
  }
);

// Get Product By Slug
productRoute.openapi(
  {
    method: "get",
    path: "/{slug}",
    summary: "Get Product By Slug",
    request: {
      params: z.object({ slug: productSchema.productSlugSchema }),
    },
    responses: {
      200: {
        description: "Get Product By Slug",
      },
      404: {
        description: "Product Not Found",
      },
      500: {
        description: "Internal Server Error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const { slug } = c.req.valid("param");

    try {
      const product = await productService.getBySlug(slug);

      return responseSuccess(c, "Success to get product!", product, 200);
    } catch (error: any) {
      return respondError(
        c,
        error?.error,
        error?.message || "Failed to get product!",
        error?.code
      );
    }
  }
);

// Create Product
productRoute.openapi(
  {
    method: "post",
    path: "/",
    summary: "Create Product",
    middleware: authMiddleware,
    security: [{ AuthorizationBearer: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: productSchema.productSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Create Product",
      },
      400: {
        description: "Invalid Input Data",
      },
      401: {
        description: "Unauthorized",
      },
      409: {
        description: "Product Already Exists",
      },
      500: {
        description: "Internal Server Error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const body = c.req.valid("json");
    const userId = (c as Context).get("userId");

    try {
      const product = await productService.create(body, userId);

      return responseSuccess(c, "Success to create product!", product, 201);
    } catch (error: any) {
      return respondError(
        c,
        error?.error,
        error?.message || "Failed to create product!",
        error?.code
      );
    }
  }
);

// Update Product
productRoute.openapi(
  {
    method: "patch",
    path: "/{productId}",
    summary: "Update Product By Product ID",
    middleware: authMiddleware,
    security: [{ AuthorizationBearer: [] }],
    request: {
      params: z.object({ productId: productSchema.productIdSchema }),
      body: {
        content: {
          "application/json": {
            schema: productSchema.productSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Update Product",
      },
      400: {
        description: "Update Product Failed",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Product Not Found",
      },
      500: {
        description: "Internal Server Error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const { productId: id } = c.req.valid("param");
    const body = c.req.valid("json");
    const userId = (c as Context).get("userId");

    try {
      const product = await productService.update(id, body, userId);

      return responseSuccess(c, "Success to update product!", product, 200);
    } catch (error: any) {
      return c.json(
        {
          status: "failed",
          error: error.message || "Update Product Failed!",
        },
        400
      );
    }
  }
);

// Delete Product
productRoute.openapi(
  {
    method: "delete",
    path: "/{productId}",
    summary: "Delete Product By Product ID",
    middleware: authMiddleware,
    security: [{ AuthorizationBearer: [] }],
    request: {
      params: z.object({ productId: productSchema.productIdSchema }),
    },
    responses: {
      200: {
        description: "Delete Product",
      },
      400: {
        description: "Delete Product Failed",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Product Not Found",
      },
      500: {
        description: "Internal Server Error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const { productId: id } = c.req.valid("param");
    const userId = (c as Context).get("userId");

    try {
      const product = await productService.deleteById(id, userId);

      return responseSuccess(c, "Success to delete product!", product, 200);
    } catch (error: any) {
      return respondError(
        c,
        error?.error,
        error?.message || "Failed to delete product!",
        error?.code
      );
    }
  }
);

export default productRoute;
