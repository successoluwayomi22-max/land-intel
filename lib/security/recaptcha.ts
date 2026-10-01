import { RECAPTCHA_SECRET_KEY } from "@/lib/security/credentials";

/**
 * Server-side Google reCAPTCHA v3 verification helper.
 * Validates tokens against Google's siteverify API.
 *
 * SECURITY: No fallback tokens, no auto-pass on configuration errors.
 * If reCAPTCHA is misconfigured, registration is blocked until fixed.
 */
export async function verifyRecaptcha(
  token?: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = RECAPTCHA_SECRET_KEY;

  // If no secret key is configured, fail closed in production
  if (!secretKey) {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) {
      console.error("[RECAPTCHA] No secret key configured in production — blocking registration.");
      return { success: false, error: "Security verification is not configured. Please contact support." };
    }
    console.warn("[RECAPTCHA] No secret key available, bypassing check in development mode.");
    return { success: true };
  }

  // Reject empty or missing tokens
  if (!token || token.trim().length === 0) {
    return {
      success: false,
      error: "Please complete the security verification before registering.",
    };
  }

  // SECURITY: Reject fabricated fallback tokens — only Google-issued tokens are valid
  if (!token.startsWith("03A") && token.length < 40) {
    console.warn("[RECAPTCHA] Rejected non-Google token:", token.substring(0, 20));
    return {
      success: false,
      error: "Invalid security verification. Please refresh the page and try again.",
    };
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", secretKey);
    params.append("response", token);
    if (remoteIp) {
      params.append("remoteip", remoteIp);
    }

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const data = await response.json();

    if (data.success) {
      // For reCAPTCHA v3, also check the score (0.0 = bot, 1.0 = human)
      const score = data.score ?? 1.0;
      if (score < 0.3) {
        console.warn(`[RECAPTCHA] Low score (${score}) — suspected bot activity.`);
        return {
          success: false,
          error: "Automated activity detected. Please try again or contact support.",
        };
      }
      return { success: true };
    }

    const errorCodes = data["error-codes"] || [];
    console.warn("[RECAPTCHA] Google verification rejected:", errorCodes);

    // Configuration errors should fail closed — don't silently allow registrations
    if (
      errorCodes.includes("invalid-input-secret") ||
      errorCodes.includes("invalid-keys")
    ) {
      console.error("[RECAPTCHA] Secret key is invalid. Registration blocked until fixed.");
      return {
        success: false,
        error: "Security verification is temporarily unavailable. Please try again later.",
      };
    }

    if (errorCodes.includes("timeout-or-duplicate")) {
      return {
        success: false,
        error: "Security verification expired. Please refresh the page and try again.",
      };
    }

    return {
      success: false,
      error: "Security verification failed. Please check the reCAPTCHA and try again.",
    };
  } catch (err: any) {
    console.error("[RECAPTCHA] Verification network error:", err);
    // SECURITY: Fail closed on network errors — don't silently pass
    return {
      success: false,
      error: "Security verification could not be completed. Please try again.",
    };
  }
}
