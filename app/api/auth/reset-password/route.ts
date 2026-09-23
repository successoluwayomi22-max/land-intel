import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, validatePasswordStrength, comparePassword } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`reset-pw-${ip}`, 5, 600);
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const { token, email, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Reset token is required or invalid" }, { status: 400 });
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const strengthResult = validatePasswordStrength(password || "");
    if (!strengthResult.isValid) {
      return NextResponse.json(
        { error: strengthResult.message || "Password is too weak. Please include uppercase, lowercase, numbers, and symbols." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.resetToken || user.resetToken !== token) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link. Please request a new one." },
        { status: 400 }
      );
    }

    if (!user.resetExpires || new Date() > user.resetExpires) {
      return NextResponse.json(
        { error: "This password reset token has expired. Please request a new link." },
        { status: 400 }
      );
    }

    // Reject duplicate password (reusing same password as current)
    if (user.passwordHash) {
      const isDuplicate = await comparePassword(password, user.passwordHash);
      if (isDuplicate) {
        return NextResponse.json(
          {
            error: "Your new password cannot be the same as your previous password. Please choose a new, unique password.",
            code: "DUPLICATE_PASSWORD",
          },
          { status: 400 }
        );
      }
    }

    // Hash and store new password, invalidate reset token
    const newHash = await hashPassword(password);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetToken: null,
        resetExpires: null,
      },
    });

    // Also invalidate any existing active sessions for security
    await db.session.deleteMany({
      where: { userId: user.id },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. You can now sign in with your new credentials.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
