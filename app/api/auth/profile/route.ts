import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword, comparePassword, validatePasswordStrength } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserEntitlements } from "@/lib/services/entitlement";
import { logAudit } from "@/lib/services/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [entitlements, payments, caseCount] = await Promise.all([
      getUserEntitlements(user.id),
      db.payment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.propertyCase.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      user,
      entitlements,
      payments,
      caseCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, currentPassword, newPassword } = body;

    const dataToUpdate: any = {};

    if (name && typeof name === "string" && name.trim().length >= 2) {
      dataToUpdate.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }
      const strengthResult = validatePasswordStrength(newPassword, {
        name: currentUser.name,
        email: currentUser.email,
      });
      if (!strengthResult.isValid) {
        return NextResponse.json(
          { error: strengthResult.message || "New password is too weak. Please include at least 8 characters with letters and numbers." },
          { status: 400 }
        );
      }

      // Fetch existing password hash
      const userRecord = await db.user.findUnique({
        where: { id: currentUser.id },
        select: { passwordHash: true },
      });

      if (!userRecord) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isMatch = await comparePassword(currentPassword, userRecord.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Reject duplicate password (reusing same password as current)
      const isDuplicate = await comparePassword(newPassword, userRecord.passwordHash);
      if (isDuplicate) {
        return NextResponse.json(
          {
            error: "Your new password cannot be the same as your current password. Please choose a new, unique password.",
            code: "DUPLICATE_PASSWORD",
          },
          { status: 400 }
        );
      }

      dataToUpdate.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "No update parameters provided" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: currentUser.id },
      data: dataToUpdate,
      select: { id: true, name: true, email: true, role: true },
    });

    await logAudit({
      userId: currentUser.id,
      action: newPassword ? "USER_PASSWORD_CHANGED" : "USER_PROFILE_UPDATED",
      resourceType: "User",
      resourceId: currentUser.id,
      details: { updatedFields: Object.keys(dataToUpdate) },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
