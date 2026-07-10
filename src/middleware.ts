// NextAuth.js middleware — protects /admin routes at the edge.
// Uses the edge-compatible auth.config.ts (no Node.js APIs).
import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*"],
};
