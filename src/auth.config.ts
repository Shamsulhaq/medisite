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
        token.username = user.name ?? undefined;
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.username) {
        session.user.name = token.username as string;
      }
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      if (token.role) {
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isAdminApi = nextUrl.pathname.startsWith("/api/admin");
      const isLoginPage = nextUrl.pathname === "/admin/login";

      // Protect admin API routes — return 401 JSON response
      if (isAdminApi && !isLoggedIn) {
        return Response.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Redirect unauthenticated users to login page
      if (isAdminRoute && !isLoginPage && !isLoggedIn) {
        return Response.redirect(new URL("/admin/login", nextUrl));
      }

      // Redirect logged-in users away from login page
      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
