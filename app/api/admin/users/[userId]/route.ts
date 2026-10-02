import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await requireAdmin();
    const userId = params.userId;

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

    if (targetUser.id === admin.id) {
      return NextResponse.json(
        { error: "You cannot delete your own active administrator account" },
        { status: 400 }
      );
    }

    if ((targetUser.role === "SUPER_ADMIN" || targetUser.role === "ADMIN") && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Permission denied: Only Super Administrators can delete administrator accounts" },
        { status: 403 }
      );
    }

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

    await db.user.delete({
      where: { id: targetUser.id },
    });

    return NextResponse.json({
      success: true,
      message: `User account for ${targetUser.email} has been permanently deleted.`,
    });
  } catch (error: any) {
    console.error("[ADMIN_DELETE_USER_PARAM_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
