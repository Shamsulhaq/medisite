"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createUser,
  getUsers,
  updateUser,
  getUserByUsername,
  type UserPermissions,
  type UserRole,
} from "@/lib/auth";
import { requirePermission, getCurrentUser } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function getUsersAction() {
  await requireSession();
  await requirePermission("canManageUsers");
  const users = await getUsers();
  // Don't expose salt/hash
  return users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    displayName: u.displayName,
    active: u.active,
    permissions: u.permissions,
  }));
}

export async function createUserAction(input: {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireSession();
  await requirePermission("canManageUsers");

  if (!input.username?.trim() || input.username.length < 3) {
    return { ok: false, error: "Username must be at least 3 characters." };
  }
  if (!input.password || input.password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const existing = await getUserByUsername(input.username);
  if (existing) {
    return { ok: false, error: "Username already exists." };
  }

  const current = await getCurrentUser();
  await createUser({
    ...input,
    createdBy: current?.id,
  });

  if (current) {
    await logAudit(current.id, "CREATE_USER", "user", undefined, {
      username: input.username,
      role: input.role,
    });
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserAction(
  id: string,
  data: {
    displayName?: string;
    role?: UserRole;
    active?: boolean;
    permissions?: Partial<UserPermissions>;
    password?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  await requireSession();
  await requirePermission("canManageUsers");

  const updated = await updateUser(id, data);
  if (!updated) {
    return { ok: false, error: "User not found." };
  }

  const current = await getCurrentUser();
  if (current) {
    await logAudit(current.id, "UPDATE_USER", "user", id, {
      username: updated.username,
      changes: Object.keys(data),
    });
  }

  revalidatePath("/admin/users");
  return { ok: true };
}
