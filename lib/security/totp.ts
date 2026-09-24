import crypto from "crypto";

// RFC 4648 Base32 alphabet
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer to an RFC 4648 Base32 string (without padding).
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes an RFC 4648 Base32 string to a Buffer.
 */
export function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleanInput[i]);
    if (idx === -1) {
      continue; // Skip invalid characters
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically secure Base32 secret for TOTP (160 bits = 20 bytes = 32 base32 chars).
 */
export function generateTotpSecret(bytes = 20): string {
  const randomBytes = crypto.randomBytes(bytes);
  return base32Encode(randomBytes);
}

/**
 * Generates a standard otpauth:// URI for authenticator applications (Google Authenticator, Microsoft Authenticator, 1Password, etc.).
 */
export function generateTotpUri(
  accountEmail: string,
  secret: string,
  issuer = "LandIntel"
): string {
  const cleanSecret = secret.replace(/[\s-]/g, "").toUpperCase();
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountEmail)}`;
  return `otpauth://totp/${label}?secret=${cleanSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Calculates the 6-digit TOTP code for a given secret and timestamp (RFC 6238).
 */
export function generateTotpCode(secret: string, timestampMs: number = Date.now()): string {
  const key = base32Decode(secret);
  const timeStep = Math.floor(timestampMs / 1000 / 30);

  // 8-byte big-endian time counter buffer
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);

  // HMAC-SHA1
  const hmac = crypto.createHmac("sha1", key);
  hmac.update(timeBuffer);
  const digest = hmac.digest();

  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP code against a secret with a configurable time window check (+/- window steps).
 * Window 1 allows 30 seconds before and 30 seconds after to handle client clock drift.
 */
export function verifyTotpCode(
  inputCode: string,
  secret: string,
  window = 1,
  timestampMs: number = Date.now()
): boolean {
  if (!inputCode || !secret) return false;
  const cleanCode = inputCode.trim().replace(/\s/g, "");
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) return false;

  for (let i = -window; i <= window; i++) {
    const checkTime = timestampMs + i * 30 * 1000;
    const expected = generateTotpCode(secret, checkTime);
    if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates human-readable backup recovery codes (e.g., "A8B2-9F1C-44E2").
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(6).toString("hex").toUpperCase();
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
    codes.push(formatted);
  }
  return codes;
}

/**
 * Normalizes a backup recovery code by removing hyphens and whitespace and converting to uppercase.
 */
export function normalizeBackupCode(code: string): string {
  return code.trim().replace(/[\s-]/g, "").toUpperCase();
}

/**
 * Verifies a submitted backup code against stored codes (JSON array) and consumes it if valid.
 */
export function verifyAndConsumeBackupCode(
  inputCode: string,
  storedCodesRaw: string | string[] | null | undefined
): { valid: boolean; remainingCodes: string[] } {
  if (!inputCode || !storedCodesRaw) {
    return { valid: false, remainingCodes: [] };
  }

  let codeList: string[] = [];
  try {
    codeList = Array.isArray(storedCodesRaw) ? storedCodesRaw : JSON.parse(storedCodesRaw);
  } catch {
    return { valid: false, remainingCodes: [] };
  }

  const normalizedInput = normalizeBackupCode(inputCode);
  const matchIndex = codeList.findIndex(
    (c) => normalizeBackupCode(c) === normalizedInput
  );

  if (matchIndex === -1) {
    return { valid: false, remainingCodes: codeList };
  }

  // Consume matched code
  const remainingCodes = [...codeList];
  remainingCodes.splice(matchIndex, 1);

  return { valid: true, remainingCodes };
}
