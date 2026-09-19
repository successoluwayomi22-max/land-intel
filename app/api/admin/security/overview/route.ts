import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { securityStore } from "@/lib/security/store";
import { telemetryService } from "@/lib/observability/telemetry";

export async function GET() {
  try {
    const admin = await requireAdmin();
    const overview = await securityStore.getOverviewMetrics();
    const providers = await telemetryService.getProviderHealthMatrix();
    const telemetry = telemetryService.getPerformanceTelemetry();

    return NextResponse.json({
      ...overview,
      providers,
      telemetry,
      currentUser: { email: admin.email, role: admin.role },
    });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}
