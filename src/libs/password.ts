import { Argon2id } from "oslo/password";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const argon2id = new Argon2id({
  memorySize: 8192,
  iterations: 4,
  parallelism: 2,
  tagLength: 32,
  secret: new TextEncoder().encode(JWT_SECRET),
});

/**
 * Hashes the given password using Argon2id algorithm.
 *
 * @param password The password to hash.
 * @returns A Promise that resolves to the hashed password.
 */
export const hashValue = async (password: string): Promise<string> => {
  return await argon2id.hash(password);
};

/**
 * Verifies a password against a hashed password.
 *
 * @param password The password to verify.
 * @param hash The hashed password to compare against.
 * @returns A Promise that resolves to a boolean indicating whether the password is correct.
 */
export const verifyValue = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await argon2id.verify(hash, password);
};
