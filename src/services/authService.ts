import { z } from "@hono/zod-openapi";
import { registerSchema, loginSchema } from "@/schemas/authSchema";
import { generateAvatarUrl } from "@/libs/avatar";
import * as password from "@/libs/password";
import * as jwt from "@/libs/jwt";
import db from "@/libs/db";

/**
 * Registers a new user in the system.
 *
 * @param data - An object containing the user's registration details,
 *               which includes name, email, password, and confirmPassword.
 * @throws {Object} If the email is already registered, throws an error with code 409
 *                  and a message indicating the email or phone number is taken.
 * @returns A Promise that resolves to an object containing the newly registered user's
 *          name and email.
 */
export const register = async (data: z.infer<typeof registerSchema>) => {
  const hashedPassword = await password.hashValue(data.password);
  const existingUser = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw {
      code: 409,
      error: existingUser.email === data.email ? "EMAIL_TAKEN" : "PHONE_TAKEN",
      message:
        existingUser.email === data.email
          ? "Email already registered!"
          : "Phone number already registered with another user!",
    };
  }

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      avatar_url: generateAvatarUrl(data.name),
      password: hashedPassword,
    },
    select: {
      name: true,
      email: true,
    },
  });

  return user;
};

/**
 * Logs in a user with email and password.
 *
 * @param data - An object containing the user's login details,
 *               which includes email and password.
 * @throws {Object} If the user is not found, throws an error with code 404
 *                  and a message indicating the user is not found.
 * @throws {Object} If the password is invalid, throws an error with code 401
 *                  and a message indicating invalid email or password.
 * @returns A Promise that resolves to an object containing the access token
 *          and the refresh token.
 */
export const login = async (data: z.infer<typeof loginSchema>) => {
  const user = await db.user.findUnique({
    where: { email: data.email.toLowerCase() },
    select: { id: true, password: true },
  });
  if (!user) {
    throw {
      code: 404,
      error: "USER_NOT_FOUND",
      message: "User not found!",
    };
  }

  const isPasswordValid = await password.verifyValue(
    data.password,
    user.password
  );
  if (!isPasswordValid) {
    throw {
      code: 401,
      error: "INVALID_EMAIL_OR_PASSWORD",
      message: "Invalid email or password!",
    };
  }

  const userId = user.id.toString();
  const [accessToken, refreshToken] = await Promise.all([
    jwt.createAccessToken(userId),
    jwt.createRefreshToken(userId),
  ]);

  return { accessToken, refreshToken };
};

/**
 * Processes a refresh token to log out a user or to regenerate a new access and refresh token pair.
 *
 * @param refreshToken - The refresh token to process.
 * @param isRegenerate - Whether to regenerate a new access and refresh token pair.
 *                       Defaults to false, which means the token is for logging out a user.
 * @throws {Object} If the refresh token is invalid, expired, or already revoked,
 *                  throws an error with code 401 and a message indicating the reason.
 * @returns A Promise that resolves to an object containing the new access token and refresh token
 *          if `isRegenerate` is true, otherwise resolves to true.
 */
const processToken = async (
  refreshToken: string,
  isRegenerate: boolean = false
) => {
  const result = await db.$transaction(async (prisma) => {
    const tokenRecord = await prisma.userToken.findFirst({
      where: {
        token: refreshToken,
        expiresAt: { gte: new Date() },
      },
    });

    if (!tokenRecord) {
      throw {
        code: 401,
        error: isRegenerate ? "INVALID_REFRESH_TOKEN" : "INVALID_LOGOUT",
        message: `${
          isRegenerate ? "Refresh" : "Logout"
        } token is invalid, expired, or already revoked!`,
      };
    }

    await prisma.userToken.delete({
      where: { id: tokenRecord.id },
    });

    return tokenRecord;
  });

  if (isRegenerate) {
    const [newAccessToken, newRefreshToken] = await Promise.all([
      jwt.createAccessToken(result.userId),
      jwt.createRefreshToken(result.userId),
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  return true;
};

/**
 * Regenerates a new access and refresh token pair using a valid refresh token.
 *
 * @param {string} refreshToken - The refresh token to use for generating new tokens.
 * @returns {Promise<any>} - A promise that resolves to an object containing the new access and refresh tokens.
 * @throws {Error} - If the refresh token is invalid, expired, or already revoked.
 */
export const regenToken = async (refreshToken: string): Promise<any> => {
  return await processToken(refreshToken, true);
};

/**
 * Logs out a user by invalidating the refresh token.
 *
 * @param {string} refreshToken - The refresh token to invalidate.
 * @throws {Error} - If the refresh token is invalid, expired, or already revoked.
 * @returns {Promise<boolean>} - A promise that resolves to true if the token was successfully invalidated.
 */
export const logout = async (refreshToken: string) => {
  return await processToken(refreshToken);
};
