import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { securityStore } from "@/lib/security/store";

export async function GET() {
  try {
    await requireAdmin();
    const rules = await securityStore.getRules();
    return NextResponse.json({ rules });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const { id, enabled, threshold, timeWindowSeconds, severity, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    const updated = await securityStore.updateRule(
      id,
      {
        enabled: typeof enabled === "boolean" ? enabled : undefined,
        threshold: typeof threshold === "number" ? threshold : undefined,
        timeWindowSeconds: typeof timeWindowSeconds === "number" ? timeWindowSeconds : undefined,
        severity,
        action,
      },
      admin.email
    );

    if (!updated) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({ rule: updated });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}
