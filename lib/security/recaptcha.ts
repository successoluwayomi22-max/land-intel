/**
 * Server-side Google reCAPTCHA verification helper.
 * Validates verification tokens with Google's siteverify API.
 */
export async function verifyRecaptcha(
  token?: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // In development or if secret key is omitted, bypass check
  if (!secretKey) {
    return { success: true };
  }

  // If no token is provided
  if (!token) {
    // If running in development without token, allow
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
    return { success: false, error: "reCAPTCHA verification is required." };
  }

  // Simulated fallback tokens for testing / development
  if (token.startsWith("recaptcha_verified_") && process.env.NODE_ENV !== "production") {
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
    console.warn("[RECAPTCHA] Verification rejected:", errorCodes);

    return {
      success: false,
      error: "Security verification failed. Please check the reCAPTCHA box again.",
    };
  } catch (err: any) {
    console.error("[RECAPTCHA] Verification error:", err);
    // Fail gracefully in non-production
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
    return { success: false, error: "Security check timed out. Please try again." };
  }
}
