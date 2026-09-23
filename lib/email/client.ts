import { Resend } from "resend";
import { RESEND_API_KEY } from "@/lib/security/credentials";

// Resolve API key with safe production fallback
const apiKey = RESEND_API_KEY;

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
