import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { assertCaseOwnership, getUserEntitlements } from "@/lib/services/entitlement";
import { savePrivateFile } from "@/lib/storage";
import { processDocumentPipeline } from "@/lib/ai/pipeline";
import { logAudit } from "@/lib/services/audit";
import { APP_CONFIG } from "@/lib/config";

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

    const documents = await db.propertyDocument.findMany({
      where: { caseId },
      include: { extractions: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 403 });
  }
}

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

    const entitlements = await getUserEntitlements(user.id);
    const existingDocCount = await db.propertyDocument.count({ where: { caseId } });

    if (existingDocCount >= entitlements.maxDocumentsPerCase) {
      return NextResponse.json(
        {
          error: `Document limit of ${entitlements.maxDocumentsPerCase} reached for this property on your current tier. Unlock report or upgrade for extended allowances.`,
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "UNKNOWN";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Size limit check
    if (file.size > APP_CONFIG.limits.free.maxFileSizeBytes && user.role === "FREE") {
      return NextResponse.json(
        { error: "File exceeds 10MB limit. Please upload a smaller file or upgrade." },
        { status: 400 }
      );
    }

    // Supported MIME check
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!allowedMimes.includes(file.type) && !file.name.match(/\.(pdf|png|jpg|jpeg|docx)$/i)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, PNG, JPG, or DOCX." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Security Pipeline: Magic byte signature check, archive bomb check, antivirus scan & quarantine
    const { fileSecurityService } = await import("@/lib/security/malware");
    const securityCheck = await fileSecurityService.processUpload({
      buffer,
      originalName: file.name,
      mimeType: file.type || "application/pdf",
      userId: user.id,
      caseId,
    });

    if (!securityCheck.allowed) {
      return NextResponse.json(
        {
          error: securityCheck.errorMessage || "Security scan failed. File has been quarantined for administrator review.",
          status: securityCheck.status,
          scanId: securityCheck.record.id,
        },
        { status: 400 }
      );
    }

    const storageKey = `${caseId}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;

    // Save to private clean storage (persisted to DB + local cache)
    await savePrivateFile(storageKey, buffer, file.type || "application/pdf");

    // Save to DB
    const document = await db.propertyDocument.create({
      data: {
        caseId,
        originalName: file.name,
        mimeType: file.type || "application/pdf",
        sizeBytes: file.size,
        storageKey,
        category,
        processingStatus: "PENDING",
      },
    });

    await logAudit({
      userId: user.id,
      action: "DOCUMENT_UPLOADED",
      resourceType: "PropertyDocument",
      resourceId: document.id,
      details: { caseId, filename: file.name, size: file.size },
    });

    // Execute processing pipeline asynchronously in background or synchronously
    try {
      await processDocumentPipeline(document.id);
    } catch (pipelineErr) {
      console.error("[PIPELINE_ERROR]", pipelineErr);
    }

    const updatedDoc = await db.propertyDocument.findUnique({
      where: { id: document.id },
      include: { extractions: true },
    });

    return NextResponse.json({ document: updatedDoc }, { status: 201 });
  } catch (error: any) {
    console.error("[UPLOAD_ERROR]", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
