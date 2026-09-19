import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { securityStore } from "@/lib/security/store";

export async function GET() {
  try {
    await requireAdmin();
    const alerts = await securityStore.getAlerts();
    return NextResponse.json({ alerts });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json({ error: "alertId is required" }, { status: 400 });
    }

    const acknowledged = await securityStore.acknowledgeAlert(alertId, admin.email);
    if (!acknowledged) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, alertId });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}
