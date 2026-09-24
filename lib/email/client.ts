import { Resend } from "resend";
import nodemailer from "nodemailer";
import {
  RESEND_API_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
} from "@/lib/security/credentials";

// Resolve Resend API key with safe fallback
const apiKey = RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

// SMTP transporter (e.g. Gmail SMTP, cPanel / Webmail, or custom SMTP)
export const smtpTransporter =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
      })
    : null;

// Brand recipient for replies and administrative alerts
export const BRAND_EMAIL =
  process.env.BRAND_EMAIL || "successoluwayomi22@gmail.com";

// Public display email for brand presence
export const SUPPORT_DISPLAY_EMAIL =
  process.env.SUPPORT_DISPLAY_EMAIL || "support@landintel.ai";

// SMTP sender (for Gmail SMTP / custom SMTP)
export const SMTP_FROM =
  process.env.SMTP_FROM || (SMTP_USER ? `LandIntel <${SMTP_USER}>` : "LandIntel <onboarding@resend.dev>");

// Resend sender: Resend mandates either onboarding@resend.dev or a verified custom domain.
// Unverified domains like @gmail.com or @yahoo.com cause Resend API 403 validation error.
export const RESEND_FROM =
  process.env.RESEND_FROM ||
  (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes("@gmail.com") && !process.env.EMAIL_FROM.includes("@yahoo.com")
    ? process.env.EMAIL_FROM
    : "LandIntel <onboarding@resend.dev>");

// Default sender for backward compatibility
export const EMAIL_FROM = SMTP_FROM;

export const isEmailEnabled = (): boolean => !!smtpTransporter || !!resend;
