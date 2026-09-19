import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payment = await db.payment.findUnique({
    where: { id: params.paymentId },
    include: {
      propertyCase: { select: { id: true, title: true } },
      user: { select: { email: true, name: true } },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Authorize: Must be owner or admin
  const isPlatformAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (payment.userId !== user.id && !isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    payment: {
      id: payment.id,
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      verifiedAt: payment.verifiedAt,
      createdAt: payment.createdAt,
      metadata: payment.metadata ? JSON.parse(payment.metadata) : {},
      case: payment.propertyCase,
      customer: payment.user,
    },
  });
}
