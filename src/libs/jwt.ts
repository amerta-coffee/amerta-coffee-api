import { createJWT, validateJWT } from "oslo/jwt";
import { TimeSpan } from "oslo";
import db from "@/libs/db";

const isDevelopment = process.env.WEB_ENV === "development";
const JWT_SECRET = process.env.JWT_SECRET || "secret";
let encodedSecret: ArrayBuffer | null = null;

/**
 * Gets the encoded secret token to use for JWT signing. This function ensures that
 * the secret is only encoded once and then cached for future use.
 *
 * @returns The encoded secret token.
 * @throws {Error} If the secret token is not defined.
 */
const getEncodedSecret = async (): Promise<ArrayBuffer> => {
  if (!encodedSecret) {
    if (!JWT_SECRET) throw new Error("Secret token is not defined");
    encodedSecret = new TextEncoder().encode(JWT_SECRET).buffer as ArrayBuffer;
  }

  return encodedSecret;
};

/**
 * Creates a JWT token with the specified parameters.
 *
 * @param userId The user ID to include in the token.
 * @param expiresIn The expiration time as a TimeSpan object.
 * @returns The created JWT token.
 * @throws {Error} If token creation fails.
 */
const createToken = async (
  userId: string,
  expiresIn: TimeSpan
): Promise<string> => {
  const secret = await getEncodedSecret();
  const options = {
    subject: userId,
    expiresIn,
    includeIssuedTimestamp: true,
  };

  return await createJWT("HS256", secret, {}, options);
};

/**
 * Creates an access JWT token with a short expiration time.
 *
 * @param userId The user ID to include in the token.
 * @param expiresInMinutes The number of minutes until the token expires.
 * @returns The created JWT token, or null if an error occurred.
 */
export const createAccessToken = async (
  userId: string,
  expiresInMinutes = 15
) => {
  try {
    return await createToken(userId, new TimeSpan(expiresInMinutes, "m"));
  } catch (error: any) {
    throw {
      code: 500,
      error: "INTERNAL_SERVER_ERROR",
      message: isDevelopment
        ? error.message || "Failed to create access token."
        : "Please contact the admin.",
    };
  }
};

/**
 * Creates a refresh JWT token with a longer expiration time and saves it to the database.
 *
 * @param userId The user ID to create a refresh token for.
 * @param expiresInDays The number of days until the refresh token expires.
 * @returns The created refresh token.
 */
export const createRefreshToken = async (
  userId: string,
  expiresInDays: number = 30
) => {
  try {
    const tokenExpiry = new TimeSpan(expiresInDays, "d");
    const refreshToken = await createToken(userId, tokenExpiry);
    const issuedAt = new Date();
    const expiresAt = new Date(
      issuedAt.getTime() + expiresInDays * 24 * 60 * 60 * 1000
    );

    await db.userToken.create({
      data: {
        userId,
        token: refreshToken,
        issuedAt,
        expiresAt,
      },
    });

    return refreshToken;
  } catch (error: Error | any) {
    throw {
      code: 500,
      error: "INTERNAL_SERVER_ERROR",
      message: isDevelopment
        ? error.message || "Failed to create refresh token."
        : "Please contact the admin.",
    };
  }
};

/**
 * Validates a given JWT token against the secret token.
 *
 * @param token The token to validate.
 * @returns The result of the validation.
 */
export const validateToken = async (token: string) => {
  try {
    const secret = await getEncodedSecret();

    return await validateJWT("HS256", secret, token);
  } catch (error: any) {
    throw {
      code: 401,
      error: "UNAUTHORIZED",
      message: isDevelopment
        ? error.message || "Failed to validate token."
        : "Please contact the admin.",
    };
  }
};
