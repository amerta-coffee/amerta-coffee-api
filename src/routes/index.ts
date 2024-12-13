import { OpenAPIHono } from "@hono/zod-openapi";
import authRoute from "@/routes/auth";
import productRoute from "@/routes/product";
import cartRoute from "@/routes/cart";

/**
 * Creates a new API router which handles all the routes related to authentication,
 * products and cart.
 *
 * @returns {OpenAPIHono} - The newly created API router.
 */
export const createApiRouter = (): OpenAPIHono => {
  const apiRoute = new OpenAPIHono();

  apiRoute.route("/auth", authRoute);
  apiRoute.route("/products", productRoute);
  apiRoute.route("/cart", cartRoute);

  return apiRoute;
};
