// -----------------------------------------------------------------------------
// NextAuth.js v5 module augmentation — extends the default types to include
// custom fields (role, username) on User, Session, and JWT objects.
// This replaces the old hack of piggybacking role on the email field.
// -----------------------------------------------------------------------------

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: string;
    username?: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
    username?: string;
  }
}
