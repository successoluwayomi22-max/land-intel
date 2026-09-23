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
  if (!/[a-zA-Z]/.test(password)) missing.push("at least one letter");
  if (!/[0-9]/.test(password)) missing.push("at least one number");

  if (missing.length > 0) {
    return {
      isValid: false,
      score: 2,
      message: `Password must include ${missing.join(" and ")}.`,
      missingRules: missing,
    };
  }

  return {
    isValid: true,
    score: password.length >= 12 ? 5 : 4,
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
