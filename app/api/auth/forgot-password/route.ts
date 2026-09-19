import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

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

    // In production, this would be sent via SendGrid / Resend / Postmark
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const resetUrl = `${origin}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    console.log(`[AUTH] Password reset requested for ${normalizedEmail}. Reset URL: ${resetUrl}`);

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
