import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get("stripe-signature") || "";

    const event = JSON.parse(rawBody);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const reference = session.client_reference_id || session.id;
      const amount = (session.amount_total || 0) / 100;
      const currency = (session.currency || "USD").toUpperCase();
      const metadata = session.metadata || {};

      const result = await PaymentService.processVerifiedWebhook({
        gateway: "STRIPE",
        event: event.type,
        reference,
        amount,
        currency,
        userId: metadata.userId,
        caseId: metadata.caseId,
        planKey: metadata.planKey,
        metadata,
      });

      return NextResponse.json({ status: "success", result });
    }

    return NextResponse.json({ status: "ignored" });
  } catch (err: any) {
    console.error("[STRIPE_WEBHOOK_ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
