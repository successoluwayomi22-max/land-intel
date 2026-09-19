import { db } from "@/lib/db";

export interface IncrementUsageParams {
  organizationId: string;
  casesCreated?: number;
  documentsUploaded?: number;
  storageBytes?: number;
  ocrOperations?: number;
  aiTokensUsed?: number;
  reportsGenerated?: number;
  exportsCount?: number;
  externalVerifications?: number;
}

export function getCurrentPeriodKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function getOrCreateUsageRecord(organizationId: string, period?: string) {
  const currentPeriod = period || getCurrentPeriodKey();

  const existing = await db.usageRecord.findUnique({
    where: {
      organizationId_period: {
        organizationId,
        period: currentPeriod,
      },
    },
  });

  if (existing) return existing;

  return db.usageRecord.create({
    data: {
      organizationId,
      period: currentPeriod,
    },
  });
}

export async function incrementUsage(params: IncrementUsageParams) {
  const period = getCurrentPeriodKey();

  // Ensure record exists
  await getOrCreateUsageRecord(params.organizationId, period);

  return db.usageRecord.update({
    where: {
      organizationId_period: {
        organizationId: params.organizationId,
        period,
      },
    },
    data: {
      casesCreated: params.casesCreated ? { increment: params.casesCreated } : undefined,
      documentsUploaded: params.documentsUploaded ? { increment: params.documentsUploaded } : undefined,
      storageBytes: params.storageBytes ? { increment: params.storageBytes } : undefined,
      ocrOperations: params.ocrOperations ? { increment: params.ocrOperations } : undefined,
      aiTokensUsed: params.aiTokensUsed ? { increment: params.aiTokensUsed } : undefined,
      reportsGenerated: params.reportsGenerated ? { increment: params.reportsGenerated } : undefined,
      exportsCount: params.exportsCount ? { increment: params.exportsCount } : undefined,
      externalVerifications: params.externalVerifications ? { increment: params.externalVerifications } : undefined,
    },
  });
}

export async function recordAICreditConsumption(params: {
  organizationId?: string;
  userId: string;
  caseId?: string;
  documentId?: string;
  operation: string;
  provider: string;
  model: string;
  tokensUsed: number;
  creditsConsumed?: number;
  estimatedCost?: number;
  currency?: string;
}) {
  const credits = params.creditsConsumed ?? Math.max(1, Math.ceil(params.tokensUsed / 1000));

  const entry = await db.aICreditLedger.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      caseId: params.caseId,
      documentId: params.documentId,
      operation: params.operation,
      provider: params.provider,
      model: params.model,
      tokensUsed: params.tokensUsed,
      creditsConsumed: credits,
      estimatedCost: params.estimatedCost ?? 0.001 * credits,
      currency: params.currency ?? "USD",
    },
  });

  if (params.organizationId) {
    await incrementUsage({
      organizationId: params.organizationId,
      aiTokensUsed: params.tokensUsed,
    });
  }

  return entry;
}
