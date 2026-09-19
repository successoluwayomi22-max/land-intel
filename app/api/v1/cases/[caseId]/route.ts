import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";
import { randomUUID } from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const requestId = randomUUID();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "Authentication is required.",
          requestId,
        },
      },
      { status: 401 }
    );
  }

  const propertyCase = await db.propertyCase.findUnique({
    where: { id: params.caseId },
    include: {
      documents: true,
      findings: true,
      riskScore: true,
      verificationItems: true,
      reports: true,
    },
  });

  if (!propertyCase) {
    return NextResponse.json(
      {
        error: {
          code: "CASE_NOT_FOUND",
          message: "The requested property case could not be found.",
          requestId,
        },
      },
      { status: 404 }
    );
  }

  // Multi-tenant authorization check: user must own case or be admin
  if (propertyCase.userId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      {
        error: {
          code: "RESOURCE_ACCESS_DENIED",
          message: "You do not have access to this property case.",
          requestId,
        },
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    data: {
      id: propertyCase.id,
      reference: `DL-${new Date().getFullYear()}-${propertyCase.id.slice(-6).toUpperCase()}`,
      name: propertyCase.title,
      status: propertyCase.status,
      countryCode: propertyCase.country === "Nigeria" ? "NG" : propertyCase.country,
      jurisdiction: {
        regionCode: propertyCase.state,
        districtCode: propertyCase.lga,
        city: propertyCase.address,
      },
      propertyType: propertyCase.propertyType,
      purchasePrice: propertyCase.purchasePrice,
      currency: propertyCase.currency,
      documentsCount: propertyCase.documents.length,
      findingsCount: propertyCase.findings.length,
      riskScore: propertyCase.riskScore ? propertyCase.riskScore.score : null,
      riskLevel: propertyCase.riskScore ? propertyCase.riskScore.level : "PENDING",
      createdAt: propertyCase.createdAt.toISOString(),
      updatedAt: propertyCase.updatedAt.toISOString(),
    },
    meta: { requestId },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const requestId = randomUUID();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "Authentication is required.",
          requestId,
        },
      },
      { status: 401 }
    );
  }

  const propertyCase = await db.propertyCase.findUnique({
    where: { id: params.caseId },
  });

  if (!propertyCase) {
    return NextResponse.json(
      {
        error: {
          code: "CASE_NOT_FOUND",
          message: "Case not found.",
          requestId,
        },
      },
      { status: 404 }
    );
  }

  if (propertyCase.userId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      {
        error: {
          code: "RESOURCE_ACCESS_DENIED",
          message: "You do not have permission to delete this case.",
          requestId,
        },
      },
      { status: 403 }
    );
  }

  await db.propertyCase.delete({ where: { id: params.caseId } });

  await logAudit({
    userId: user.id,
    action: "CASE_DELETE_V1",
    resourceType: "PropertyCase",
    resourceId: params.caseId,
  });

  return NextResponse.json({
    data: { deleted: true, caseId: params.caseId },
    meta: { requestId },
  });
}
