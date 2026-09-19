import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { telemetryService } from "@/lib/observability/telemetry";
import { tracer } from "@/lib/observability/tracer";

export async function GET() {
  try {
    await requireAdmin();
    const performance = telemetryService.getPerformanceTelemetry();
    const providers = await telemetryService.getProviderHealthMatrix();
    const recentTraces = tracer.getAllRecentTraces();

    return NextResponse.json({
      performance,
      providers,
      recentTraces,
      systemTime: new Date().toISOString(),
    });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}
