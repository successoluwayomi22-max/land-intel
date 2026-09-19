import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
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

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      score: 0,
      message: "Password must be at least 8 characters long.",
      missingRules: ["At least 8 characters"],
    };
  }

  const missing: string[] = [];
  if (!/[a-z]/.test(password)) missing.push("a lowercase letter (a-z)");
  if (!/[A-Z]/.test(password)) missing.push("an uppercase letter (A-Z)");
  if (!/[0-9]/.test(password)) missing.push("a number (0-9)");
  if (!/[^A-Za-z0-9]/.test(password)) missing.push("a special character (!@#$%^&*...)");

  // Calculate score out of 5: length (1) + 4 character categories
  const score = 1 + (4 - missing.length);

  // Require length >= 8 and at least 3 character types (or all 4)
  // To strictly prevent weak passwords, missing at most 1 type or 0:
  // Requiring all 4 character types ensures strong password
  if (missing.length > 0) {
    return {
      isValid: false,
      score,
      message: `Password is too weak. Please include: ${missing.join(", ")}.`,
      missingRules: missing,
    };
  }

  return {
    isValid: true,
    score: 5,
    missingRules: [],
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
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

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: Admin privileges required");
  }
  return user;
}
