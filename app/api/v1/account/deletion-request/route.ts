import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/v1/account/deletion-request - Check if current user has an active deletion request
export async function GET() {
  try {
    const user = await requireAuth();

    // Find latest deletion audit log for this user
    const latestRequest = await db.auditLog.findFirst({
      where: {
        userId: user.id,
        action: { in: ["ACCOUNT_DELETION_REQUESTED", "ACCOUNT_DELETION_CANCELLED", "ACCOUNT_DELETION_COMPLETED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    const isPending = latestRequest?.action === "ACCOUNT_DELETION_REQUESTED";
    let details: any = null;
    if (latestRequest?.details) {
      try {
        details = JSON.parse(latestRequest.details);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      hasPendingRequest: isPending,
      request: isPending ? { ...latestRequest, parsedDetails: details } : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Authentication required" },
      { status: 401 }
    );
  }
}

// POST /api/v1/account/deletion-request - Submit account deletion request (NDPR / GDPR)
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Customer requested account deletion";
    const feedback = body.feedback || "";

    // Check if there is already a pending request
    const existing = await db.auditLog.findFirst({
      where: {
        userId: user.id,
        action: "ACCOUNT_DELETION_REQUESTED",
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      // Check if cancelled after
      const cancelled = await db.auditLog.findFirst({
        where: {
          userId: user.id,
          action: "ACCOUNT_DELETION_CANCELLED",
          createdAt: { gt: existing.createdAt },
        },
      });

      if (!cancelled) {
        return NextResponse.json(
          {
            success: true,
            message: "An account deletion request is already pending review.",
            isPending: true,
          },
          { status: 200 }
        );
      }
    }

    const requestedAt = new Date();
    const gracePeriodDays = 14;
    const purgeDate = new Date(requestedAt.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);

    const detailsPayload = JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      reason,
      feedback,
      requestedAt: requestedAt.toISOString(),
      gracePeriodDays,
      scheduledPurgeDate: purgeDate.toISOString(),
      status: "PENDING_ADMIN_REVIEW",
    });

    // Record immutable audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "ACCOUNT_DELETION_REQUESTED",
        resourceType: "User",
        resourceId: user.id,
        details: detailsPayload,
      },
    });

    // Create in-app notification for the user
    await db.notification.create({
      data: {
        userId: user.id,
        title: "Account Deletion Request Received",
        message: `Your account deletion request has been submitted under NDPR compliance. A 14-day grace period is active until ${purgeDate.toLocaleDateString()}. You may cancel anytime before this date.`,
        type: "WARNING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account deletion request submitted successfully. The platform administrator has been notified.",
      gracePeriodDays,
      scheduledPurgeDate: purgeDate.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit deletion request" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/account/deletion-request - Cancel pending account deletion request
export async function DELETE() {
  try {
    const user = await requireAuth();

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "ACCOUNT_DELETION_CANCELLED",
        resourceType: "User",
        resourceId: user.id,
        details: JSON.stringify({
          cancelledAt: new Date().toISOString(),
          email: user.email,
        }),
      },
    });

    await db.notification.create({
      data: {
        userId: user.id,
        title: "Account Deletion Request Cancelled",
        message: "Your account deletion request has been successfully cancelled. Your account remains fully active.",
        type: "INFO",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account deletion request successfully cancelled. Your account and property records are retained.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel request" },
      { status: 500 }
    );
  }
}
