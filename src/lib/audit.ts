// -----------------------------------------------------------------------------
// Audit logging module — records all significant actions for traceability.
// Uses Prisma AuditLog model with PostgreSQL.
// -----------------------------------------------------------------------------

import prisma from "@/lib/db";
import type { UserRole } from "@prisma/client";

export type AuditLogEntry = {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
};

export type AuditFilters = {
  userId?: string;
  entity?: string;
  action?: string;
  from?: Date | string;
  to?: Date | string;
  limit?: number;
  offset?: number;
};

/**
 * Log an audit event. Non-blocking — errors are caught and logged to console.
 */
export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    // Fetch user info for denormalization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        userName: user?.username ?? "unknown",
        userRole: user?.role ?? "ATTENDANT",
        action,
        entity,
        entityId: entityId ?? null,
        details: details ? (details as object) : undefined,
      },
    });
  } catch (err) {
    console.error("[audit] Failed to log:", err);
  }
}

/**
 * Retrieve audit logs with optional filtering.
 */
export async function getAuditLogs(filters?: AuditFilters): Promise<AuditLogEntry[]> {
  const where: Record<string, unknown> = {};

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.entity) where.entity = filters.entity;
  if (filters?.action) where.action = filters.action;

  if (filters?.from || filters?.to) {
    const createdAt: Record<string, Date> = {};
    if (filters.from) createdAt.gte = new Date(filters.from);
    if (filters.to) createdAt.lte = new Date(filters.to);
    where.createdAt = createdAt;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 100,
    skip: filters?.offset ?? 0,
  });

  return logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    userName: log.userName,
    userRole: log.userRole,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    details: log.details as Record<string, unknown> | null,
    createdAt: log.createdAt,
  }));
}
