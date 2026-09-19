import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { caseId, action } = body;

    if (!caseId) {
      return NextResponse.json({ error: "Missing caseId" }, { status: 400 });
    }

    if (action === "FORCE_UNLOCK") {
      // Find or create report for this case
      let report = await db.propertyReport.findFirst({
        where: { caseId },
      });

      if (!report) {
        const propCase = await db.propertyCase.findUnique({ where: { id: caseId } });
        if (!propCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });
        report = await db.propertyReport.create({
          data: {
            caseId,
            userId: propCase.userId,
            reportVersion: 1,
            status: "READY",
            summary: "Report administratively unlocked by platform operator.",
            isPaidUnlocked: true,
          },
        });
      } else {
        report = await db.propertyReport.update({
          where: { id: report.id },
          data: { isPaidUnlocked: true, status: "READY" },
        });
      }

      await db.propertyCase.update({
        where: { id: caseId },
        data: { status: "REPORT_GENERATED" },
      });

      await logAudit({
        userId: admin.id,
        action: "ADMIN_CASE_REPORT_UNLOCKED",
        resourceType: "PropertyCase",
        resourceId: caseId,
        details: { reportId: report.id },
      });

      return NextResponse.json({ success: true, report });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process case action" }, { status: 500 });
  }
}
