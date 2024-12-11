import { createJWT, validateJWT } from "oslo/jwt";
import { TimeSpan } from "oslo";
import db from "@/libs/db";

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
 * Creates a JSON Web Token (JWT) with the given user ID and expiration time.
 * The token will include the user ID as the subject and the current timestamp as the issued at (iat) claim.
 * The token will be signed with the secret token using the HS256 algorithm.
 *
 * @param userId The ID of the user.
 * @param expiresIn The time span the token should be valid for.
 * @param options Optional additional options for the token.
 * @returns The created JWT.
 */
export const createToken = async (
  userId: string,
  expiresIn: TimeSpan,
  options: any
): Promise<string> => {
  const secret = await getEncodedSecret();

  const opt = {
    subject: userId,
    includeIssuedTimestamp: true,
    expiresIn: expiresIn,
    ...options,
  };

  return await createJWT("HS256", secret, {}, opt);
};

/**
 * Validates a given JWT token against the secret token.
 *
 * @param token The token to validate.
 * @returns The result of the validation.
 */
export const validateToken = async (token: string) => {
  const secret = await getEncodedSecret();

  return await validateJWT("HS256", secret, token);
};

/**
 * Creates a new refresh token for a given user ID with the given expiration time.
 *
 * The generated token will include the user ID as the subject and the current timestamp as the issued at (iat) claim.
 * The token will be signed with the secret token using the HS256 algorithm.
 *
 * The function will also create a new record in the userToken table with the given user ID, a new JWT ID, the user agent (if provided) and the issued at and expires at timestamps.
 *
 * @param userId The ID of the user.
 * @param expiresIn The time span the token should be valid for.
 * @param options Optional additional options for the token.
 * @returns The created refresh token.
 */
export const createRefreshToken = async (
  userId: string,
  expiresIn: TimeSpan,
  payload?: any
) => {
  const jwtId = crypto.randomUUID();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + expiresIn.milliseconds());

  const refreshToken = await createToken(userId, expiresIn, {
    jwtId,
    ...payload,
  });

  await db.userToken.create({
    data: {
      userId: userId,
      jwtId,
      userAgent: payload?.userAgent,
      issuedAt,
      expiresAt,
    },
  });

  return refreshToken;
};
