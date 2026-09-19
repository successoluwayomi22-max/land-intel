import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getPendingDeletionRequests } from "@/lib/deletionRequests";

// GET /api/admin/deletion-requests - List pending requests and audit trail
export async function GET() {
  try {
    await requireAdmin();

    const pending = await getPendingDeletionRequests();

    // Also fetch historical completed/cancelled/rejected logs
    const historyLogs = await db.auditLog.findMany({
      where: {
        action: {
          in: [
            "ACCOUNT_DELETION_COMPLETED",
            "ACCOUNT_DELETION_CANCELLED",
            "ACCOUNT_DELETION_REJECTED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const history = historyLogs.map((log) => {
      let parsed: any = {};
      try {
        if (log.details) parsed = JSON.parse(log.details);
      } catch {}

      return {
        id: log.id,
        userId: log.userId || log.resourceId,
        action: log.action,
        timestamp: log.createdAt.toISOString(),
        details: parsed,
      };
    });

    return NextResponse.json({
      success: true,
      pending,
      count: pending.length,
      history,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Unauthorized: Admin access required" },
      { status: 403 }
    );
  }
}

// POST /api/admin/deletion-requests - Approve and purge or reject
export async function POST(req: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const { targetUserId, action, reason } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { success: false, error: "targetUserId and action ('APPROVE_AND_PURGE' | 'REJECT') are required" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      include: {
        _count: {
          select: {
            propertyCases: true,
            reports: true,
            payments: true,
          },
        },
      },
    });

    if (action === "APPROVE_AND_PURGE") {
      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: "User does not exist or has already been deleted" },
          { status: 404 }
        );
      }

      // Prevent accidental purge of admin/super admin accounts
      if (targetUser.role === "SUPER_ADMIN" || targetUser.role === "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Cannot purge an administrator account via automated queue" },
          { status: 403 }
        );
      }

      // 1. Log immutable NDPR/GDPR compliance audit entry before deletion
      await db.auditLog.create({
        data: {
          userId: null, // User is being deleted, set to null to avoid FK violation
          action: "ACCOUNT_DELETION_COMPLETED",
          resourceType: "User",
          resourceId: targetUserId,
          details: JSON.stringify({
            purgedUserId: targetUserId,
            purgedEmail: targetUser.email,
            purgedName: targetUser.name,
            purgedRole: targetUser.role,
            purgedByAdmin: adminUser.email,
            casesPurged: targetUser._count.propertyCases,
            reportsPurged: targetUser._count.reports,
            paymentsPurged: targetUser._count.payments,
            complianceStandard: "NDPR / GDPR Article 17 (Right to Erasure)",
            purgedAt: new Date().toISOString(),
          }),
        },
      });

      // 2. Cascade delete the user record
      // User relations (sessions, memberships, property cases, documents, reports, notifications) cascade delete
      await db.user.delete({
        where: { id: targetUserId },
      });

      return NextResponse.json({
        success: true,
        message: `Account for ${targetUser.email} has been permanently purged in accordance with NDPR/GDPR.`,
      });
    } else if (action === "REJECT") {
      // Record rejection
      await db.auditLog.create({
        data: {
          userId: targetUserId,
          action: "ACCOUNT_DELETION_REJECTED",
          resourceType: "User",
          resourceId: targetUserId,
          details: JSON.stringify({
            rejectedByAdmin: adminUser.email,
            reason: reason || "Admin reviewed and declined deletion (e.g. pending legal obligation or escrow hold)",
            rejectedAt: new Date().toISOString(),
          }),
        },
      });

      // Send in-app notification to user if user exists
      if (targetUser) {
        await db.notification.create({
          data: {
            userId: targetUserId,
            title: "Account Deletion Request Update",
            message: `Your account deletion request was reviewed by our compliance officer and could not be completed: ${reason || "Account has active legal or financial obligations."}`,
            type: "WARNING",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Account deletion request was rejected. Customer has been notified.",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Supported: APPROVE_AND_PURGE, REJECT" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process deletion request" },
      { status: 500 }
    );
  }
}
