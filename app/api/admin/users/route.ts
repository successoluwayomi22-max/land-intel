import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
    }

    if (!["FREE", "PAID", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Protect main/seed admin
    if (
      targetUser.email === "admin@diasporaland.ai" ||
      targetUser.email === "admin@landintel.ai" ||
      targetUser.role === "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "The primary platform administrator account cannot be demoted or modified." },
        { status: 403 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    await logAudit({
      userId: admin.id,
      action: "ADMIN_USER_ROLE_UPDATED",
      resourceType: "User",
      resourceId: userId,
      details: { updatedTo: role, targetEmail: updatedUser.email },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    // Support either query param ?userId=... or JSON body { userId }
    let userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      try {
        const body = await request.json();
        userId = body.userId;
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ error: "Missing required parameter: userId" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found or has already been deleted" }, { status: 404 });
    }

    // Protect main/seed admin
    if (
      targetUser.email === "admin@diasporaland.ai" ||
      targetUser.email === "admin@landintel.ai" ||
      targetUser.role === "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "The primary platform administrator account cannot be deleted." },
        { status: 403 }
      );
    }

    // Protect self-deletion: Admin cannot delete their own active account
    if (targetUser.id === admin.id) {
      return NextResponse.json(
        { error: "You cannot delete your own active administrator account" },
        { status: 400 }
      );
    }

    // Protect SUPER_ADMIN deletion: Only SUPER_ADMIN can delete another admin/super admin
    if ((targetUser.role === "SUPER_ADMIN" || targetUser.role === "ADMIN") && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Permission denied: Only Super Administrators can delete administrator accounts" },
        { status: 403 }
      );
    }

    // 1. Log immutable audit trail BEFORE deletion (userId set to null to avoid FK constraint violation)
    await db.auditLog.create({
      data: {
        userId: null,
        action: "ADMIN_USER_DELETED",
        resourceType: "User",
        resourceId: targetUser.id,
        details: JSON.stringify({
          deletedUserId: targetUser.id,
          deletedEmail: targetUser.email,
          deletedName: targetUser.name,
          deletedRole: targetUser.role,
          deletedByAdmin: admin.email,
          deletedAt: new Date().toISOString(),
        }),
      },
    });

    // 2. Cascade delete the user record
    await db.user.delete({
      where: { id: targetUser.id },
    });

    return NextResponse.json({
      success: true,
      message: `User account for ${targetUser.email} has been permanently deleted.`,
    });
  } catch (error: any) {
    console.error("[ADMIN_DELETE_USER_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}

