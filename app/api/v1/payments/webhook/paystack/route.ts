import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { PaymentService } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";

    const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || "mock_secret";

    // Validate HMAC SHA512 signature if live secret is set
    if (process.env.PAYSTACK_WEBHOOK_SECRET) {
      const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
      if (hash !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);

    if (payload.event === "charge.success") {
      const data = payload.data;
      const reference = data.reference;
      const amount = data.amount / 100;
      const currency = data.currency || "NGN";
      const metadata = data.metadata || {};

      const result = await PaymentService.processVerifiedWebhook({
        gateway: "PAYSTACK",
        event: "charge.success",
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
    console.error("[PAYSTACK_WEBHOOK_ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
