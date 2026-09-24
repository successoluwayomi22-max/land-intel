import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateOTP, hashOTP, sendOTPEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const ResendOTPSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Rate limit: 3 resends per 5 minutes per IP
    const rateCheck = checkRateLimit(`resend-otp-${ip}`, 3, 300);
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck);
    }

    const body = await request.json();
    const parsed = ResendOTPSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        message: "If an account exists with this email, a new verification code has been sent.",
      });
    }

    if (user.isVerified) {
      return NextResponse.json({
        message: "Email is already verified. You can sign in.",
        verified: true,
      });
    }

    // Generate and store new OTP
    const otpCode = generateOTP();
    const otpHash = hashOTP(otpCode);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.user.update({
      where: { id: user.id },
      data: { otpHash, otpExpiresAt },
    });

    // Send OTP email
    await sendOTPEmail({
      email: user.email,
      name: user.name,
      otpCode,
    });

    return NextResponse.json({
      message: "A new verification code has been sent to your email.",
      devOtpCode: otpCode,
    });
  } catch (error) {
    console.error("[RESEND_OTP_ERROR]", error);
    return NextResponse.json(
      { error: "Could not send verification code. Please try again." },
      { status: 500 }
    );
  }
}
