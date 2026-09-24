import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { comparePassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { threatEngine } from "@/lib/security/engine";
import { securityStore } from "@/lib/security/store";
import { verifyTotpCode, verifyAndConsumeBackupCode } from "@/lib/security/totp";

const LoginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  mfaCode: z.string().optional(),
  captchaToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // 1. IP Security Check
    const ipAccess = await threatEngine.evaluateIpAccess(ip, "/api/auth/login");
    if (!ipAccess.allowed) {
      return NextResponse.json(
        {
          error: "Access Denied: Your IP address is temporarily restricted due to suspicious activity.",
          reason: ipAccess.reason,
          expiresAt: ipAccess.blockExpiresAt,
        },
        { status: 403 }
      );
    }

    // 2. Rate limit check
    const rateCheck = checkRateLimit(`login-${ip}`, 12, 60);
    if (!rateCheck.success) {
      await threatEngine.reportThreat("RATE_LIMIT_EXCEEDED", {
        ip,
        endpoint: "/api/auth/login",
        method: "POST",
      });
      return rateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Report failed authentication attempt
      await threatEngine.reportThreat("BRUTE_FORCE", {
        ip,
        endpoint: "/api/auth/login",
        method: "POST",
        actorEmail: email,
      }, { reason: "Non-existent account login attempt" });

      return NextResponse.json(
        { error: "No account found with this email. Please check your spelling or register a new account." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      // Report failed authentication attempt for existing account
      await threatEngine.reportThreat("BRUTE_FORCE", {
        ip,
        endpoint: "/api/auth/login",
        method: "POST",
        actorEmail: email,
        actorId: user.id,
      }, { reason: "Password mismatch" });

      return NextResponse.json(
        { error: "Incorrect password. Please verify your password or use 'Forgot password?' to reset it." },
        { status: 401 }
      );
    }

    // Check if email has been verified (when email service is enabled)
    if (!user.isVerified) {
      return NextResponse.json(
        {
          error: "Please verify your email address to continue.",
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Check if Multi-Factor Authentication (MFA) is enabled for this user
    if (user.mfaEnabled && user.mfaSecret) {
      const mfaCode = parsed.data.mfaCode?.trim();
      if (!mfaCode) {
        return NextResponse.json({
          requiresMfa: true,
          email: user.email,
          message: "Two-Factor Authentication is enabled on this account. Please enter your 6-digit authenticator code or recovery backup code.",
        }, { status: 200 });
      }

      // Verify TOTP or Backup Code
      let mfaValid = verifyTotpCode(mfaCode, user.mfaSecret, 1);
      let usedBackupCode = false;

      if (!mfaValid && user.mfaBackupCodes) {
        const backupCheck = verifyAndConsumeBackupCode(mfaCode, user.mfaBackupCodes);
        if (backupCheck.valid) {
          mfaValid = true;
          usedBackupCode = true;
          await db.user.update({
            where: { id: user.id },
            data: { mfaBackupCodes: JSON.stringify(backupCheck.remainingCodes) },
          });
        }
      }

      if (!mfaValid) {
        await threatEngine.reportThreat("BRUTE_FORCE", {
          ip,
          endpoint: "/api/auth/login",
          method: "POST",
          actorEmail: email,
          actorId: user.id,
        }, { reason: "MFA code mismatch" });

        return NextResponse.json({
          error: "Invalid two-factor authentication code. Please check your authenticator app or backup codes.",
          requiresMfa: true,
        }, { status: 401 });
      }

      await logAudit({
        userId: user.id,
        action: usedBackupCode ? "MFA_BACKUP_CODE_USED" : "MFA_LOGIN_VERIFIED",
        resourceType: "User",
        resourceId: user.id,
        ipAddress: ip,
      });
    }

    // Record successful login in IP tracking (non-blocking)
    try {
      await securityStore.recordIPActivity({
        ip,
        successfulAuth: true,
        accountEmail: user.email,
      });
    } catch (e) {
      console.warn("[LOGIN_IP_ACTIVITY_WARN]", e);
    }

    try {
      await logAudit({
        userId: user.id,
        action: "USER_LOGIN",
        resourceType: "User",
        resourceId: user.id,
        ipAddress: ip,
      });
    } catch (e) {
      console.warn("[LOGIN_AUDIT_WARN]", e);
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });

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
    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
