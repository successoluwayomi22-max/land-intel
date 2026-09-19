import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertCaseOwnership } from "@/lib/services/entitlement";
import { runCaseIntelligencePipeline } from "@/lib/ai/pipeline";
import { logAudit } from "@/lib/services/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const caseId = params.id;
    await assertCaseOwnership(user.id, caseId, user.role);

    await runCaseIntelligencePipeline(caseId);

    await logAudit({
      userId: user.id,
      action: "ANALYSIS_TRIGGERED",
      resourceType: "PropertyCase",
      resourceId: caseId,
    });

    return NextResponse.json({ success: true, message: "Intelligence pipeline completed." });
  } catch (error: any) {
    console.error("[ANALYZE_ERROR]", error);
    return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 });
  }
}
