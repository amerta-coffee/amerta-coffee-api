import { createMiddleware } from "hono/factory";
import { validateToken } from "@/libs/jwt";
import { respondError } from "@/utils/response";
import db from "@/libs/db";

/**
 * Auth middleware that validates a JWT token in the Authorization header
 *
 * If the token is invalid or missing, a 401 response is returned.
 *
 * If the token is valid, the user ID is extracted and used to find the user in
 * the database. If the user is not found, a 404 response is returned.
 *
 * If the user is found, the user object is stored in the request context and the
 * next middleware is called.
 *
 * If the token is invalid for any other reason, a 401 response is returned with
 * a generic error message.
 */
const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return respondError(
      c,
      "AUTHORIZATION_TOKEN_REQUIRED",
      "Authorization token is required!",
      401
    );
  }

  try {
    const { subject: userId } = await validateToken(token);

    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid user ID in token");
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    c.set("userId", userId);

    await next();
  } catch (error: any) {
    return respondError(
      c,
      error.code || "AUTHENTICATION_FAILED",
      error.message || "Authentication failed!",
      401
    );
  }
});

export default authMiddleware;
