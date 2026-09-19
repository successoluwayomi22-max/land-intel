import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME, validatePasswordStrength } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

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

    const name = parsed.data.name.trim();
    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    // Strict bank-grade password policy enforcement
    const strengthResult = validatePasswordStrength(password);
    if (!strengthResult.isValid) {
      return NextResponse.json(
        { error: strengthResult.message || "Password is too weak. Please use uppercase, lowercase, numbers, and symbols." },
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

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "FREE",
        isVerified: true, // For MVP smooth onboarding
      },
    });

    await logAudit({
      userId: user.id,
      action: "USER_REGISTER",
      resourceType: "User",
      resourceId: user.id,
      details: { email: user.email },
    });

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
        },
        token,
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
