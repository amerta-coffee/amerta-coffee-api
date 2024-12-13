import { Context } from "hono";

/**
 * Sends a success response to the client.
 *
 * @param c The Hono Context object.
 * @param data The data to include in the response.
 * @param message An optional success message to send to the client.
 * @param code An optional HTTP status code to respond with.
 * @returns The response object.
 */
export function responseSuccess(
  c: Context,
  message: string,
  data?: any,
  code: number = 200
) {
  const successResponse: { success: boolean; message: string; data?: any } = {
    success: true,
    message,
  };

  if (data !== undefined && data !== null) {
    successResponse.data = data;
  }

  return c.json(successResponse, { status: code });
}

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
