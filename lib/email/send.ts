import { resend, EMAIL_FROM, BRAND_EMAIL, isEmailEnabled } from "./client";
import { WelcomeEmail } from "./templates/welcome";
import { OTPEmail } from "./templates/otp";
import { PasswordResetEmail } from "./templates/password-reset";
import crypto from "crypto";

/**
 * Generate a cryptographically secure 6-digit OTP code.
 */
export function generateOTP(): string {
  // Use crypto for secure random numbers
  const bytes = crypto.randomBytes(3); // 3 bytes = 24 bits = 0–16777215
  const num = (bytes[0] * 65536 + bytes[1] * 256 + bytes[2]) % 1000000;
  return num.toString().padStart(6, "0");
}

/**
 * Hash an OTP for safe storage (don't store raw OTP in DB).
 */
export function hashOTP(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Send a welcome email to a newly registered user.
 */
export async function sendWelcomeEmail(user: {
  email: string;
  name: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailEnabled()) {
    console.log(`[EMAIL] Skipped welcome email to ${user.email} — RESEND_API_KEY not set`);
    return { success: true }; // Don't block registration if email is disabled
  }

  try {
    const html = WelcomeEmail({
      userName: user.name,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://land-intel-omega.vercel.app"}/login`,
    });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      replyTo: BRAND_EMAIL,
      subject: "Welcome to LandIntel — Your Account is Ready",
      html,
    });

    if (error) {
      console.error("[EMAIL] Welcome email error:", error);
      if (user.email !== BRAND_EMAIL) {
        console.warn(`[EMAIL] Relaying welcome email copy to brand owner ${BRAND_EMAIL}`);
        await resend!.emails.send({
          from: EMAIL_FROM,
          to: BRAND_EMAIL,
          replyTo: BRAND_EMAIL,
          subject: `[Sandbox Relay for ${user.email}] Welcome to LandIntel`,
          html,
        }).catch(() => {});
      }
      return { success: false, error: error.message };
    }

    console.log(`[EMAIL] Welcome email sent to ${user.email}`);
    return { success: true };
  } catch (err: any) {
    console.error("[EMAIL] Welcome email exception:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Send a 6-digit OTP verification email.
 */
export async function sendOTPEmail(user: {
  email: string;
  name: string;
  otpCode: string;
  expiresInMinutes?: number;
}): Promise<{ success: boolean; error?: string }> {
  const expiresInMinutes = user.expiresInMinutes || 10;

  if (!isEmailEnabled()) {
    console.log(
      `[EMAIL] Skipped OTP email to ${user.email} — RESEND_API_KEY not set. OTP code: ${user.otpCode} (expires in ${expiresInMinutes}m)`
    );
    // In development without Resend, log the OTP so the developer can still test
    return { success: true };
  }

  try {
    const html = OTPEmail({
      userName: user.name,
      otpCode: user.otpCode,
      expiresInMinutes,
    });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      replyTo: BRAND_EMAIL,
      subject: `${user.otpCode} — Your LandIntel Verification Code`,
      html,
    });

    if (error) {
      console.error("[EMAIL] OTP email error:", error);
      if (user.email !== BRAND_EMAIL) {
        console.warn(`[EMAIL] Relaying OTP email copy to brand owner ${BRAND_EMAIL}`);
        await resend!.emails.send({
          from: EMAIL_FROM,
          to: BRAND_EMAIL,
          replyTo: BRAND_EMAIL,
          subject: `[Sandbox Relay for ${user.email}] ${user.otpCode} — Your LandIntel Verification Code`,
          html,
        }).catch(() => {});
      }
      return { success: false, error: error.message };
    }

    console.log(`[EMAIL] OTP email sent to ${user.email}`);
    return { success: true };
  } catch (err: any) {
    console.error("[EMAIL] OTP email exception:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Send a secure password reset OTP email.
 */
export async function sendPasswordResetEmail(user: {
  email: string;
  name: string;
  otpCode: string;
  expiresInMinutes?: number;
}): Promise<{ success: boolean; error?: string }> {
  const expiresInMinutes = user.expiresInMinutes || 10;

  if (!isEmailEnabled()) {
    console.log(
      `[EMAIL] Skipped password reset email to ${user.email} — RESEND_API_KEY not set. OTP code: ${user.otpCode} (expires in ${expiresInMinutes}m)`
    );
    return { success: true };
  }

  try {
    const html = PasswordResetEmail({
      userName: user.name,
      otpCode: user.otpCode,
      expiresInMinutes,
    });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      replyTo: BRAND_EMAIL,
      subject: `${user.otpCode} — Reset Your LandIntel Password`,
      html,
    });

    if (error) {
      console.error("[EMAIL] Password reset email error:", error);
      if (user.email !== BRAND_EMAIL) {
        console.warn(`[EMAIL] Relaying Password Reset email copy to brand owner ${BRAND_EMAIL}`);
        await resend!.emails.send({
          from: EMAIL_FROM,
          to: BRAND_EMAIL,
          replyTo: BRAND_EMAIL,
          subject: `[Sandbox Relay for ${user.email}] ${user.otpCode} — Reset Your LandIntel Password`,
          html,
        }).catch(() => {});
      }
      return { success: false, error: error.message };
    }

    console.log(`[EMAIL] Password reset email sent to ${user.email}`);
    return { success: true };
  } catch (err: any) {
    console.error("[EMAIL] Password reset email exception:", err);
    return { success: false, error: err.message };
  }
}
