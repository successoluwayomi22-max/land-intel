import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/observability/logger";
import { LogLevel, LogCategory } from "@/lib/observability/types";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const level = (searchParams.get("level") as LogLevel) || undefined;
    const category = (searchParams.get("category") as LogCategory) || undefined;
    const search = searchParams.get("search") || undefined;
    const requestId = searchParams.get("requestId") || undefined;
    const traceId = searchParams.get("traceId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = await logger.getLogs({
      level,
      category,
      search,
      requestId,
      traceId,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}
