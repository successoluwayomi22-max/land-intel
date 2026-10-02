import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME, validatePasswordStrength } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { generateOTP, hashOTP, sendWelcomeEmail, sendOTPEmail } from "@/lib/email/send";
import { isEmailEnabled } from "@/lib/email/client";
import { verifyRecaptcha } from "@/lib/security/recaptcha";
import { validateEmailDeliverability } from "@/lib/security/email-validator";
import { evaluateRequest, recordThreatEvent } from "@/lib/security/threat-engine";

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  captchaToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 0. Adaptive Cyber Defense Check: Block hostile/banned IPs immediately
    const threatCheck = await evaluateRequest(request);
    if (!threatCheck.allowed) {
      return NextResponse.json(
        {
          error: threatCheck.reason || "Access restricted by LandIntel Security Firewall.",
          code: "IP_BANNED",
          bannedUntil: threatCheck.bannedUntil,
        },
        { status: threatCheck.status || 403 }
      );
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";

    // Rate limit: 10 account creations per 10 minutes per IP
    const rateCheck = checkRateLimit(`register-${ip}`, 10, 600);
    if (!rateCheck.success) {
      await recordThreatEvent(ip, {
        type: "REGISTRATION_FLOOD",
        score: 12,
        reason: "High-frequency registration flood exceeding rate limits",
        path: "/api/auth/register",
        userAgent,
      });
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
      await recordThreatEvent(ip, {
        type: "BOT_CAPTCHA_FAILED",
        score: 10,
        reason: "Automated bot registration probe - failed reCAPTCHA verification",
        path: "/api/auth/register",
        userAgent,
      });
      return NextResponse.json(
        { error: recaptchaResult.error || "Security verification failed." },
        { status: 400 }
      );
    }

    const name = parsed.data.name.trim();
    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    // Validate email deliverability (check MX records, real domain, block disposable/fake domains)
    const deliverability = await validateEmailDeliverability(email);
    if (!deliverability.isValid) {
      await recordThreatEvent(ip, {
        type: "DISPOSABLE_EMAIL_ABUSE",
        score: 10,
        reason: `Attempted registration with disposable or fake email domain: ${email}`,
        path: "/api/auth/register",
        userAgent,
      });
      return NextResponse.json(
        { error: deliverability.reason || "Invalid email address or unreachable mail domain." },
        { status: 400 }
      );
    }

    // Validate password strength and reject weak/duplicate patterns wisely
    const strengthResult = validatePasswordStrength(password, { name, email });
    if (!strengthResult.isValid) {
      return NextResponse.json(
        { error: strengthResult.message || "Password is too weak. Please include at least 8 characters with letters and numbers." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing && existing.isVerified) {
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

    let user;
    let isReattempt = false;

    if (existing && !existing.isVerified) {
      // User registered previously but did not complete OTP verification.
      // Update their account credentials and issue fresh OTP instead of throwing an error.
      isReattempt = true;
      user = await db.user.update({
        where: { id: existing.id },
        data: {
          name,
          passwordHash,
          otpHash: emailEnabled ? otpHashValue : null,
          otpExpiresAt: emailEnabled ? otpExpiresAt : null,
        },
      });
    } else {
      user = await db.user.create({
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
    }

    try {
      await logAudit({
        userId: user.id,
        action: isReattempt ? "USER_REGISTER_RESUME" : "USER_REGISTER",
        resourceType: "User",
        resourceId: user.id,
        details: { email: user.email },
      });
    } catch (auditErr) {
      console.warn("[REGISTER_AUDIT_WARN]", auditErr);
    }

    // Create immediate in-app Welcome Notification if brand new
    if (!isReattempt) {
      await db.notification.create({
        data: {
          userId: user.id,
          title: "Welcome to LandIntel! 🎉",
          message: `Welcome aboard, ${user.name}! Your property due diligence workspace is ready. Perform cadastral checks, coordinate audits, and title verifications with confidence.`,
          type: "INFO",
        },
      }).catch((err) => console.error("[REGISTER_NOTIF_ERROR]", err));
    }

    // Send OTP verification email directly to registered address
    // Note: Welcome email is sent after the user successfully verifies their OTP in /api/auth/verify-otp
    if (emailEnabled) {
      console.log(`[REGISTER] Dispatching OTP verification email to: ${user.email}`);
      const emailResult = await sendOTPEmail({ email: user.email, name: user.name, otpCode });
      if (!emailResult.success) {
        console.error(`[REGISTER] OTP email dispatch failed for ${user.email}:`, emailResult.error);

        // CRITICAL ROLLBACK: If this was a new unverified registration and email dispatch failed,
        // delete the user record immediately so phantom/fake accounts do not persist in the database!
        if (!isReattempt) {
          await db.user.delete({ where: { id: user.id } }).catch(() => {});
        }

        return NextResponse.json(
          {
            error: "We could not deliver the verification code to this email address. Please make sure your email is active, valid, and able to receive messages.",
            code: "EMAIL_DELIVERY_FAILED",
          },
          { status: 400 }
        );
      } else {
        console.log(`[REGISTER] OTP email dispatched successfully for ${user.email}`);
      }
    }

    // SECURITY: Only issue a session token AFTER email verification is complete.
    // If email verification is required, do NOT create a session — the user
    // must complete OTP verification first via /api/auth/verify-otp.
    if (emailEnabled) {
      return NextResponse.json(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: false,
          },
          requiresVerification: true,
        },
        { status: 201 }
      );
    }


    // Dev/no-email mode: auto-verified, issue session immediately
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isVerified: true,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: true,
        },
        token,
        requiresVerification: false,
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
    return NextResponse.json({ 
      error: "Registration failed. Please try again.",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
