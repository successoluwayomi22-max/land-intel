import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";
import crypto from "crypto";

const GoogleAuthSchema = z.object({
  credential: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = GoogleAuthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Google authentication payload" }, { status: 400 });
    }

    let email = parsed.data.email?.trim().toLowerCase();
    let name = parsed.data.name?.trim() || "Google Investor";

    // If Google ID token credential was passed from Google Identity Services
    if (parsed.data.credential) {
      try {
        // Decode payload part of JWT (base64url)
        const parts = parsed.data.credential.split(".");
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
          const googlePayload = JSON.parse(payloadJson);
          if (googlePayload.email) {
            email = googlePayload.email.trim().toLowerCase();
          }
          if (googlePayload.name) {
            name = googlePayload.name.trim();
          }
        }
      } catch (decodeErr) {
        console.warn("[GOOGLE_AUTH] Could not decode Google JWT credential:", decodeErr);
      }
    }

    // Default fallback demo/one-click email if none provided
    if (!email) {
      email = "investor.google@diasporaland.ai";
      name = "Google Verified Investor";
    }

    // Find existing user or register new account
    let user = await db.user.findUnique({
      where: { email },
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      const randomPassword = crypto.randomBytes(32).toString("hex") + "!Aa1";
      const passwordHash = await hashPassword(randomPassword);

      user = await db.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "FREE",
          isVerified: true,
        },
      });

      await logAudit({
        userId: user.id,
        action: "GOOGLE_ACCOUNT_CREATED",
        resourceType: "User",
        resourceId: user.id,
        details: { email, method: "Google_OAuth" },
      });
    }

    // Generate authenticated session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await logAudit({
      userId: user.id,
      action: "USER_LOGIN_GOOGLE",
      resourceType: "User",
      resourceId: user.id,
      details: { email: user.email, isNewUser },
    });

    const response = NextResponse.json({
      success: true,
      message: isNewUser ? "Google account registered successfully" : "Signed in with Google",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
      token,
      isNewUser,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[GOOGLE_AUTH_ERROR]", error);
    return NextResponse.json({ error: error.message || "Google authentication failed" }, { status: 500 });
  }
}
