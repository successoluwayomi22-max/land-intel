import { db } from "@/lib/db";

export interface LogAuditParams {
  userId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        resourceType: params.resourceType || null,
        resourceId: params.resourceId || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    });
  } catch (error) {
    // Non-blocking failure for audit logging
    console.error("[AUDIT_LOG_ERROR]", error);
  }
}
