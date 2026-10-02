import dns from "node:dns/promises";

// Common disposable, temporary, and placeholder domains
const BLOCKED_DOMAINS = new Set([
  "fake.com",
  "test.com",
  "testing.com",
  "example.com",
  "example.org",
  "example.net",
  "invalid.com",
  "fakemail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.biz",
  "guerrillamail.org",
  "10minutemail.com",
  "10minutemail.net",
  "mailinator.com",
  "yopmail.com",
  "sharklasers.com",
  "dispostable.com",
  "trashmail.com",
  "trashmail.net",
  "getairmail.com",
  "mohmal.com",
  "crazymailing.com",
  "burnermail.io",
  "dropmail.me",
  "generator.email",
  "inboxbear.com",
  "tempail.com",
  "mytemp.email",
  "fakemailgenerator.com",
  "emailondeck.com",
  "tempr.email",
  "discard.email",
  "maildrop.cc",
]);

// Known reputable email providers that definitely have valid MX records
const WELL_KNOWN_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.ca",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "zoho.com",
  "proton.me",
  "protonmail.com",
  "fastmail.com",
  "landintel.ai",
]);

export interface EmailDeliverabilityResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates whether an email address format is sound, domain is real, and MX mail servers exist.
 */
export async function validateEmailDeliverability(email: string): Promise<EmailDeliverabilityResult> {
  if (!email || typeof email !== "string") {
    return { isValid: false, reason: "Email address is required." };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Basic regex check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, reason: "Please enter a valid email address format." };
  }

  const parts = cleanEmail.split("@");
  if (parts.length !== 2) {
    return { isValid: false, reason: "Invalid email address structure." };
  }

  const [localPart, domain] = parts;

  if (localPart.length < 1 || localPart.length > 64) {
    return { isValid: false, reason: "Email username is invalid." };
  }

  if (domain.length < 3 || domain.length > 255) {
    return { isValid: false, reason: "Email domain is invalid." };
  }

  // 1. Check blocked / fake / disposable domains
  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      isValid: false,
      reason: "Disposable or temporary email services are not permitted. Please use your real, active email address.",
    };
  }

  // Check suspicious TLDs or patterns
  if (domain.endsWith(".test") || domain.endsWith(".invalid") || domain.endsWith(".localhost")) {
    return {
      isValid: false,
      reason: "Please use a real, registered top-level domain.",
    };
  }

  // 2. Fast track for well-known providers (no DNS lookup needed)
  if (WELL_KNOWN_DOMAINS.has(domain)) {
    return { isValid: true };
  }

  // 3. DNS MX Record Verification for custom/unfamiliar domains
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DNS_TIMEOUT")), 3000)
    );

    const mxPromise = dns.resolveMx(domain);
    const mxRecords = (await Promise.race([mxPromise, timeoutPromise])) as any[];

    if (!mxRecords || mxRecords.length === 0) {
      return {
        isValid: false,
        reason: `The domain "@${domain}" does not have active mail servers and cannot receive email.`,
      };
    }

    return { isValid: true };
  } catch (err: any) {
    if (err?.code === "ENOTFOUND" || err?.code === "ENODATA" || err?.code === "NXDOMAIN") {
      return {
        isValid: false,
        reason: `The domain "@${domain}" does not exist. Please check your spelling and provide a valid email.`,
      };
    }

    // If timeout or transient DNS glitch, do not hard-block to avoid false positives
    if (err?.message === "DNS_TIMEOUT") {
      console.warn(`[EMAIL_VALIDATOR] DNS MX check timed out for ${domain}, proceeding cautiously.`);
      return { isValid: true };
    }

    console.warn(`[EMAIL_VALIDATOR] DNS check exception for ${domain}:`, err?.message || err);
    return { isValid: true };
  }
}
