import {
  resend,
  smtpTransporter,
  SMTP_FROM,
  RESEND_FROM,
  BRAND_EMAIL,
  SUPPORT_DISPLAY_EMAIL,
  isEmailEnabled,
} from "./client";
import { WelcomeEmail } from "./templates/welcome";
import { OTPEmail } from "./templates/otp";
import { PasswordResetEmail } from "./templates/password-reset";
import { ReportDeliveryEmail, ReportDeliveryEmailProps } from "./templates/report-delivery";
import { PaymentReceiptEmail, PaymentReceiptEmailProps } from "./templates/receipt";
import { SecurityAlertEmail, SecurityAlertProps } from "./templates/security-alert";
import crypto from "crypto";
import fs from "fs";
import path from "path";

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

/**
 * Convert HTML email templates to clean, readable plain-text alternatives.
 * Mail clients (Gmail, Outlook) heavily penalize HTML-only emails that lack text bodies.
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&bull;/g, "•")
    .replace(/&copy;/g, "©")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

interface DispatchEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  label: string;
  isTransactional?: boolean;
}

/**
 * Resilient multi-provider email dispatcher with anti-spam compliance:
 * 1. Tries SMTP first (e.g. corporate relay or Google Workspace).
 * 2. If SMTP fails or times out, falls back to Resend API.
 * 3. Enforces dual-format (HTML + clean plain text) to satisfy spam filters.
 * 4. Strictly aligns From and Reply-To domains to prevent anti-spoofing / DMARC penalties.
 * 5. Does NOT attach List-Unsubscribe to transactional security emails (OTP, password reset).
 */
async function dispatchEmail({
  to,
  subject,
  html,
  text,
  label,
  isTransactional = false,
}: DispatchEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!isEmailEnabled()) {
    console.log(`[EMAIL] Skipped ${label} to ${to} — email provider not configured`);
    return { success: true };
  }

  const plainText = text || htmlToPlainText(html);
  const entityRefId = crypto.randomBytes(16).toString("hex");

  // Determine if sending domain is a Gmail consumer relay
  const isGmailRelay = SMTP_FROM.toLowerCase().includes("@gmail.com");

  // Aligned reply-to address matching the sender's domain
  const smtpReplyTo = isGmailRelay ? SMTP_FROM : BRAND_EMAIL;
  const resendReplyTo = SUPPORT_DISPLAY_EMAIL || BRAND_EMAIL;

  const deliverabilityHeaders: Record<string, string> = {
    "X-Entity-Ref-ID": entityRefId,
  };

  if (!isTransactional && !isGmailRelay) {
    // Only non-transactional marketing emails carry unsubscribe headers
    deliverabilityHeaders["List-Unsubscribe"] = "<mailto:support@landintel.ai?subject=unsubscribe>";
    deliverabilityHeaders["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  let smtpError: string | null = null;

  // 1. Try SMTP if transporter is initialized
  if (smtpTransporter) {
    try {
      // Look for local logo PNG to attach as CID inline attachment for 100% email client support
      const logoPath = path.join(process.cwd(), "public", "logo-email.png");
      let logoAttachment: any[] = [];
      let smtpHtml = html;

      if (fs.existsSync(logoPath)) {
        try {
          const logoBuffer = fs.readFileSync(logoPath);
          smtpHtml = html.replace(/https:\/\/land-intel-omega\.vercel\.app\/logo-email\.png/g, "cid:brand-logo");
          logoAttachment = [
            {
              filename: "logo-email.png",
              content: logoBuffer,
              cid: "brand-logo",
            },
          ];
        } catch {
          logoAttachment = [];
          smtpHtml = html;
        }
      }

      await smtpTransporter.sendMail({
        from: SMTP_FROM,
        to,
        replyTo: smtpReplyTo,
        subject,
        html: smtpHtml,
        text: plainText,
        headers: deliverabilityHeaders,
        attachments: logoAttachment,
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
        replyTo: resendReplyTo,
        subject,
        html,
        text: plainText,
        headers: deliverabilityHeaders,
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

    const text = [
      `Hi ${user.name || "Investor"},`,
      "",
      "Welcome to LandIntel! Your account is verified and ready to use.",
      "",
      "You now have access to institutional-grade property due diligence, cadastral boundary verification, and statutory title search certification.",
      "",
      `Access your dashboard here: ${process.env.NEXT_PUBLIC_APP_URL || "https://land-intel-omega.vercel.app"}/login`,
      "",
      "Best regards,",
      "The LandIntel Team",
      "support@landintel.ai",
    ].join("\n");

    return await dispatchEmail({
      to: user.email,
      subject: "Welcome to LandIntel — Your Account is Ready",
      html,
      text,
      label: "Welcome email",
      isTransactional: true,
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

    const text = [
      `Hi ${user.name || "User"},`,
      "",
      `Your LandIntel verification code is: ${user.otpCode}`,
      "",
      `This verification code expires in ${expiresInMinutes} minutes.`,
      "For your security, do not share this code with anyone.",
      "",
      "If you didn't request this verification code, you can safely ignore this email.",
      "",
      "LandIntel Security Team",
      "support@landintel.ai",
    ].join("\n");

    return await dispatchEmail({
      to: user.email,
      subject: `Your LandIntel Verification Code: ${user.otpCode}`,
      html,
      text,
      label: "OTP verification email",
      isTransactional: true,
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

    const text = [
      `Hi ${user.name || "User"},`,
      "",
      `Your LandIntel password reset code is: ${user.otpCode}`,
      "",
      `This code expires in ${expiresInMinutes} minutes.`,
      "For your security, do not share this code with anyone.",
      "",
      "If you did not request a password reset, please secure your account immediately.",
      "",
      "LandIntel Security Team",
      "support@landintel.ai",
    ].join("\n");

    return await dispatchEmail({
      to: user.email,
      subject: `Your LandIntel Password Reset Code: ${user.otpCode}`,
      html,
      text,
      label: "Password reset email",
      isTransactional: true,
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

/**
 * Dispatch real-time cybersecurity incident alert to platform administrator.
 * Notifies the platform owner whenever an attacking IP is banned or high-threat spam is blocked.
 */
export async function sendSecurityThreatAlertEmail(
  props: SecurityAlertProps,
  recipientEmail: string = "successoluwayomi22@gmail.com"
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = SecurityAlertEmail(props);
    const subject = `🚨 [Security Alert] Hostile IP Auto-Banned: ${props.attackerIp} (${props.attackType})`;
    return await dispatchEmail({
      to: recipientEmail,
      subject,
      html,
      label: "Cyber defense threat alert",
      isTransactional: true,
    });
  } catch (err: any) {
    console.error("[EMAIL] sendSecurityThreatAlertEmail unexpected error:", err);
    return { success: false, error: err?.message };
  }
}


