import { z } from "@hono/zod-openapi";
import { registerSchema, loginSchema } from "@/schemas/auth";
import { compareUserAgent } from "@/libs/userAgent";
import { TimeSpan } from "oslo";
import * as password from "@/libs/password";
import * as jwt from "@/libs/jwt";
import db from "@/libs/db";

const accessTokenExpired = new TimeSpan(15, "m");
const refreshTokenExpired = new TimeSpan(14, "d");

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
    select: { email: true },
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
      avatar_url: `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(
        data.name.toLowerCase()
      )}`,
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
 * Logs in a user with the provided email and password.
 * @param {Object} data Login data which includes email and password.
 * @param {string} [userAgent] The user agent of the client.
 * @throws {Object} If the user is not found, throws an error with code 404
 *                  and a message indicating the user is not found.
 * @throws {Object} If the password is invalid, throws an error with code 401
 *                  and a message indicating the email or password is invalid.
 * @returns A Promise that resolves to an object containing the access token
 *          and refresh token.
 */
export const login = async (
  data: z.infer<typeof loginSchema>,
  userAgent?: string
) => {
  const user = await db.user.findUnique({
    where: { email: data.email.toLowerCase() },
    select: { id: true, password: true },
  });

  if (!user || !(await password.verifyValue(data.password, user.password))) {
    throw {
      code: 401,
      error: "INVALID_EMAIL_OR_PASSWORD",
      message: "Invalid email or password!",
    };
  }

  const userId = user.id.toString();
  const [accessToken, refreshToken] = await Promise.all([
    jwt.createToken(userId, accessTokenExpired, {
      userAgent,
    }),
    jwt.createRefreshToken(userId, refreshTokenExpired, {
      userAgent,
    }),
  ]);

  return { accessToken, refreshToken };
};

/**
 * Validates a refresh token and returns the associated user ID.
 *
 * @param refreshToken The refresh token to validate.
 * @param userAgent The user agent of the client.
 * @param isRegenerate Whether to regenerate a new access token and refresh token.
 * @returns The user ID associated with the token, or if `isRegenerate` is true, an object with the new access token and refresh token.
 * @throws {Error} If the token is invalid, expired, or already revoked.
 */
export const processToken = async (
  refreshToken: string,
  userAgent?: string,
  isRegenerate: boolean = false
) => {
  const result = await db.$transaction(async (prisma) => {
    const token = await jwt.validateToken(refreshToken);

    if (!token || !token.jwtId) {
      throw {
        code: 401,
        error: "INVALID_TOKEN",
        message: "The provided token is invalid, expired, or already revoked.",
      };
    }

    const tokenRecord = await prisma.userToken.findFirst({
      where: {
        jwtId: token.jwtId,
        revoked: false,
        expiresAt: { gte: new Date() },
      },
      select: { id: true, userId: true, userAgent: true },
    });

    if (!tokenRecord) {
      throw {
        code: 401,
        error: "INVALID_TOKEN",
        message: "The provided token is invalid, expired, or already revoked.",
      };
    }

    if (
      isRegenerate &&
      userAgent &&
      tokenRecord.userAgent &&
      !compareUserAgent(userAgent, tokenRecord.userAgent)
    ) {
      await prisma.userToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      });

      throw {
        code: 401,
        error: "USER_AGENT_MISMATCH",
        message:
          "User-agent mismatch. Token cannot be refreshed from this device.",
      };
    }

    await prisma.userToken.update({
      where: { id: tokenRecord.id },
      data: {
        revoked: true,
        userAgent: userAgent || tokenRecord.userAgent,
      },
    });

    return tokenRecord;
  });

  if (isRegenerate) {
    const userId = result.userId.toString();
    if (!userId) {
      throw {
        code: 401,
        error: "INVALID_USER",
        message: "The user associated with the provided token is not found.",
      };
    }

    const [newAccessToken, newRefreshToken] = await Promise.all([
      jwt.createToken(userId, accessTokenExpired, { userAgent }),
      jwt.createRefreshToken(userId, refreshTokenExpired, { userAgent }),
    ]);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  return true;
};
