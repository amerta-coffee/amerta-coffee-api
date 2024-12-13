import type { Context } from "hono";
import { OpenAPIHono, z } from "@hono/zod-openapi";
import { querySchema } from "@/schemas/query";
import authMiddleware from "@/middlewares/auth";
import * as response from "@/utils/response";
import * as cartService from "@/services/cart";
import * as cartSchema from "@/schemas/cart";

const cartRoute = new OpenAPIHono();
const API_TAGS = ["Cart"];

// Register security scheme
cartRoute.openAPIRegistry.registerComponent(
  "securitySchemes",
  "AuthorizationBearer",
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Bearer token",
  }
);

// Get Cart
cartRoute.openapi(
  {
    method: "get",
    path: "/",
    summary: "Get Cart",
    middleware: authMiddleware,
    security: [{ AuthorizationBearer: [] }],
    request: {
      query: querySchema,
    },
    responses: {
      200: {
        description: "Get Cart",
      },
      400: {
        description: "Get Cart Failed",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Cart Not Found",
      },
      500: {
        description: "Internal Server Error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const userId = (c as Context).get("userId");

    try {
      const cart = await cartService.getCart(userId);

      return response.responseSuccess(c, "Success to get cart!", cart, 200);
    } catch (error: any) {
      return response.respondError(
        c,
        error?.error,
        error?.message || "Failed to get cart!",
        error?.code
      );
    }
  }
);

// Add Item to Cart
cartRoute.openapi(
  {
    method: "post",
    path: "/item",
    summary: "Add Item to Cart",
    middleware: authMiddleware,
    security: [{ AuthorizationBearer: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: cartSchema.cartItemSchema.refine(
              (data) => data.quantity > 0,
              "Quantity must be greater than 0"
            ),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Add Item to Cart",
      },
      400: {
        description: "Add Item to Cart Failed",
      },
      401: {
        description: "Unauthorized",
      },
      500: {
        description: "Internal Server Error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const userId = (c as Context).get("userId");
    const { productId, quantity } = c.req.valid("json");

    try {
      const cartItem = await cartService.addOrUpdateCartItem(
        userId,
        productId,
        quantity
      );

      return response.responseSuccess(
        c,
        cartItem?.message || "Success to add item to cart!",
        cartItem?.data,
        201
      );
    } catch (error: any) {
      return response.respondError(
        c,
        error?.error,
        error?.message || "Failed to add item to cart!",
        error?.code
      );
    }
  }
);

// Update Cart Item
cartRoute.openapi(
  {
    method: "patch",
    path: "/item/{productId}",
    summary: "Update a Cart Item",
    middleware: authMiddleware,
    security: [{ AuthorizationBearer: [] }],
    request: {
      params: z.object({ productId: cartSchema.productIdSchema }),
      body: {
        content: {
          "application/json": {
            schema: cartSchema.cartItemSchema.pick({ quantity: true }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Update Cart Item",
      },
      400: {
        description: "Update Cart Item Failed",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Cart Item Not Found",
      },
      500: {
        description: "Internal Server Error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const userId = (c as Context).get("userId");
    const { productId } = c.req.valid("param");
    const { quantity } = c.req.valid("json");

    try {
      const cartItem = await cartService.addOrUpdateCartItem(
        userId,
        productId,
        quantity,
        false
      );

      return response.responseSuccess(
        c,
        cartItem?.message || "Success to add item to cart!",
        cartItem?.data,
        200
      );
    } catch (error: any) {
      return response.respondError(
        c,
        error?.error,
        error?.message || "Failed to update cart item!",
        error?.code
      );
    }
  }
);

// Delete Cart Item
cartRoute.openapi(
  {
    method: "delete",
    path: "/item/{productId}",
    summary: "Delete a Cart Item",
    middleware: authMiddleware,
    security: [{ AuthorizationBearer: [] }],
    request: {
      params: z.object({ productId: cartSchema.productIdSchema }),
    },
    responses: {
      200: {
        description: "Delete Cart Item",
      },
      400: {
        description: "Delete Cart Item Failed",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Cart Item Not Found",
      },
      500: {
        description: "Internal Server Error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const userId = (c as Context).get("userId");
    const { productId } = c.req.valid("param");

    try {
      await cartService.deleteCartItem(userId, productId);

      return response.responseSuccess(c, "Success to delete cart item!");
    } catch (error: any) {
      return response.respondError(
        c,
        error?.error,
        error?.message || "Failed to delete cart item!",
        error?.code
      );
    }
  }
);

// Checkout Cart
cartRoute.openapi(
  {
    method: "post",
    path: "/checkout",
    summary: "Checkout Cart",
    middleware: authMiddleware,
    security: [{ AuthorizationBearer: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: cartSchema.cartCheckoutSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Checkout Cart",
      },
      400: {
        description: "Checkout Cart Failed",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Cart Not Found",
      },
      500: {
        description: "Internal Server Error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const userId = (c as Context).get("userId");
    const { shippingAddressId } = c.req.valid("json");

    try {
      const order = await cartService.checkout(userId, shippingAddressId);

      return response.responseSuccess(
        c,
        "Success to checkout cart!",
        order,
        200
      );
    } catch (error: any) {
      return response.respondError(
        c,
        error?.error,
        error?.message || "Failed to checkout cart!",
        error?.code
      );
    }
  }
);

export default cartRoute;
