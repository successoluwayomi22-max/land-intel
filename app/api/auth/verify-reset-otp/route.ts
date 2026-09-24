import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashOTP } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    // Rate limit: 10 attempts per 5 minutes per IP
    const rateCheck = checkRateLimit(`verify-reset-otp-${ip}`, 10, 300);
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const { email, code } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json({ error: "A valid 6-digit verification code is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.resetToken || !user.resetExpires) {
      return NextResponse.json(
        { error: "No active password reset request found for this email. Please request a new code." },
        { status: 400 }
      );
    }

    if (new Date() > user.resetExpires) {
      return NextResponse.json(
        {
          error: "Verification code has expired. Please request a fresh code.",
          code: "OTP_EXPIRED",
          expired: true,
        },
        { status: 410 }
      );
    }

    const hashedInput = hashOTP(cleanCode);
    if (user.resetToken !== hashedInput) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check your email and try again." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code confirmed successfully.",
    });
  } catch (error: any) {
    console.error("Verify reset OTP error:", error);
    return NextResponse.json({ error: "Failed to verify reset code" }, { status: 500 });
  }
}
