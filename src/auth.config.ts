// -----------------------------------------------------------------------------
// NextAuth.js v5 — base configuration (Edge-compatible, no Node.js APIs).
// This file contains providers, pages, session config, and callbacks
// but does NOT import anything that requires the Node.js runtime.
// Used by the middleware (Edge) and re-exported from auth.ts (Node.js).
// -----------------------------------------------------------------------------

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export default {
  providers: [
    Credentials({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // authorize is only called server-side (Node.js), never in middleware.
      // It's defined in src/auth.ts where Node.js APIs are available.
    }),
  ],

  pages: {
    signIn: "/admin/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.username) {
        session.user.name = token.username as string;
      }
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isLoginPage = nextUrl.pathname === "/admin/login";

      if (isAdminRoute && !isLoginPage && !isLoggedIn) {
        return Response.redirect(new URL("/admin/login", nextUrl));
      }

      // If logged in and on login page, redirect to dashboard.
      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
