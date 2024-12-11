import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRoute from "@/routes/auth";
import productRoute from "@/routes/product";
import cartRoute from "@/routes/cartRoute";
import orderRoute from "@/routes/orderRoute";

const allowedOrigins = process.env.CORS_ALLOWS_ORIGINS?.split(",") || [];
const app = new OpenAPIHono();

// Middleware
app
  .use(
    "*",
    cors({
      origin: (origin) => {
        if (origin) {
          const validOrigin = allowedOrigins.some((allowedOrigin) => {
            return (
              origin === `http://${allowedOrigin}` ||
              origin === `https://${allowedOrigin}`
            );
          });

          if (validOrigin) {
            return origin;
          }
        }

        return null;
      },
      credentials: true,
      maxAge: 3600,
    })
  )
  .use("*", logger());

// Web routes
app.get(
  "/",
  apiReference({
    defaultOpenAllTags: true,
    pageTitle: "Amerta Coffee API",
    theme: "alternate",
    spec: {
      url: "/spec.json",
    },
  })
);

app.doc("/spec.json", {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "Amerta Coffee API",
    description:
      "API for Amerta Coffee, a premium Indonesian coffee online store.",
  },
});

// API routes
app.route("/auth", authRoute);
app.route("/products", productRoute);
app.route("/cart", cartRoute);
app.route("/orders", orderRoute);

export default {
  fetch: app.fetch,
  port: process.env.WEB_PORT || 3000,
};
