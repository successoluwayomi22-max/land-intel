import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { resend, EMAIL_FROM, BRAND_EMAIL, isEmailEnabled } from "@/lib/email/client";

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
            message: "An account deletion request is already pending administrator review.",
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

    // 1. Record immutable audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "ACCOUNT_DELETION_REQUESTED",
        resourceType: "User",
        resourceId: user.id,
        details: detailsPayload,
      },
    });

    // 2. Create in-app notification for the requesting user
    await db.notification.create({
      data: {
        userId: user.id,
        title: "Account Deletion Request Received",
        message: `Your account deletion request has been submitted under NDPR compliance. A 14-day grace period is active until ${purgeDate.toLocaleDateString()}. Platform compliance administrators have been notified.`,
        type: "WARNING",
      },
    });

    // 3. Dispatch in-app notifications to ALL platform administrators
    const admins = await db.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "⚠️ NDPR Statutory Account Deletion Request",
          message: `Customer ${user.name} (${user.email}, ${user.role}) has submitted an account deletion request under NDPR/GDPR. 14-day statutory grace period ends on ${purgeDate.toLocaleDateString()}. Please review the compliance queue.`,
          type: "WARNING",
        },
      }).catch((err) => console.error(`[ADMIN_NOTIF_ERROR] Failed for admin ${admin.id}:`, err));
    }

    // 4. Send priority administrative alert email to BRAND_EMAIL and all admin emails
    if (isEmailEnabled() && resend) {
      const adminEmails = Array.from(new Set([BRAND_EMAIL, ...admins.map((a) => a.email)]));
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; margin-bottom: 20px;">
            <strong style="color: #991b1b; font-size: 16px;">Statutory Right to Erasure Request (NDPR 2019 / GDPR Art. 17)</strong>
          </div>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            A registered customer has formally submitted an account and data erasure request.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; color: #64748b; font-weight: bold; width: 35%;">Customer Name:</td><td style="padding: 8px; color: #0f172a;">${user.name}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; color: #64748b; font-weight: bold;">Email:</td><td style="padding: 8px; color: #0f172a;">${user.email}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; color: #64748b; font-weight: bold;">Account Role:</td><td style="padding: 8px; color: #0f172a;">${user.role}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; color: #64748b; font-weight: bold;">Submission Date:</td><td style="padding: 8px; color: #0f172a;">${requestedAt.toUTCString()}</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; color: #64748b; font-weight: bold;">Statutory Purge Date:</td><td style="padding: 8px; color: #b91c1c; font-weight: bold;">${purgeDate.toUTCString()} (14 Days)</td></tr>
            <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; color: #64748b; font-weight: bold;">Reason Stated:</td><td style="padding: 8px; color: #0f172a;">${reason}</td></tr>
            ${feedback ? `<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 8px; color: #64748b; font-weight: bold;">Feedback:</td><td style="padding: 8px; color: #0f172a;">${feedback}</td></tr>` : ""}
          </table>
          <div style="margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://land-intel-omega.vercel.app"}/admin?tab=users" style="background-color: #0f172a; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block;">
              Open Admin Compliance Queue &rarr;
            </a>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 24px;">
            LandIntel Automated Administrative Dispatch • Compliance & Legal Governance
          </p>
        </div>
      `;

      for (const recipient of adminEmails) {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: recipient,
          replyTo: BRAND_EMAIL,
          subject: `[ADMIN ALERT] Account Deletion Request — ${user.name} (${user.email})`,
          html,
        }).catch((err) => {
          console.error(`[DELETION_EMAIL_ERROR] Failed sending admin deletion alert to ${recipient}:`, err);
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account deletion request submitted successfully. Platform administrators have received in-app and email notifications.",
      sentToAdmin: true,
      gracePeriodDays,
      scheduledPurgeDate: purgeDate.toISOString(),
    });
  } catch (error: any) {
    console.error("[DELETION_REQUEST_ERROR]", error);
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

    // Alert admins that deletion was cancelled
    const admins = await db.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "Account Deletion Request Cancelled",
          message: `Customer ${user.name} (${user.email}) has cancelled their account deletion request during the 14-day cooling-off period.`,
          type: "INFO",
        },
      }).catch(() => {});
    }

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
