import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRoute from "@/routes/authRoute";
import productRoute from "@/routes/productRoute";
import cartRoute from "@/routes/cartRoute";
import orderRoute from "@/routes/orderRoute";
import * as health from "@/libs/health";

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
app.get("/", (c) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Amerta Coffee API - A premium Indonesian coffee online store." />
        <title>Amerta Coffee API</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body, html {
            height: 100%;
            font-family: 'Arial', sans-serif;
          }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #1E1E1E;
            color: #E0E0E0;
          }
          .card {
            background-color: #2D2D2D;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            border-radius: 1rem;
            padding: 2rem;
            max-width: 500px;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .card h1 {
            font-size: 1.5rem;
            color: #FFCCBC;
            margin-bottom: 1rem;
          }
          .card p {
            font-size: 1.125rem;
            color: #BCAAA4;
            margin-bottom: 1.5rem;
          }
          .buttons {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
          }
          .card a {
            display: inline-block;
            background-color: #4E342E;
            color: #ffffff;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            border: none;
            text-decoration: none;
            font-size: 1rem;
          }
          .card a:hover {
            background-color: #795548;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Welcome to Amerta Coffee API</h1>
          <p>A premium Indonesian coffee online store. Explore our API documentation and user interface below.</p>
          <div class="buttons">
            <a href="/ui">Swagger UI</a>
            <a href="/spec.json">API Specification</a>
          </div>
        </div>
      </body>
    </html>
  `;

  return c.html(htmlContent);
});

app.get(
  "/ui",
  apiReference({
    pageTitle: "Hono API Reference",
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
app.get("/health", async (c) => {
  const dbStatus = await health.checkDatabaseConnection();
  const serverTime = new Date().toISOString();

  const { response, statusCode } = health.buildHealthResponse(
    serverTime,
    dbStatus
  );

  return c.json(response, {
    status: statusCode,
  });
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
