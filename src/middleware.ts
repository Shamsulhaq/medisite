// -----------------------------------------------------------------------------
// Next.js Middleware — protects /admin and /api/admin routes.
// Uses NextAuth v5 edge-compatible auth config (no Node.js APIs).
// The `authorized` callback in auth.config.ts handles redirect logic.
// -----------------------------------------------------------------------------

import NextAuth from "next-auth";
import authConfig from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
