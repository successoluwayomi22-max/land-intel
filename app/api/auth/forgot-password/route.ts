import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { generateOTP, hashOTP, sendPasswordResetEmail } from "@/lib/email/send";
import { isEmailEnabled } from "@/lib/email/client";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    // Rate limit: 30 requests per 10 minutes per IP
    const rateCheck = checkRateLimit(`forgot-pw-${ip}`, 30, 600);
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // To prevent email enumeration, return a success message even if the user isn't found
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists for this email, a 6-digit verification code has been dispatched.",
      });
    }

    // Generate secure 6-digit OTP
    const otpCode = generateOTP();
    const otpHash = hashOTP(otpCode);
    const expiresInMinutes = 10;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: otpHash,
        resetExpires: expiresAt,
      },
    });

    console.log(`[AUTH] Password reset OTP requested for ${normalizedEmail}. OTP: ${otpCode} (expires in ${expiresInMinutes}m)`);

    // Non-blocking email dispatch
    sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      otpCode,
      expiresInMinutes,
    }).catch((err) => {
      console.error("[AUTH] Password reset email dispatch failed:", err);
    });

    // In sandbox or when email provider is disabled, return devOtpCode to ease local verification
    const showDevCode = !isEmailEnabled() || process.env.NODE_ENV !== "production";

    return NextResponse.json({
      success: true,
      message: "A 6-digit verification code has been dispatched to your email address.",
      devOtpCode: showDevCode ? otpCode : undefined,
      expiresInMinutes,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process password reset" }, { status: 500 });
  }
}
