import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { assertCaseOwnership } from "@/lib/services/entitlement";
import { logAudit } from "@/lib/services/audit";

const UpdateChecklistSchema = z.object({
  itemId: z.string(),
  status: z.enum(["PENDING", "COMPLETE", "NEEDS_REVIEW", "NOT_APPLICABLE"]),
  notes: z.string().optional().nullable(),
});

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
    const parsed = UpdateChecklistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { itemId, status, notes } = parsed.data;

    const updated = await db.verificationItem.update({
      where: { id: itemId },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    await logAudit({
      userId: user.id,
      action: "VERIFICATION_ITEM_UPDATED",
      resourceType: "VerificationItem",
      resourceId: itemId,
      details: { status, caseId },
    });

    return NextResponse.json({ item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update verification item" }, { status: 400 });
  }
}
