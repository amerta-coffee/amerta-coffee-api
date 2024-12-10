import { z } from "@hono/zod-openapi";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(255, "Password must not exceed 255 characters")
  .regex(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,255}$/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g., @, #, $, %)."
  )
  .openapi({
    description:
      "The password for the user. It should meet security standards.",
  });

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format.")
    .min(1, "Email is required.")
    .max(128, "Email must not exceed 128 characters.")
    .openapi({
      description: "The email of the user.",
    }),
  password: passwordSchema,
});

export const registerSchema = loginSchema
  .extend({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters long.")
      .max(100, "Name must not exceed 100 characters.")
      .openapi({
        description: "The name of the user.",
      }),
    confirmPassword: passwordSchema.openapi({
      description: "The confirm password for the user.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required!")
    .max(255, "Refresh token must not exceed 255 characters.")
    .openapi({
      description: "The refresh token of the user.",
    }),
});
