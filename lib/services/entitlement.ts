import { db } from "@/lib/db";
import { APP_CONFIG } from "@/lib/config";
import { PLANS, PlanKey, ENTITLEMENT_KEYS, PlanDefinition } from "./plans";
import { getOrCreateUsageRecord, getCurrentPeriodKey } from "./usage";

export { ENTITLEMENT_KEYS, PLANS };
export type { PlanKey, PlanDefinition };

export interface UserEntitlement {
  userId: string;
  role: string;
  planKey: PlanKey;
  maxCases: number;
  maxDocumentsPerCase: number;
  maxFileSizeBytes: number;
  maxAiQuestionsPerCase: number;
  canViewDetailedEvidence: boolean;
  canGenerateFullReport: boolean;
  canDownloadPdf: boolean;
  canAccessGeospatial: boolean;
  canAccessExternalVerification: boolean;
  activeCaseCount: number;
  monthlyAiTokensUsed: number;
  entitlements: string[];
}

export async function getUserEntitlements(userId: string): Promise<UserEntitlement> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              subscriptions: {
                where: { status: { in: ["ACTIVE", "TRIAL", "GRACE_PERIOD"] } },
                include: { plan: true },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const role = user?.role || "FREE";
  const isPlatformAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  // Determine active plan
  let activePlanKey: PlanKey = "FREE";

  // If user has organization subscription, prioritize server subscription
  const primaryMembership = user?.memberships?.[0];
  const activeSub = primaryMembership?.organization?.subscriptions?.[0];

  const now = new Date();

  if (isPlatformAdmin) {
    activePlanKey = "ENTERPRISE";
  } else if (activeSub) {
    // Check if subscription has expired
    if (activeSub.currentPeriodEnd && new Date(activeSub.currentPeriodEnd) < now) {
      // Subscription period ended/pay finished! Mark as EXPIRED
      db.subscription
        .update({
          where: { id: activeSub.id },
          data: { status: "EXPIRED" },
        })
        .catch(() => {});
      activePlanKey = "FREE";
    } else if (activeSub.plan?.name && PLANS[activeSub.plan.name as PlanKey]) {
      activePlanKey = activeSub.plan.name as PlanKey;
    }
  } else if (role === "PAID") {
    // Verify whether paid status is within active validity period (30 days since last successful payment)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentPayment = await db.payment.findFirst({
      where: {
        userId,
        status: "SUCCESSFUL",
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentPayment) {
      activePlanKey = "PROFESSIONAL";
    } else {
      // Pay has finished! Automatically downgrade role and plan to FREE
      activePlanKey = "FREE";
      db.user
        .update({
          where: { id: userId },
          data: { role: "FREE" },
        })
        .catch(() => {});
    }
  }

  const planDef = PLANS[activePlanKey] || PLANS.FREE;

  const activeCaseCount = await db.propertyCase.count({
    where: { userId },
  });

  // Get monthly usage
  let monthlyAiTokensUsed = 0;
  if (primaryMembership?.organizationId) {
    const usage = await getOrCreateUsageRecord(primaryMembership.organizationId);
    monthlyAiTokensUsed = usage.aiTokensUsed;
  }

  return {
    userId,
    role,
    planKey: activePlanKey,
    maxCases: planDef.maxActiveCases,
    maxDocumentsPerCase: planDef.maxDocumentsPerCase,
    maxFileSizeBytes: planDef.maxFileSizeBytes,
    maxAiQuestionsPerCase: planDef.maxAiQuestionsPerCase,
    canViewDetailedEvidence: planDef.entitlements.includes(ENTITLEMENT_KEYS.ADVANCED_RECONCILIATION),
    canGenerateFullReport: planDef.entitlements.includes(ENTITLEMENT_KEYS.FULL_REPORT),
    canDownloadPdf: planDef.entitlements.includes(ENTITLEMENT_KEYS.FULL_REPORT),
    canAccessGeospatial: planDef.entitlements.includes(ENTITLEMENT_KEYS.GEOSPATIAL_ANALYSIS),
    canAccessExternalVerification: planDef.entitlements.includes(ENTITLEMENT_KEYS.EXTERNAL_VERIFICATION),
    activeCaseCount,
    monthlyAiTokensUsed,
    entitlements: planDef.entitlements,
  };
}

