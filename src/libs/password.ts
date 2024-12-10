import { Bcrypt } from "oslo/password";

const isDevelopment = process.env.WEB_ENV === "development";
const saltRounds = parseInt(process.env.SALT_ROUNDS || "10");
const bcrypt = new Bcrypt({ cost: saltRounds });

/**
 * Hashes a given password with a salt.
 *
 * @param password The password to hash.
 * @returns A Promise that resolves to the hashed password.
 */
export const hashValue = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password);
  } catch (error: any) {
    throw {
      code: 500,
      error: "INTERNAL_SERVER_ERROR",
      message: isDevelopment
        ? error.message || "Failed to hash password."
        : "Please contact the admin.",
    };
  }
};

/**
 * Verifies a given password against a hashed password.
 *
 * @param password The password to verify.
 * @param hashedValue The hashed password to compare against.
 * @returns A Promise that resolves to a boolean indicating whether the password matches the hashed password.
 */
export const verifyValue = async (
  value: string,
  hashedValue: string
): Promise<boolean> => {
  try {
    return await bcrypt.verify(hashedValue, value);
  } catch (error: any) {
    throw {
      code: 500,
      error: "INTERNAL_SERVER_ERROR",
      message: isDevelopment
        ? error.message || "Failed to verify password."
        : "Please contact the admin.",
    };
  }
};
