// -----------------------------------------------------------------------------
// Authentication module — uses PostgreSQL via Prisma for multi-user support.
//   - Passwords hashed with scrypt (Node crypto).
//   - Session management handled by NextAuth (see src/auth.ts).
//   - Supports DOCTOR and ATTENDANT roles with fine-grained permissions.
// This runs only on the Node.js runtime (server components / actions / routes).
// -----------------------------------------------------------------------------

import crypto from "crypto";
import prisma from "@/lib/db";
import type { UserRole } from "@prisma/client";

export type { UserRole };

export type UserPermissions = {
  canCreatePatient: boolean;
  canAddVitals: boolean;
  canAddTestReport: boolean;
  canConfirmAppointment: boolean;
  canPrintPrescription: boolean;
  canCollectFee: boolean;
  canViewPatients: boolean;
  canViewAppointments: boolean;
  canWriteRx: boolean;
  canEditConsultation: boolean;
  canManageSettings: boolean;
  canManageBlog: boolean;
  canManageMedicines: boolean;
  canManageUsers: boolean;
};

export type AdminUser = {
  id: string;
  username: string;
  salt: string;
  hash: string;
  role: UserRole;
  displayName: string;
  active: boolean;
  permissions: UserPermissions;
};

// ---- Default permissions per role ------------------------------------------

const DOCTOR_PERMISSIONS: UserPermissions = {
  canCreatePatient: true,
  canAddVitals: true,
  canAddTestReport: true,
  canConfirmAppointment: true,
  canPrintPrescription: true,
  canCollectFee: true,
  canViewPatients: true,
  canViewAppointments: true,
  canWriteRx: true,
  canEditConsultation: true,
  canManageSettings: true,
  canManageBlog: true,
  canManageMedicines: true,
  canManageUsers: true,
};

const ATTENDANT_PERMISSIONS: UserPermissions = {
  canCreatePatient: true,
  canAddVitals: true,
  canAddTestReport: true,
  canConfirmAppointment: true,
  canPrintPrescription: true,
  canCollectFee: true,
  canViewPatients: true,
  canViewAppointments: true,
  canWriteRx: false,
  canEditConsultation: false,
  canManageSettings: false,
  canManageBlog: false,
  canManageMedicines: false,
  canManageUsers: false,
};

export function getDefaultPermissions(role: UserRole): UserPermissions {
  return role === "DOCTOR" ? { ...DOCTOR_PERMISSIONS } : { ...ATTENDANT_PERMISSIONS };
}

// ---- Password hashing ------------------------------------------------------

export function hashPassword(
  password: string,
  salt?: string
): { salt: string; hash: string } {
  const useSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, useSalt, 64).toString("hex");
  return { salt: useSalt, hash: derived };
}

export function verifyPassword(
  password: string,
  salt: string,
  hash: string
): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

// ---- User persistence (Prisma) ---------------------------------------------

/**
 * Ensures at least one user exists. On first run (empty DB), seeds a
 * default DOCTOR user from ADMIN_USERNAME/ADMIN_PASSWORD env vars.
 */
async function ensureDefaultUser(): Promise<void> {
  const count = await prisma.user.count();
  if (count === 0) {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const { salt, hash } = hashPassword(password);
    await prisma.user.create({
      data: {
        username,
        salt,
        hash,
        role: "DOCTOR",
        displayName: username,
        active: true,
        permissions: DOCTOR_PERMISSIONS as object,
      },
    });
  }
}

/**
 * Get the first/main user (for backward compatibility with single-user API).
 * Seeds default user if DB is empty.
 */
export async function getUser(): Promise<AdminUser> {
  await ensureDefaultUser();
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("No users found");
  return {
    id: user.id,
    username: user.username,
    salt: user.salt,
    hash: user.hash,
    role: user.role,
    displayName: user.displayName,
    active: user.active,
    permissions: mergePermissions(user.role, user.permissions as Record<string, boolean> | null),
  };
}

export async function getUserByUsername(username: string): Promise<AdminUser | null> {
  await ensureDefaultUser();
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    salt: user.salt,
    hash: user.hash,
    role: user.role,
    displayName: user.displayName,
    active: user.active,
    permissions: mergePermissions(user.role, user.permissions as Record<string, boolean> | null),
  };
}

export async function getUserById(id: string): Promise<AdminUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    salt: user.salt,
    hash: user.hash,
    role: user.role,
    displayName: user.displayName,
    active: user.active,
    permissions: mergePermissions(user.role, user.permissions as Record<string, boolean> | null),
  };
}

export async function getUsers(): Promise<AdminUser[]> {
  await ensureDefaultUser();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return users.map((u) => ({
    id: u.id,
    username: u.username,
    salt: u.salt,
    hash: u.hash,
    role: u.role,
    displayName: u.displayName,
    active: u.active,
    permissions: mergePermissions(u.role, u.permissions as Record<string, boolean> | null),
  }));
}

export async function createUser(input: {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  createdBy?: string;
}): Promise<AdminUser> {
  const { salt, hash } = hashPassword(input.password);
  const defaultPerms = getDefaultPermissions(input.role);
  const user = await prisma.user.create({
    data: {
      username: input.username,
      salt,
      hash,
      role: input.role,
      displayName: input.displayName,
      active: true,
      permissions: defaultPerms as object,
      createdBy: input.createdBy,
    },
  });
  return {
    id: user.id,
    username: user.username,
    salt: user.salt,
    hash: user.hash,
    role: user.role,
    displayName: user.displayName,
    active: user.active,
    permissions: defaultPerms,
  };
}

export async function updateUser(
  id: string,
  data: {
    displayName?: string;
    role?: UserRole;
    active?: boolean;
    permissions?: Partial<UserPermissions>;
    password?: string;
  }
): Promise<AdminUser | null> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.password) {
    const { salt, hash } = hashPassword(data.password);
    updateData.salt = salt;
    updateData.hash = hash;
  }
  if (data.permissions) {
    const currentPerms = mergePermissions(
      data.role ?? existing.role,
      existing.permissions as Record<string, boolean> | null
    );
    updateData.permissions = { ...currentPerms, ...data.permissions } as object;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });
  return {
    id: user.id,
    username: user.username,
    salt: user.salt,
    hash: user.hash,
    role: user.role,
    displayName: user.displayName,
    active: user.active,
    permissions: mergePermissions(user.role, user.permissions as Record<string, boolean> | null),
  };
}

export async function getPermissions(userId: string): Promise<UserPermissions> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ...ATTENDANT_PERMISSIONS }; // restrictive fallback
  return mergePermissions(user.role, user.permissions as Record<string, boolean> | null);
}

function mergePermissions(role: UserRole, stored: Record<string, boolean> | null): UserPermissions {
  const defaults = getDefaultPermissions(role);
  if (!stored || typeof stored !== "object") return defaults;
  return { ...defaults, ...stored } as UserPermissions;
}

// ---- Credential verification -----------------------------------------------

export async function verifyCredentials(
  username: string,
  password: string
): Promise<boolean> {
  await ensureDefaultUser();
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.active) return false;
  const userMatch =
    username.length === user.username.length &&
    crypto.timingSafeEqual(
      Buffer.from(username),
      Buffer.from(user.username)
    );
  const passMatch = verifyPassword(password, user.salt, user.hash);
  return userMatch && passMatch;
}

export async function updateUsername(username: string): Promise<void> {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return;
  await prisma.user.update({ where: { id: user.id }, data: { username } });
}

export async function updatePassword(password: string): Promise<void> {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return;
  const { salt, hash } = hashPassword(password);
  await prisma.user.update({ where: { id: user.id }, data: { salt, hash } });
}


