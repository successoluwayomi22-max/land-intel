import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    // Find all users who are unverified and not admins
    const unverifiedUsers = await db.user.findMany({
      where: {
        isVerified: false,
        role: "FREE",
      },
      select: { id: true, email: true, name: true },
    });

    if (unverifiedUsers.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: "No unverified customer accounts found to purge.",
      });
    }

    const ids = unverifiedUsers.map((u) => u.id);

    // Batch delete unverified users
    const deleteResult = await db.user.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: null,
        action: "ADMIN_PURGE_UNVERIFIED_USERS",
        resourceType: "User",
        details: JSON.stringify({
          purgedCount: deleteResult.count,
          purgedByAdmin: admin.email,
          purgedEmails: unverifiedUsers.map((u) => u.email),
          purgedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      count: deleteResult.count,
      message: `Successfully purged ${deleteResult.count} unverified account(s).`,
    });
  } catch (error: any) {
    console.error("[PURGE_UNVERIFIED_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to purge unverified accounts" },
      { status: 500 }
    );
  }
}
