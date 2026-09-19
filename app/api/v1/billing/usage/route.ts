import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateUsageRecord } from "@/lib/services/usage";
import { getUserEntitlements } from "@/lib/services/entitlement";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
  });

  const orgId = membership?.organizationId;
  const usage = orgId ? await getOrCreateUsageRecord(orgId) : null;
  const entitlements = await getUserEntitlements(user.id);

  return NextResponse.json({
    success: true,
    usage: {
      casesCreated: usage?.casesCreated || entitlements.activeCaseCount,
      maxCases: entitlements.maxCases,
      documentsUploaded: usage?.documentsUploaded || 0,
      storageBytes: usage?.storageBytes || 0,
      maxStorageBytes: entitlements.maxFileSizeBytes * entitlements.maxDocumentsPerCase,
      aiTokensUsed: usage?.aiTokensUsed || entitlements.monthlyAiTokensUsed,
      aiQuestionsUsed: Math.round((usage?.aiTokensUsed || 0) / 250),
      maxAiQuestions: entitlements.maxAiQuestionsPerCase,
      reportsGenerated: usage?.reportsGenerated || 0,
    },
  });
}
