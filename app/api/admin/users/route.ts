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
