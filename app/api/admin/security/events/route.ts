import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { securityStore } from "@/lib/security/store";
import { SecuritySeverity, SecurityEventType } from "@/lib/security/types";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const severity = (searchParams.get("severity") as SecuritySeverity) || undefined;
    const eventType = (searchParams.get("eventType") as SecurityEventType) || undefined;
    const ip = searchParams.get("ip") || undefined;
    const actorEmail = searchParams.get("actorEmail") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = await securityStore.getEvents({
      severity,
      eventType,
      ip,
      actorEmail,
      search,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}
