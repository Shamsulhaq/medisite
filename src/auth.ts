// -----------------------------------------------------------------------------
// NextAuth.js v5 (Auth.js) — full configuration (Node.js runtime).
// Extends auth.config.ts with the Credentials authorize function that
// requires Node.js APIs (crypto, fs) for password verification.
// -----------------------------------------------------------------------------

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials, getUserByUsername } from "@/lib/auth";
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
      async authorize(credentials) {
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
          email: user.role, // piggyback role in email field for session
        };
      },
    }),
  ],
});
