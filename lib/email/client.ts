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
const isGmailSmtp = (SMTP_USER || "").toLowerCase().includes("@gmail.com");

export const BRAND_EMAIL =
  process.env.BRAND_EMAIL || (isGmailSmtp && SMTP_USER ? SMTP_USER : "support@landintel.ai");

// Public display email for brand presence
export const SUPPORT_DISPLAY_EMAIL =
  process.env.SUPPORT_DISPLAY_EMAIL || "support@landintel.ai";

// SMTP sender (for Gmail SMTP / custom SMTP)
export const SMTP_FROM =
  process.env.SMTP_FROM || (SMTP_USER ? `LandIntel <${SMTP_USER}>` : "LandIntel <notifications@landintel.ai>");

// Resend sender: Resend mandates a verified custom domain for production deliverability.
// Defaults to official brand notification domain while respecting custom env variables.
export const RESEND_FROM =
  process.env.RESEND_FROM ||
  (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes("@gmail.com") && !process.env.EMAIL_FROM.includes("@yahoo.com")
    ? process.env.EMAIL_FROM
    : "LandIntel <notifications@landintel.ai>");

// Default sender for backward compatibility
export const EMAIL_FROM = process.env.EMAIL_FROM || (isGmailSmtp && SMTP_USER ? `LandIntel <${SMTP_USER}>` : RESEND_FROM);

export const isEmailEnabled = (): boolean => !!smtpTransporter || !!resend;

