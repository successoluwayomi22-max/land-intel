import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertCaseOwnership, isReportUnlocked } from "@/lib/services/entitlement";
import { generatePropertyDueDiligencePdf } from "@/lib/services/pdf-report";
import { logAudit } from "@/lib/services/audit";

export async function GET(
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

    // Enforce server-side entitlement check: user must have unlocked report or be an Admin
    const unlocked = await isReportUnlocked(caseId, user.id, user.role);
    if (!unlocked) {
      return NextResponse.json(
        {
          error: "Full Due-Diligence Report is locked. Please unlock the report to download the official PDF certification.",
        },
        { status: 403 }
      );
    }

    const pdfBuffer = await generatePropertyDueDiligencePdf(caseId);

    await logAudit({
      userId: user.id,
      action: "REPORT_DOWNLOADED",
      resourceType: "PropertyCase",
      resourceId: caseId,
      details: { format: "PDF" },
    });

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="LandIntel_Due_Diligence_Report_${caseId.slice(0, 8)}.pdf"`,
        "Cache-Control": "private, no-transform, no-store",
      },
    });
  } catch (error: any) {
    console.error("[PDF_DOWNLOAD_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to generate report PDF" }, { status: 500 });
  }
}