/**
 * 9-step server-authoritative entitlement and usage validator
 */
export async function assertEntitlement(params: {
  userId: string;
  organizationId?: string;
  entitlementKey: string;
  caseId?: string;
}): Promise<boolean> {
  const { userId, entitlementKey, caseId } = params;

  // 1. Authenticate user
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) throw new Error("Unauthorized: Invalid user context");

  // 2. Platform Admins have sovereign access to administrative and analysis functions
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return true;
  }

  // 3. Check resource ownership if caseId provided
  if (caseId) {
    await assertCaseOwnership(userId, caseId, user.role);
  }

  // 4. Resolve Entitlements
  const userEntitlement = await getUserEntitlements(userId);

  // 5. Verify Entitlement Key
  if (!userEntitlement.entitlements.includes(entitlementKey)) {
    throw new Error(
      `Entitlement Denied: Feature '${entitlementKey}' requires an upgraded plan. Current plan is ${userEntitlement.planKey}.`
    );
  }

  // 6. Check Specific Quotas
  if (entitlementKey === ENTITLEMENT_KEYS.CASE_CREATE) {
    if (userEntitlement.activeCaseCount >= userEntitlement.maxCases) {
      throw new Error(
        `Quota Exceeded: Active case limit (${userEntitlement.maxCases}) reached on plan ${userEntitlement.planKey}. Please upgrade to add more properties.`
      );
    }
  }

  return true;
}

/**
 * Validates whether a user or organization owns a given property case
 */
export async function assertCaseOwnership(userId: string, caseId: string, userRole?: string) {
  if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
    const c = await db.propertyCase.findUnique({ where: { id: caseId } });
    if (!c) throw new Error("Property case not found");
    return c;
  }

  const propertyCase = await db.propertyCase.findFirst({
    where: {
      id: caseId,
      userId,
    },
  });

  if (!propertyCase) {
    // Check if the case exists at all (indicating a targeted cross-tenant IDOR probing attempt)
    const existsElsewhere = await db.propertyCase.findUnique({
      where: { id: caseId },
      select: { id: true, userId: true, organizationId: true },
    });

    if (existsElsewhere) {
      // Targeted IDOR breach attempt detected
      try {
        const { threatEngine } = await import("@/lib/security/engine");
        await threatEngine.reportThreat(
          "IDOR_ATTEMPT",
          {
            ip: "0.0.0.0",
            actorId: userId,
            endpoint: `/api/properties/${caseId}`,
            method: "GET/POST",
          },
          {
            targetCaseId: caseId,
            victimUserId: existsElsewhere.userId,
            victimOrgId: existsElsewhere.organizationId,
          }
        );
      } catch {
        // Non-blocking security logging
      }
    }

    throw new Error("Access denied: You do not have permission to access this property case");
  }

  return propertyCase;
}

/**
 * Checks if a specific report is unlocked (via subscription, single payment, or admin privilege)
 */
export async function isReportUnlocked(caseId: string, userId: string, userRole?: string): Promise<boolean> {
  if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return true;

  const entitlements = await getUserEntitlements(userId);
  if (entitlements.canGenerateFullReport) return true;

  const report = await db.propertyReport.findFirst({
    where: { caseId },
    orderBy: { createdAt: "desc" },
  });

  if (report?.isPaidUnlocked) return true;

  // Check if a successful payment exists for this case or report
  const payment = await db.payment.findFirst({
    where: {
      userId,
      caseId,
      status: "SUCCESSFUL",
    },
  });

  return Boolean(payment);
}

/**
 * Redacts premium-only evidence details for free users to prevent client-side inspection leaks
 */
export function sanitizeFindingForUser<T extends { isPremiumLocked?: boolean; evidenceSummary?: string; pageReferences?: string | null }>(
  finding: T,
  isUnlocked: boolean
): T {
  if (isUnlocked) return finding;

  return {
    ...finding,
    evidenceSummary: finding.isPremiumLocked
      ? "[PREMIUM EVIDENCE LOCKED] Unlock the full due-diligence report to view detailed page-level document evidence, beacon citations, and cross-document references."
      : finding.evidenceSummary,
    pageReferences: finding.isPremiumLocked ? "Locked in Free Preview" : finding.pageReferences,
  };
}
