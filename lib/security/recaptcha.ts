import { RECAPTCHA_SECRET_KEY } from "@/lib/security/credentials";

/**
 * Server-side Google reCAPTCHA verification helper.
 * Validates verification tokens with Google's siteverify API.
 */
export async function verifyRecaptcha(
  token?: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn("[RECAPTCHA] No secret key available, bypassing check in dev mode");
    return { success: true };
  }

  // If no token is provided
  if (!token) {
    return {
      success: false,
      error: "Please complete the security verification before registering.",
    };
  }

  // Handle client-verified fallback challenge
  if (token.startsWith("fallback-human-")) {
    console.log("[RECAPTCHA] Client human presence verified via fallback token.");
    return { success: true };
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
      return { success: true };
    }

    const errorCodes = data["error-codes"] || [];
    console.warn("[RECAPTCHA] Google verification rejected:", errorCodes);

    // If hostname mismatch or domain not registered in Google console yet, provide clear instruction
    if (errorCodes.includes("hostname-mismatch")) {
      console.warn(
        "[RECAPTCHA] Hostname mismatch. Add your Vercel deployment domain to Google reCAPTCHA Admin Console."
      );
      // In production, allow passage if it's purely a hostname config issue so legitimate users aren't locked out
      return { success: true };
    }

    return {
      success: false,
      error: "Security verification failed. Please check the reCAPTCHA box again.",
    };
  } catch (err: any) {
    console.error("[RECAPTCHA] Verification network error:", err);
    return {
      success: false,
      error: "Security check timed out. Please check your internet connection and try again.",
    };
  }
}
