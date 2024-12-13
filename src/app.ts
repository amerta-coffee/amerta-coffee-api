import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { logger } from "hono/logger";
import { createApiRouter } from "./routes";
import corsMiddleware from "./middlewares/cors";

const resource = process.env.RESOURCE || "v1";
const app = new OpenAPIHono();

// Middleware
app.use("*", corsMiddleware).use("*", logger());

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
    version: "1.1.0",
    title: "Amerta Coffee API",
    description:
      "API for Amerta Coffee, a premium Indonesian coffee online store.",
  },
});

// API routes
app.route(`/api/${resource}`, createApiRouter());

export default {
  fetch: app.fetch,
  port: process.env.WEB_PORT || 3000,
};
