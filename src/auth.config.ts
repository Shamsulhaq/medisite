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
        token.username = user.name;
        token.userId = user.id;
        token.role = user.email; // role piggybacked on email field
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
        session.user.email = token.role as string; // role accessible as session.user.email
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

      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
