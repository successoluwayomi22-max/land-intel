import { resend, smtpTransporter, EMAIL_FROM, BRAND_EMAIL, isEmailEnabled } from "./client";
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
    console.log(`[EMAIL] Skipped welcome email to ${user.email} — email provider not configured`);
    return { success: true };
  }

  try {
    const html = WelcomeEmail({
      userName: user.name,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://land-intel-omega.vercel.app"}/login`,
    });

    if (smtpTransporter) {
      await smtpTransporter.sendMail({
        from: EMAIL_FROM,
        to: user.email,
        replyTo: BRAND_EMAIL,
        subject: "Welcome to LandIntel — Your Account is Ready",
        html,
      });
      console.log(`[EMAIL] Welcome email sent via SMTP to ${user.email}`);
      return { success: true };
    }

    if (resend) {
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        replyTo: BRAND_EMAIL,
        subject: "Welcome to LandIntel — Your Account is Ready",
        html,
      });

      if (error) {
        console.error("[EMAIL] Welcome email error:", error);
        return { success: false, error: error.message };
      }

      console.log(`[EMAIL] Welcome email sent to ${user.email}`);
      return { success: true };
    }

    return { success: false, error: "No email transporter available" };
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
      `[EMAIL] Skipped OTP email to ${user.email} — email provider not configured. OTP: ${user.otpCode}`
    );
    return { success: true };
  }

  try {
    const html = OTPEmail({
      userName: user.name,
      otpCode: user.otpCode,
      expiresInMinutes,
    });

    if (smtpTransporter) {
      await smtpTransporter.sendMail({
        from: EMAIL_FROM,
        to: user.email,
        replyTo: BRAND_EMAIL,
        subject: `${user.otpCode} — Your LandIntel Verification Code`,
        html,
      });
      console.log(`[EMAIL] OTP email sent via SMTP to ${user.email}`);
      return { success: true };
    }

    if (resend) {
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        replyTo: BRAND_EMAIL,
        subject: `${user.otpCode} — Your LandIntel Verification Code`,
        html,
      });

      if (error) {
        console.error("[EMAIL] OTP email error:", error);
        return { success: false, error: error.message };
      }

      console.log(`[EMAIL] OTP email sent to ${user.email}`);
      return { success: true };
    }

    return { success: false, error: "No email transporter available" };
  } catch (err: any) {
    console.error("[EMAIL] OTP email exception:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Send a secure password reset OTP email directly to the user.
 */
export async function sendPasswordResetEmail(user: {
  email: string;
  name: string;
  otpCode: string;
  expiresInMinutes?: number;
}): Promise<{ success: boolean; error?: string }> {
  const expiresInMinutes = user.expiresInMinutes || 5;

  if (!isEmailEnabled()) {
    console.log(
      `[EMAIL] Skipped password reset email to ${user.email} — email provider not configured. OTP: ${user.otpCode} (expires in ${expiresInMinutes}m)`
    );
    return { success: false, error: "Email delivery system is not configured." };
  }

  try {
    const html = PasswordResetEmail({
      userName: user.name,
      otpCode: user.otpCode,
      expiresInMinutes,
    });

    if (smtpTransporter) {
      await smtpTransporter.sendMail({
        from: EMAIL_FROM,
        to: user.email,
        replyTo: BRAND_EMAIL,
        subject: `${user.otpCode} — Reset Your LandIntel Password`,
        html,
      });
      console.log(`[EMAIL] Password reset email sent via SMTP directly to user ${user.email}`);
      return { success: true };
    }

    if (resend) {
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        replyTo: BRAND_EMAIL,
        subject: `${user.otpCode} — Reset Your LandIntel Password`,
        html,
      });

      if (error) {
        console.error("[EMAIL] Password reset email error:", error);
        return { success: false, error: error.message };
      }

      console.log(`[EMAIL] Password reset email sent directly to user ${user.email}`);
      return { success: true };
    }

    return { success: false, error: "No email dispatch service is available." };
  } catch (err: any) {
    console.error("[EMAIL] Password reset email exception:", err);
    return { success: false, error: err.message };
  }
}
