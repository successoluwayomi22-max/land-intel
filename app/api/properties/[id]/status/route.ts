import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertCaseOwnership } from "@/lib/services/entitlement";
import { db } from "@/lib/db";

export const runtime = "nodejs";

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

    const propertyCase = await db.propertyCase.findUnique({
      where: { id: caseId },
      include: {
        documents: {
          select: {
            id: true,
            originalName: true,
            category: true,
            processingStatus: true,
            pageCount: true,
            createdAt: true,
          },
        },
        riskScore: {
          select: {
            score: true,
            level: true,
            explanation: true,
            documentationScore: true,
            ownershipScore: true,
            geographicScore: true,
            consistencyScore: true,
            updatedAt: true,
          },
        },
        verificationItems: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!propertyCase) {
      return NextResponse.json({ error: "Property case not found" }, { status: 404 });
    }

    const totalDocs = propertyCase.documents.length;
    const completedDocs = propertyCase.documents.filter(
      (d) => d.processingStatus === "COMPLETED"
    ).length;

    let progressPercent = 0;
    let currentStage = "Idle / Awaiting Uploads";

    switch (propertyCase.status) {
      case "DRAFT":
        progressPercent = 10;
        currentStage = "Draft Created";
        break;
      case "UPLOADING":
        progressPercent = totalDocs > 0 ? Math.min(40, Math.round((completedDocs / totalDocs) * 40)) : 20;
        currentStage = "Document Ingestion & Malware Scan";
        break;
      case "ANALYZING":
        progressPercent = 75;
        currentStage = "Cross-Document Reconciliation & Gazette Overlay";
        break;
      case "ANALYSIS_COMPLETE":
      case "REPORT_GENERATED":
      case "COMPLETED":
        progressPercent = 100;
        currentStage = "Cadastral Audit Complete";
        break;
      case "NEEDS_REVIEW":
        progressPercent = 90;
        currentStage = "Manual Legal Review Required";
        break;
      case "ERROR":
        progressPercent = 0;
        currentStage = "Analysis Error Encountered";
        break;
      default:
        progressPercent = 50;
        currentStage = "Processing";
    }

    const verificationComplete = propertyCase.verificationItems.filter((i) => i.status === "COMPLETE").length;
    const verificationNeedsReview = propertyCase.verificationItems.filter((i) => i.status === "NEEDS_REVIEW").length;
    const verificationPending = propertyCase.verificationItems.filter((i) => i.status === "PENDING").length;
    const verificationTotal = propertyCase.verificationItems.length;

    return NextResponse.json(
      {
        id: propertyCase.id,
        title: propertyCase.title,
        status: propertyCase.status,
        progressPercent,
        currentStage,
        totalDocs,
        completedDocs,
        documents: propertyCase.documents,
        riskScore: propertyCase.riskScore,
        verification: {
          total: verificationTotal,
          complete: verificationComplete,
          needsReview: verificationNeedsReview,
          pending: verificationPending,
        },
        updatedAt: propertyCase.updatedAt.toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("[CASE_STATUS_API_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve case status" },
      { status: 500 }
    );
  }
}
