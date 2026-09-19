import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { comparePassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const LoginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  captchaToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    // Rate limit: 12 attempts per minute per IP
    const rateCheck = checkRateLimit(`login-${ip}`, 12, 60);
    if (!rateCheck.success) {
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
      return NextResponse.json(
        { error: "No account found with this email. Please check your spelling or register a new account." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect password. Please verify your password or use 'Forgot password?' to reset it." },
        { status: 401 }
      );
    }

    await logAudit({
      userId: user.id,
      action: "USER_LOGIN",
      resourceType: "User",
      resourceId: user.id,
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
