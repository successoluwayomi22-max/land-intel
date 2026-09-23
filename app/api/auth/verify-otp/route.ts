import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { hashOTP } from "@/lib/email/send";
import { logAudit } from "@/lib/services/audit";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const VerifyOTPSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Rate limit: 10 attempts per 5 minutes per IP
    const rateCheck = checkRateLimit(`verify-otp-${ip}`, 10, 300);
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const parsed = VerifyOTPSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;
    const otpHashValue = hashOTP(code);

    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Email is already verified.", verified: true },
        { status: 200 }
      );
    }

    // Validate OTP hash and expiry
    if (!user.otpHash || !user.otpExpiresAt) {
      return NextResponse.json(
        { error: "No verification code has been sent. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > user.otpExpiresAt) {
      return NextResponse.json(
        {
          error: "Verification code has expired. Please click 'Resend Code' below to get a fresh code.",
          code: "OTP_EXPIRED",
          expired: true,
        },
        { status: 410 }
      );
    }

    if (user.otpHash !== otpHashValue) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check and try again." },
        { status: 401 }
      );
    }

    // Mark user as verified and clear OTP
    await db.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpHash: null,
        otpExpiresAt: null,
        verificationToken: null,
      },
    });

    await logAudit({
      userId: user.id,
      action: "EMAIL_VERIFIED",
      resourceType: "User",
      resourceId: user.id,
      ipAddress: ip,
    });

    // Create session so user is logged in after verification
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      message: "Email verified successfully!",
      verified: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });

    const isHttps =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[VERIFY_OTP_ERROR]", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
