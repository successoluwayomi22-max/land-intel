import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { comparePassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { threatEngine } from "@/lib/security/engine";
import { securityStore } from "@/lib/security/store";

const LoginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
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

    // Record successful login in IP tracking
    await securityStore.recordIPActivity({
      ip,
      successfulAuth: true,
      accountEmail: user.email,
    });

    await logAudit({
      userId: user.id,
      action: "USER_LOGIN",
      resourceType: "User",
      resourceId: user.id,
      ipAddress: ip,
    });

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
