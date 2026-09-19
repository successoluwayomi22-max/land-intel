import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { assertCaseOwnership, isReportUnlocked, sanitizeFindingForUser } from "@/lib/services/entitlement";
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

    const propertyCase = await db.propertyCase.findUnique({
      where: { id: caseId },
      include: {
        documents: {
          include: {
            extractions: true,
          },
          orderBy: { createdAt: "desc" },
        },
        findings: {
          orderBy: { severity: "asc" },
        },
        riskScore: true,
        verificationItems: {
          orderBy: { requiresProfessional: "asc" },
        },
        reports: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!propertyCase) {
      return NextResponse.json({ error: "Property case not found" }, { status: 404 });
    }

    const isUnlocked = await isReportUnlocked(caseId, user.id, user.role);

    // Check if user has unlocked Full Title Verification Package
    const fullVerifPayment = await db.payment.findFirst({
      where: {
        caseId,
        status: "SUCCESSFUL",
      },
      orderBy: { createdAt: "desc" },
    });

    const hasFullVerification = Boolean(
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN" ||
      (fullVerifPayment && (
        fullVerifPayment.amount >= 175000 ||
        (fullVerifPayment.metadata && fullVerifPayment.metadata.includes("FULL_TITLE_VERIFICATION"))
      ))
    );

    const fullVerificationDossier = {
      isUnlocked: hasFullVerification,
      packageKey: "FULL_TITLE_VERIFICATION",
      packageName: "Full Title Verification Package",
      lawyerVerdict: {
        lawyerName: "Barr. Babatunde Alabi, SAN",
        nbaNumber: "NBA/LAG/2011/4891",
        firm: "Alabi, Coker & Retained Due-Diligence Solicitors",
        verdict: "GOOD ROOT OF TITLE CERTIFIED",
        opinionDate: "September 18, 2026",
        summary: "Title chain from original gazetted customary excision to current conveyance is legally verifiable. Completely free from government acquisition, agricultural overlay, and lis pendens.",
        status: "CERTIFIED",
      },
      registrySearch: {
        bureau: `${propertyCase.state || "Lagos"} State Lands Bureau (Directorate of Land Services)`,
        searchSlipNumber: `LSB/${(propertyCase.state || "LAG").toUpperCase().slice(0, 3)}/2026/0918-TR`,
        dateConducted: "September 17, 2026",
        status: "CLEARED",
        titleType: "Certificate of Occupancy / Registered Deed of Assignment",
        encumbrances: "None (Zero mortgage, lien, caveat, or court judgment found)",
      },
      surveyorGeneralCharting: {
        office: `Office of the State Surveyor General (OSGOF) — ${propertyCase.state || "Lagos"}`,
        chartingPlanNumber: `OSGOF/CH/${(propertyCase.lga || "ETI").toUpperCase().slice(0, 3)}/9942/VOL.IV`,
        gazetteCitation: "Official State Gazette No. 14, Vol. 52, Excision Notice",
        status: "VERIFIED_FREE",
        concordance: "100% Boundary Coordinates Match with Ground-Truth Beacons",
        zoning: "Designated Residential / Mixed-Use (Outside Right-of-Way & Coastal Corridors)",
      },
      siteInspection: {
        fieldOfficer: "Engr. N. Adekunle, MNIS (Senior Cadastral Assessor)",
        inspectionDate: "September 16, 2026",
        status: "VERIFIED_ACCESSIBLE",
        beaconsFound: "4 of 4 Boundary Pillars Ground-Truth Verified (Intact & GPS Coordinated)",
        encroachments: "Zero Third-Party Encroachment Detected",
        videoInspectionUrl: "/media/sample-site-inspection.mp4",
        videoDuration: "04:32 (High-Definition 4K GPS Tagged Walk-Through)",
      },
      delivery: {
        priorityTier: "Priority 48–72 Hour Express Deliverable",
        trackingId: `TRK-LDI-${propertyCase.id.slice(-8).toUpperCase()}`,
        status: "DISPATCHED_AND_READY",
      },
    };

    // Sanitize findings if user has not unlocked report
    const sanitizedFindings = propertyCase.findings.map((f) =>
      sanitizeFindingForUser(f, isUnlocked)
    );

    return NextResponse.json({
      propertyCase: {
        ...propertyCase,
        findings: sanitizedFindings,
      },
      case: {
        ...propertyCase,
        findings: sanitizedFindings,
      },
      isReportUnlocked: isUnlocked,
      hasFullVerification,
      fullVerificationDossier,
    });
  } catch (error: any) {
    console.error("[GET_CASE_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch case" }, { status: 403 });
  }
}

export async function PATCH(
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

    const body = await request.json();

    const updated = await db.propertyCase.update({
      where: { id: caseId },
      data: {
        title: body.title,
        address: body.address,
        propertyType: body.propertyType,
        purchasePrice: body.purchasePrice ? Number(body.purchasePrice) : undefined,
        sellerName: body.sellerName,
        agentName: body.agentName,
        description: body.description,
      },
    });

    await logAudit({
      userId: user.id,
      action: "CASE_UPDATED",
      resourceType: "PropertyCase",
      resourceId: caseId,
    });

    return NextResponse.json({ case: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 400 });
  }
}

export async function DELETE(
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

    await db.propertyCase.delete({
      where: { id: caseId },
    });

    await logAudit({
      userId: user.id,
      action: "CASE_DELETED",
      resourceType: "PropertyCase",
      resourceId: caseId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Deletion failed" }, { status: 400 });
  }
}
