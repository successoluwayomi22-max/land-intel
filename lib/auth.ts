import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "diasporaland-super-secure-production-jwt-secret-key-32chars"
);

export const AUTH_COOKIE_NAME = "landintel_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  [key: string]: unknown;
}

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number;
  message?: string;
  missingRules: string[];
}

export function validatePasswordStrength(
  password: string,
  context?: { email?: string; name?: string }
): PasswordStrengthResult {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      score: 0,
      message: "Password must be at least 8 characters long.",
      missingRules: ["At least 8 characters"],
    };
  }

  const missing: string[] = [];
  if (!/[a-zA-Z]/.test(password)) missing.push("at least one letter (a-z, A-Z)");
  if (!/[0-9]/.test(password)) missing.push("at least one number (0-9)");

  if (missing.length > 0) {
    return {
      isValid: false,
      score: 1,
      message: `Password must include ${missing.join(" and ")}.`,
      missingRules: missing,
    };
  }

  const lower = password.toLowerCase();

  // 1. Reject duplicate repeating single characters (e.g. "aaaaaaaa", "11111111")
  if (/^(.)\1+$/.test(password)) {
    return {
      isValid: false,
      score: 1,
      message: "Password contains duplicate repeating characters. Please choose a varied combination of letters and numbers.",
      missingRules: ["Avoid duplicate repeating characters"],
    };
  }

  // 2. Reject trivial sequential patterns (e.g. "12345678", "abcdefgh")
  if ("1234567890123456".includes(lower) || "abcdefghijklmnopqrstuvwxyz".includes(lower)) {
    return {
      isValid: false,
      score: 1,
      message: "Password cannot be a simple sequential sequence. Please choose a unique password.",
      missingRules: ["Avoid sequential sequences"],
    };
  }

  // 3. Reject password containing or duplicating user email prefix
  if (context?.email) {
    const emailPrefix = context.email.split("@")[0].toLowerCase();
    if (emailPrefix.length >= 3 && lower.includes(emailPrefix)) {
      return {
        isValid: false,
        score: 1,
        message: "Password cannot contain parts of your email address for account security.",
        missingRules: ["Do not include email in password"],
      };
    }
  }

  // 4. Reject password containing user name
  if (context?.name) {
    const nameParts = context.name.toLowerCase().split(/\s+/).filter((p) => p.length >= 3);
    for (const part of nameParts) {
      if (lower.includes(part)) {
        return {
          isValid: false,
          score: 1,
          message: "Password cannot contain parts of your name for account security.",
          missingRules: ["Do not include your name in password"],
        };
      }
    }
  }

  // Calculate score (1 to 5):
  // Base valid password with 8+ chars, letter, and number = score 3 (Moderate/Strong)
  // +1 for mixed case (both lowercase and uppercase)
  // +1 for special symbols (!@#$%^&*...)
  // +1 for length >= 12
  let score = 3;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12 && score < 5) score++;

  return {
    isValid: true,
    score: Math.min(5, score),
    missingRules: [],
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password.trim(), 12);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  const match = await bcrypt.compare(plain, hash);
  if (match) return true;
  // Safe fallback if mobile autofill added a leading/trailing space
  if (plain.trim() !== plain) {
    return bcrypt.compare(plain.trim(), hash);
  }
  return false;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(request?: Request) {
  let token: string | undefined;

  // 1. Check Authorization Bearer header first if request is provided
  if (request) {
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  // 1b. Check next/headers for Authorization header
  if (!token) {
    try {
      const reqHeaders = headers();
      const authHeader = reqHeaders.get("authorization") || reqHeaders.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    } catch {}
  }

  // 2. If no header token, check cookie store
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value || cookieStore.get("diasporaland_session")?.value;
    } catch {
      // Cookies not accessible outside request context
    }
  }

  // 3. Additional fallback: check request raw cookie header if cookies() was inaccessible
  if (!token && request) {
    const rawCookie = request.headers.get("cookie");
    if (rawCookie) {
      const match = rawCookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`)) ||
                    rawCookie.match(/(?:^|; )diasporaland_session=([^;]*)/);
      if (match) token = decodeURIComponent(match[1]);
    }
  }

  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload || !payload.userId) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return user;
}

export async function requireAuth(request?: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin(request?: Request) {
  const user = await requireAuth(request);
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: Admin privileges required");
  }
  return user;
}
