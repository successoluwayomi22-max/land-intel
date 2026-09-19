import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BillingService } from "@/lib/services/billing";

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payment = await db.payment.findFirst({
    where: {
      OR: [{ id: params.paymentId }, { reference: params.paymentId }],
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const isPlatformAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (payment.userId !== user.id && !isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await BillingService.activatePaymentAndSubscription({
      provider: payment.provider as any,
      event: "manual.verify",
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Verification failed" },
      { status: 400 }
    );
  }
}
