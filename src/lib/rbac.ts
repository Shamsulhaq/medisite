// -----------------------------------------------------------------------------
// Role-Based Access Control (RBAC) middleware.
// Checks permissions for the currently authenticated session user.
// -----------------------------------------------------------------------------

import { auth } from "@/auth";
import { getUserByUsername, getPermissions, type UserPermissions } from "@/lib/auth";

export type { UserPermissions };

/**
 * Check if the current session user has the specified permission.
 * Throws an error if not authorized.
 */
export async function requirePermission(permission: keyof UserPermissions): Promise<void> {
  const session = await auth();
  if (!session?.user?.name) {
    throw new Error("Unauthorized: No active session");
  }

  const user = await getUserByUsername(session.user.name);
  if (!user) {
    throw new Error("Unauthorized: User not found");
  }
  if (!user.active) {
    throw new Error("Unauthorized: User account is deactivated");
  }

  const perms = await getPermissions(user.id);
  if (!perms[permission]) {
    throw new Error(`Forbidden: Missing permission '${permission}'`);
  }
}

/**
 * Check if the current session user has the specified permission.
 * Returns boolean without throwing.
 */
export async function checkPermission(permission: keyof UserPermissions): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.name) return false;

    const user = await getUserByUsername(session.user.name);
    if (!user || !user.active) return false;

    const perms = await getPermissions(user.id);
    return perms[permission] ?? false;
  } catch {
    return false;
  }
}

/**
 * Get the current session user's full info (id, role, permissions).
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.name) return null;

  const user = await getUserByUsername(session.user.name);
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    permissions: user.permissions,
  };
}
