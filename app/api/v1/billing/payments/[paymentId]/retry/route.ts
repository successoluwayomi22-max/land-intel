import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BillingService } from "@/lib/services/billing";
import { PlanKey } from "@/lib/services/plans";

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payment = await db.payment.findUnique({
    where: { id: params.paymentId },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
  const planKey: PlanKey = (metadata.planKey || "PROFESSIONAL") as PlanKey;

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const session = await BillingService.createCheckout({
    userId: user.id,
    userEmail: user.email,
    planKey,
    currency: payment.currency,
    caseId: payment.caseId || undefined,
    origin,
  });

  return NextResponse.json({ success: true, session });
}
