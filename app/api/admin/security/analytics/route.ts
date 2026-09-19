import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { analyticsService } from "@/lib/observability/analytics";

export async function GET() {
  try {
    await requireAdmin();
    const events = analyticsService.getRecentEvents(100);

    return NextResponse.json({
      provider: "Heap Adapter + Local Event Buffer",
      status: "OPERATIONAL",
      privacyPolicy: "Strict Data Isolation: Security & Authentication Events Excluded",
      events,
    });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}
