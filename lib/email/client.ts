import { Resend } from "resend";

// Gracefully handle missing API key — log warning instead of crashing
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn(
    "[EMAIL] RESEND_API_KEY is not set. Email sending will be disabled. " +
    "Get a free key at https://resend.com"
  );
}

export const resend = apiKey ? new Resend(apiKey) : null;

// Default sender — update with your verified domain
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "LandIntel <onboarding@resend.dev>";

// Brand recipient for replies and administrative alerts
export const BRAND_EMAIL =
  process.env.BRAND_EMAIL || "successoluwayomi22@gmail.com";

// Public display email for brand presence
export const SUPPORT_DISPLAY_EMAIL =
  process.env.SUPPORT_DISPLAY_EMAIL || "support@landintel.ai";

export const isEmailEnabled = (): boolean => !!resend;
