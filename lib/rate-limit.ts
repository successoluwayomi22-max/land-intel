import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding-window / token store
// In production or multi-instance, this can back onto Redis/Upstash.
const ipRequestCounts = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    ipRequestCounts.forEach((record, key) => {
      if (record.resetAt <= now) {
        ipRequestCounts.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks and increments rate limit for an identifier (usually IP or email).
 * @param identifier Client IP or token
 * @param limit Max requests allowed in window
 * @param windowSeconds Window duration in seconds (default: 60s)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = ipRequestCounts.get(identifier);

  if (!existing || existing.resetAt <= now) {
    ipRequestCounts.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
    };
  }

  if (existing.count >= limit) {
    const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  existing.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    resetSeconds,
  };
}

/**
 * Extracts a client IP safely from Next.js request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Utility to return a standardized HTTP 429 response
 */
export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      error: `Too many requests. Please wait ${result.resetSeconds} seconds before trying again.`,
      retryAfter: result.resetSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.resetSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
}
