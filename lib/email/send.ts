import {
  resend,
  smtpTransporter,
  SMTP_FROM,
  RESEND_FROM,
  BRAND_EMAIL,
  isEmailEnabled,
} from "./client";
import { WelcomeEmail } from "./templates/welcome";
import { OTPEmail } from "./templates/otp";
import { PasswordResetEmail } from "./templates/password-reset";
import { ReportDeliveryEmail, ReportDeliveryEmailProps } from "./templates/report-delivery";
import { PaymentReceiptEmail, PaymentReceiptEmailProps } from "./templates/receipt";
import crypto from "crypto";

/**
 * Generate a cryptographically secure 6-digit OTP code.
 */
export function generateOTP(): string {
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

interface DispatchEmailOptions {
  to: string;
  subject: string;
  html: string;
  label: string;
}

/**
 * Resilient multi-provider email dispatcher:
 * 1. Tries SMTP first (e.g. Gmail App Password).
 * 2. If SMTP fails or times out, immediately falls back to Resend API.
 * 3. If only Resend is configured, sends directly via Resend.
 */
async function dispatchEmail({
  to,
  subject,
  html,
  label,
}: DispatchEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!isEmailEnabled()) {
    console.log(`[EMAIL] Skipped ${label} to ${to} — email provider not configured`);
    return { success: true };
  }

  let smtpError: string | null = null;

  // 1. Try SMTP if transporter is initialized
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: SMTP_FROM,
        to,
        replyTo: BRAND_EMAIL,
        subject,
        html,
      });
      console.log(`[EMAIL] ${label} sent successfully via SMTP to ${to}`);
      return { success: true };
    } catch (err: any) {
      smtpError = err?.message || String(err);
      console.warn(
        `[EMAIL] SMTP failed for ${label} to ${to} (${smtpError}). Attempting Resend fallback...`
      );
    }
  }

  // 2. Fallback to Resend (HTTP REST API — works reliably on cloud / serverless)
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM,
        to,
        replyTo: BRAND_EMAIL,
        subject,
        html,
      });

      if (error) {
        console.error(`[EMAIL] Resend ${label} error to ${to}:`, error);
        return {
          success: false,
          error: error.message || (smtpError ? `SMTP: ${smtpError}; Resend: ${error.message}` : "Resend delivery error"),
        };
      }

      console.log(`[EMAIL] ${label} sent successfully via Resend to ${to} (id: ${data?.id})`);
      return { success: true };
    } catch (resendErr: any) {
      console.error(`[EMAIL] Resend ${label} exception to ${to}:`, resendErr);
      return {
        success: false,
        error: resendErr?.message || smtpError || "Email dispatch failed across all providers",
      };
    }
  }

  return {
    success: false,
    error: smtpError || "No functional email dispatch service available",
  };
}

/**
 * Send a welcome email to a newly registered user.
 */
export async function sendWelcomeEmail(user: {
  email: string;
  name: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const html = WelcomeEmail({
      userName: user.name || "Investor",
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://land-intel-omega.vercel.app"}/login`,
    });

    return await dispatchEmail({
      to: user.email,
      subject: "Welcome to LandIntel — Your Account is Ready",
      html,
      label: "Welcome email",
    });
  } catch (err: any) {
    console.error("[EMAIL] sendWelcomeEmail unexpected error:", err);
    return { success: false, error: err?.message };
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

  try {
    const html = OTPEmail({
      userName: user.name || "User",
      otpCode: user.otpCode,
      expiresInMinutes,
    });

    return await dispatchEmail({
      to: user.email,
      subject: `${user.otpCode} — Your LandIntel Verification Code`,
      html,
      label: "OTP verification email",
    });
  } catch (err: any) {
    console.error("[EMAIL] sendOTPEmail unexpected error:", err);
    return { success: false, error: err?.message };
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

  try {
    const html = PasswordResetEmail({
      userName: user.name || "User",
      otpCode: user.otpCode,
      expiresInMinutes,
    });

    return await dispatchEmail({
      to: user.email,
      subject: `${user.otpCode} — Reset Your LandIntel Password`,
      html,
      label: "Password reset email",
    });
  } catch (err: any) {
    console.error("[EMAIL] sendPasswordResetEmail unexpected error:", err);
    return { success: false, error: err?.message };
  }
}

/**
 * Send a certified property due-diligence report delivery notification.
 */
export async function sendReportDeliveryEmail(
  toEmail: string,
  props: ReportDeliveryEmailProps
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = ReportDeliveryEmail(props);
    return await dispatchEmail({
      to: toEmail,
      subject: `Certified Due-Diligence Dossier Ready: "${props.caseTitle}" (${props.reference})`,
      html,
      label: "Report delivery email",
    });
  } catch (err: any) {
    console.error("[EMAIL] sendReportDeliveryEmail unexpected error:", err);
    return { success: false, error: err?.message };
  }
}

/**
 * Send a formal tax invoice and payment receipt to the customer.
 */
export async function sendPaymentReceiptEmail(
  toEmail: string,
  props: PaymentReceiptEmailProps
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = PaymentReceiptEmail(props);
    return await dispatchEmail({
      to: toEmail,
      subject: `Payment Receipt & Invoice — ${props.reference} (${props.currency} ${props.amount.toLocaleString()})`,
      html,
      label: "Payment receipt email",
    });
  } catch (err: any) {
    console.error("[EMAIL] sendPaymentReceiptEmail unexpected error:", err);
    return { success: false, error: err?.message };
  }
}

