import { Resend } from "resend";
import nodemailer from "nodemailer";
import { RESEND_API_KEY } from "@/lib/security/credentials";

// Resolve Resend API key with safe fallback
const apiKey = RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

// SMTP transporter (e.g. cPanel / Webmail / Google Workspace / custom SMTP)
export const smtpTransporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT || 465) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

// Default sender — update with your verified domain
export const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  (process.env.SMTP_USER ? `LandIntel <${process.env.SMTP_USER}>` : "LandIntel <onboarding@resend.dev>");

// Brand recipient for replies and administrative alerts
export const BRAND_EMAIL =
  process.env.BRAND_EMAIL || "successoluwayomi22@gmail.com";

// Public display email for brand presence
export const SUPPORT_DISPLAY_EMAIL =
  process.env.SUPPORT_DISPLAY_EMAIL || "support@landintel.ai";

export const isEmailEnabled = (): boolean => !!smtpTransporter || !!resend;
