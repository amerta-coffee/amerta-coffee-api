import db from "./db";

/**
 * Checks the database connection by performing a simple query.
 *
 * @returns An object with the keys `status` and `error`. The `status` key will
 * have the value `"connected"` if the database connection is successful, and
 * `"disconnected"` if the connection fails. The `error` key will have the error
 * message if the connection fails, and `null` if the connection is successful.
 */
export const checkDatabaseConnection = async () => {
  const startTime = performance.now();

  try {
    await db.$queryRaw`SELECT 1`;
    const responseTime = (performance.now() - startTime).toFixed(2);
    return { status: "connected", response: `${responseTime} ms` };
  } catch (error: Error | any) {
    const responseTime = (performance.now() - startTime).toFixed(2);
    const isDevelopment = process.env.WEB_ENV === "development";

    const errorMessage = isDevelopment
      ? error.message || "Unknown error"
      : "Database connection failed. Please contact the admin.";

    return {
      status: "disconnected",
      error: errorMessage,
      response: `${responseTime} ms`,
    };
  }
};

/**
 * Builds a health response object based on the given server time and database
 * status.
 *
 * If the database status is "connected", the response will have a status code
 * of 200 and a message of "Application is healthy". Otherwise, the response
 * will have a status code of 500 and a message of "Application is unhealthy".
 *
 * The response object will also contain the given server time and database
 * status.
 *
 * @param serverTime The current server time.
 * @param dbStatus The database status.
 * @returns A response object with the given server time, database status, and
 * a status code and message based on the database status.
 */
export const buildHealthResponse = (serverTime: string, dbStatus: any) => {
  const statusCode = dbStatus.status === "connected" ? 200 : 500;
  const statusMessage =
    dbStatus.status === "connected"
      ? "Application is healthy."
      : "Application is unhealthy.";

  return {
    response: {
      time: serverTime,
      database: dbStatus,
      message: statusMessage,
    },
    statusCode: statusCode,
  };
};
