import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { generateOTP, hashOTP, sendWelcomeEmail, sendOTPEmail } from "@/lib/email/send";
import { isEmailEnabled } from "@/lib/email/client";
import { verifyRecaptcha } from "@/lib/security/recaptcha";

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  captchaToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    // Rate limit: 10 account creations per 10 minutes per IP
    const rateCheck = checkRateLimit(`register-${ip}`, 10, 600);
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify Google reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(parsed.data.captchaToken, ip);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: recaptchaResult.error || "Security verification failed." },
        { status: 400 }
      );
    }

    const name = parsed.data.name.trim();
    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "An account with this email already exists. Please sign in or reset your password.",
          code: "USER_ALREADY_EXISTS",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Generate OTP for email verification
    const otpCode = generateOTP();
    const otpHashValue = hashOTP(otpCode);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // If email service is available, require verification; otherwise auto-verify for dev
    const emailEnabled = isEmailEnabled();

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "FREE",
        isVerified: !emailEnabled, // Auto-verify only when email is disabled (dev mode)
        otpHash: emailEnabled ? otpHashValue : null,
        otpExpiresAt: emailEnabled ? otpExpiresAt : null,
      },
    });

    await logAudit({
      userId: user.id,
      action: "USER_REGISTER",
      resourceType: "User",
      resourceId: user.id,
      details: { email: user.email },
    });

    // Send emails (non-blocking — don't fail registration if email fails)
    if (emailEnabled) {
      // Fire and forget — don't await sequentially
      Promise.all([
        sendWelcomeEmail({ email: user.email, name: user.name }),
        sendOTPEmail({ email: user.email, name: user.name, otpCode }),
      ]).catch((err) => {
        console.error("[REGISTER] Email send error (non-blocking):", err);
      });
    }

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
        requiresVerification: emailEnabled,
      },
      { status: 201 }
    );

    const isHttps = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
