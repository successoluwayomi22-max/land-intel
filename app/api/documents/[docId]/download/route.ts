import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { assertCaseOwnership } from "@/lib/services/entitlement";
import { readPrivateFile } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doc = await db.propertyDocument.findUnique({
      where: { id: params.docId },
      include: { propertyCase: true },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Ownership check prevents IDOR
    await assertCaseOwnership(user.id, doc.caseId, user.role);

    const fileBuffer = await readPrivateFile(doc.storageKey);

    return new Response(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${doc.originalName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to download document" }, { status: 403 });
  }
}
