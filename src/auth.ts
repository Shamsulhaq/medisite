// -----------------------------------------------------------------------------
// NextAuth.js v5 (Auth.js) — full configuration (Node.js runtime).
// Extends auth.config.ts with the Credentials authorize function that
// requires Node.js APIs (crypto, fs) for password verification.
// -----------------------------------------------------------------------------

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials, getUserByUsername } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import authConfig from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        // Brute-force guard: max 5 login attempts per 30 minutes per IP.
        // The login is a public, unauthenticated endpoint and the primary
        // target for credential-stuffing/brute-force attacks.
        const ip = getClientIp(request as unknown as Request);
        const rl = rateLimit(`login:${ip}`, 5, 30 * 60 * 1000);
        if (!rl.ok) {
          throw new Error(
            "Too many login attempts. Please try again in about 30 minutes."
          );
        }

        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!username || !password) return null;

        const valid = await verifyCredentials(username, password);
        if (!valid) return null;

        const user = await getUserByUsername(username);
        if (!user) return null;

        return {
          id: user.id,
          name: user.username,
          role: user.role,
        };
      },
    }),
  ],
});
