import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { BillingService } from "@/lib/services/billing";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Admin or Super Admin can view diagnostic reconciliation
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin privilege required" }, { status: 403 });
  }

  const diagnostics = await BillingService.reconcileDiagnostics();
  return NextResponse.json({ success: true, diagnostics });
}
