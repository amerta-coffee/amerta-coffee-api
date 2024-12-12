import { OpenAPIHono } from "@hono/zod-openapi";
import { respondError } from "@/utils/response";
import * as authService from "@/services/auth";
import * as authSchema from "@/schemas/auth";

const authRoute = new OpenAPIHono();
const API_TAGS = ["Auth"];

// Register Route
authRoute.openapi(
  {
    method: "post",
    path: "/register",
    summary: "Register a new user",
    description:
      "Register a new user with name, email, password, and confirm password.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: authSchema.registerSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "User successfully registered",
      },
      400: {
        description: "Invalid input data",
      },
      409: {
        description: "User already exists",
      },
      500: {
        description: "Internal server error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const body = c.req.valid("json");

    try {
      const user = await authService.register(body);

      return c.json({ success: true, data: user }, 201);
    } catch (error: any) {
      return respondError(
        c,
        error?.error,
        error?.message || "Failed to register user!",
        error?.code
      );
    }
  }
);

// Login Route
authRoute.openapi(
  {
    method: "post",
    path: "/login",
    summary: "Log in a user",
    description: "Log in a user with email and password.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: authSchema.loginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Login successful",
      },
      400: {
        description: "Invalid input data",
      },
      401: {
        description: "Invalid email or password",
      },
      404: {
        description: "User not found",
      },
      500: {
        description: "Internal server error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const body = c.req.valid("json");
    const userAgent = c.req.header("User-Agent");

    try {
      const token = await authService.login(body, userAgent);

      return c.json({ success: true, token }, 200);
    } catch (error: any) {
      return respondError(
        c,
        error?.error,
        error?.message || "Failed to log in!",
        error?.code
      );
    }
  }
);

// Refresh Token Route
authRoute.openapi(
  {
    method: "post",
    path: "/refresh-token",
    summary: "Refresh access token",
    description: "Refresh the access token using the refresh token.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: authSchema.refreshTokenSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Token successfully refreshed",
      },
      400: {
        description: "Invalid input data",
      },
      401: {
        description: "Refresh token is missing or invalid",
      },
      500: {
        description: "Internal server error",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const { refreshToken } = c.req.valid("json");
    const userAgent = c.req.header("User-Agent");

    try {
      const token = await authService.processToken(
        refreshToken,
        userAgent,
        true
      );

      return c.json({ success: true, token }, 200);
    } catch (error: any) {
      return respondError(
        c,
        error?.error,
        error?.message || "Failed to generate token with refresh token!",
        error?.code
      );
    }
  }
);

// Logout Route
authRoute.openapi(
  {
    method: "post",
    path: "/logout",
    summary: "Log out a user",
    description: "Log out a user by invalidating the refresh token.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: authSchema.refreshTokenSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Logout successful",
      },
      401: {
        description: "Refresh token is missing or invalid",
      },
      500: {
        description: "Failed to log out",
      },
    },
    tags: API_TAGS,
  },
  async (c) => {
    const { refreshToken } = c.req.valid("json");
    const userAgent = c.req.header("User-Agent");

    try {
      await authService.processToken(refreshToken, userAgent);

      return c.json({ success: true, message: "Logout successful" }, 200);
    } catch (error: any) {
      return respondError(
        c,
        error?.error,
        error?.message || "Failed to log out!",
        error?.code
      );
    }
  }
);

export default authRoute;
