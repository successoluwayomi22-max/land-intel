import { db } from "@/lib/db";

export interface PendingDeletionRequest {
  id: string; // audit log id
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  requestedAt: string;
  scheduledPurgeDate: string;
  gracePeriodDays: number;
  reason: string;
  feedback?: string;
  daysRemaining: number;
  isOverdue: boolean;
  status: "PENDING" | "GRACE_PERIOD_ACTIVE" | "READY_FOR_PURGE";
}

/**
 * Retrieves all currently active/pending account deletion requests across the platform.
 * A request is pending if the most recent deletion audit log for a user is 'ACCOUNT_DELETION_REQUESTED'.
 */
export async function getPendingDeletionRequests(): Promise<PendingDeletionRequest[]> {
  try {
    // Fetch all deletion-related audit logs ordered newest first
    const logs = await db.auditLog.findMany({
      where: {
        action: {
          in: [
            "ACCOUNT_DELETION_REQUESTED",
            "ACCOUNT_DELETION_CANCELLED",
            "ACCOUNT_DELETION_COMPLETED",
            "ACCOUNT_DELETION_REJECTED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const userLatestMap = new Map<string, typeof logs[0]>();

    for (const log of logs) {
      const uId = log.userId || log.resourceId;
      if (!uId) continue;
      if (!userLatestMap.has(uId)) {
        userLatestMap.set(uId, log);
      }
    }

    const pending: PendingDeletionRequest[] = [];
    const now = new Date().getTime();

    for (const [userId, log] of userLatestMap.entries()) {
      if (log.action !== "ACCOUNT_DELETION_REQUESTED") continue;

      let parsed: any = {};
      try {
        if (log.details) parsed = JSON.parse(log.details);
      } catch {}

      const requestedAt = log.createdAt.toISOString();
      const purgeDate = parsed.scheduledPurgeDate
        ? new Date(parsed.scheduledPurgeDate)
        : new Date(log.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);

      const msRemaining = purgeDate.getTime() - now;
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      const isOverdue = msRemaining <= 0;

      pending.push({
        id: log.id,
        userId: userId,
        userName: log.user?.name || parsed.name || "Customer",
        userEmail: log.user?.email || parsed.email || "Unknown Email",
        userRole: log.user?.role || parsed.role || "USER",
        requestedAt,
        scheduledPurgeDate: purgeDate.toISOString(),
        gracePeriodDays: parsed.gracePeriodDays || 14,
        reason: parsed.reason || "Customer requested account deletion",
        feedback: parsed.feedback || "",
        daysRemaining,
        isOverdue,
        status: isOverdue ? "READY_FOR_PURGE" : "GRACE_PERIOD_ACTIVE",
      });
    }

    return pending;
  } catch (error) {
    console.error("Error fetching pending deletion requests:", error);
    return [];
  }
}
