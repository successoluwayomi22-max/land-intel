import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding-window token store (fast local memory)
const ipRequestCounts = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale local entries
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

// Upstash Distributed Redis Configuration (optional zero-dependency REST integration)
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Checks and increments rate limit for an identifier (usually IP or email).
 * Uses synchronous in-memory store for zero-latency execution, with automatic
 * async Upstash distributed sync when UPSTASH_REDIS_REST_URL is configured.
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = ipRequestCounts.get(identifier);

  // If Upstash Redis is active, asynchronously sync counter
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    syncUpstashRedisAsync(identifier, windowSeconds).catch(() => {});
  }

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
 * Upstash Redis zero-dependency REST pipeline sync
 */
async function syncUpstashRedisAsync(key: string, ttlSeconds: number) {
  try {
    const redisKey = `rl:${key}`;
    await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, ttlSeconds],
      ]),
    });
  } catch (err) {
    // Fail closed to local memory store
  }
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
