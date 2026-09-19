import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertCaseOwnership, getUserEntitlements } from "@/lib/services/entitlement";
import { askCaseAssistant } from "@/lib/ai/pipeline";
import { logAudit } from "@/lib/services/audit";
import { db } from "@/lib/db";

const QuerySchema = z.object({
  question: z.string().min(2, "Question cannot be empty").max(500, "Question is too long"),
});

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

    // Enforce entitlement limit for assistant questions
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      const entitlements = await getUserEntitlements(user.id);
      const usedQueries = await db.auditLog.count({
        where: {
          userId: user.id,
          action: "ASSISTANT_QUERY",
          resourceId: caseId,
        },
      });

      if (usedQueries >= entitlements.maxAiQuestionsPerCase) {
        return NextResponse.json(
          {
            error: `AI Question quota exceeded (${entitlements.maxAiQuestionsPerCase} questions allowed on ${entitlements.planKey} plan). Please unlock the full certified report or upgrade your subscription to continue asking questions.`,
            code: "QUOTA_EXCEEDED",
            quota: entitlements.maxAiQuestionsPerCase,
            used: usedQueries,
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const parsed = QuerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const response = await askCaseAssistant(caseId, parsed.data.question);

    await logAudit({
      userId: user.id,
      action: "ASSISTANT_QUERY",
      resourceType: "PropertyCase",
      resourceId: caseId,
      details: { question: parsed.data.question },
    });

    return NextResponse.json({ response });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Assistant query failed" }, { status: 500 });
  }
}
