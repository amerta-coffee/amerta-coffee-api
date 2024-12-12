import { Context } from "hono";

/**
 * Responds with an error to the client.
 *
 * @param c The Hono Context object.
 * @param message The error message to send to the client.
 * @param status The HTTP status code to respond with.
 * @returns The response object.
 */
export function respondError(
  c: Context,
  error: string,
  message?: string,
  code?: number
) {
  const errorResponse = {
    success: false,
    error: error || "UNKNOWN_ERROR",
    message: message || "An unknown error occurred!",
  };

  return c.json(errorResponse, { status: code || 500 });
}
