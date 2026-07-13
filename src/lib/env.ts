import { z } from "zod";

// Server-side environment variables schema
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_TRUST_HOST: z.string().optional(),
  ADMIN_USERNAME: z.string().min(3).optional(),
  ADMIN_PASSWORD: z.string().min(6).optional(),
  // Email (all optional)
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_SECURE: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

// Client-side (NEXT_PUBLIC_*) environment variables
const clientEnvSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string().optional(),
});

function validateServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `❌ Invalid environment variables:\n${formatted}\n\nPlease check your .env.local file.`
    );
  }
  return result.data;
}

function validateClientEnv() {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  });
  if (!result.success) {
    throw new Error("Invalid client environment variables");
  }
  return result.data;
}

// Only validate on server side (not during build for client bundle)
export const env =
  typeof window === "undefined"
    ? validateServerEnv()
    : ({} as ReturnType<typeof validateServerEnv>);
export const clientEnv = validateClientEnv();
