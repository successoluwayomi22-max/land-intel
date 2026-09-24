import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, validatePasswordStrength, comparePassword } from "@/lib/auth";
import { hashOTP } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`reset-pw-${ip}`, 5, 600);
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const { token, code, email, password } = body;

    const rawCodeOrToken = (code || token || "").trim();

    if (!rawCodeOrToken) {
      return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const strengthResult = validatePasswordStrength(password || "", { email: normalizedEmail });
    if (!strengthResult.isValid) {
      return NextResponse.json(
        { error: strengthResult.message || "Password is too weak. Please include at least 8 characters with letters and numbers." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired password reset request. Please request a new code." },
        { status: 400 }
      );
    }

    if (!user.resetExpires || new Date() > user.resetExpires) {
      return NextResponse.json(
        { error: "This password reset code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Check if token matches directly (legacy hex token) or hashed OTP (6-digit code)
    const expectedToken = user.resetToken;
    const matchesHashedCode = hashOTP(rawCodeOrToken) === expectedToken;
    const matchesRawToken = rawCodeOrToken === expectedToken;

    if (!matchesHashedCode && !matchesRawToken) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check and try again." },
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

    // Hash and store new password, invalidate reset token, and ensure account is verified
    const newHash = await hashPassword(password);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        isVerified: true, // Proving email ownership via reset token verifies the account
        otpHash: null,
        otpExpiresAt: null,
        resetToken: null,
        resetExpires: null,
      },
    });

    // Invalidate any existing active sessions for security
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
