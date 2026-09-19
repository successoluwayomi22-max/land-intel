import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payments = await db.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      propertyCase: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({
    success: true,
    payments: payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      caseTitle: p.propertyCase?.title || "Plan Subscription",
      caseId: p.caseId,
      verifiedAt: p.verifiedAt,
      createdAt: p.createdAt,
      metadata: p.metadata ? JSON.parse(p.metadata) : {},
    })),
  });
}
