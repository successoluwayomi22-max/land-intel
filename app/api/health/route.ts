import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let dbStatus = "unknown";
  let userCount = -1;
  let dbError: string | null = null;
  try {
    userCount = await db.user.count();
    dbStatus = "connected";
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    status: "ok",
    version: "2026.09.24.auth-fix-v2",
    db: {
      status: dbStatus,
      userCount,
      error: dbError,
    },
    timestamp: new Date().toISOString(),
    service: "landintel-api",
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
