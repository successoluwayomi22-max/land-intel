import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { BillingService } from "@/lib/services/billing";
import { PlanKey } from "@/lib/services/plans";

const CheckoutSchema = z.object({
  planKey: z.enum(["FREE", "STARTER", "PROFESSIONAL", "BUSINESS", "ENTERPRISE"]),
  currency: z.string().optional(),
  caseId: z.string().optional(),
  billingInterval: z.enum(["MONTHLY", "ANNUAL"]).optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;

    const session = await BillingService.createCheckout({
      userId: user.id,
      userEmail: user.email,
      planKey: parsed.data.planKey as PlanKey,
      currency: parsed.data.currency,
      caseId: parsed.data.caseId,
      billingInterval: parsed.data.billingInterval,
      origin,
      idempotencyKey: parsed.data.idempotencyKey || request.headers.get("idempotency-key") || undefined,
    });

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error("[BILLING_CHECKOUT_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
