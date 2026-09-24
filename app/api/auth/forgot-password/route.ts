import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { generateOTP, hashOTP, sendPasswordResetEmail } from "@/lib/email/send";

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

    // Check if the user has a registered account
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address. Please make sure the email is registered." },
        { status: 404 }
      );
    }

    // Generate secure 6-digit OTP (overwrites any previous OTP so only the latest is valid)
    const otpCode = generateOTP();
    const otpHash = hashOTP(otpCode);
    const expiresInMinutes = 5;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: otpHash,
        resetExpires: expiresAt,
      },
    });

    console.log(`[AUTH] Password reset OTP requested for ${normalizedEmail}. OTP: ${otpCode} (expires in ${expiresInMinutes}m)`);

    // Await email dispatch directly to the user's registered email
    const emailResult = await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      otpCode,
      expiresInMinutes,
    });

    if (!emailResult.success) {
      console.error(`[AUTH] Failed to dispatch password reset email to ${user.email}:`, emailResult.error);
      return NextResponse.json(
        {
          error:
            emailResult.error ||
            "Unable to deliver verification code to your email. Please try again or contact support.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${user.email}.`,
      expiresInMinutes,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process password reset" }, { status: 500 });
  }
}
