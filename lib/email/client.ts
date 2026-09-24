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
      })
    : null;

// Default sender
export const EMAIL_FROM =
  process.env.EMAIL_FROM || (SMTP_USER ? `LandIntel <${SMTP_USER}>` : "LandIntel <onboarding@resend.dev>");

// Brand recipient for replies and administrative alerts
export const BRAND_EMAIL =
  process.env.BRAND_EMAIL || "successoluwayomi22@gmail.com";

// Public display email for brand presence
export const SUPPORT_DISPLAY_EMAIL =
  process.env.SUPPORT_DISPLAY_EMAIL || "support@landintel.ai";

export const isEmailEnabled = (): boolean => !!smtpTransporter || !!resend;
