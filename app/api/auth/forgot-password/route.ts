import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email/send";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    // Rate limit: 5 requests per 10 minutes per IP
    const rateCheck = checkRateLimit(`forgot-pw-${ip}`, 5, 600);
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

    // To prevent email enumeration, return a success message even if the user isn't found
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists for this email, password reset instructions have been dispatched.",
      });
    }

    // Generate secure random reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: rawToken,
        resetExpires: expiresAt,
      },
    });

    // Send password reset email via Resend
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${origin}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    console.log(`[AUTH] Password reset requested for ${normalizedEmail}. Reset URL: ${resetUrl}`);

    // Non-blocking email dispatch
    sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
      expiresInMinutes: 60,
    }).catch((err) => {
      console.error("[AUTH] Password reset email dispatch failed:", err);
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, password reset instructions have been dispatched.",
      // Include simulation link for sandbox / local preview testing
      simulatedResetUrl: resetUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process password reset" }, { status: 500 });
  }
}
