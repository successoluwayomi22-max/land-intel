import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackWebhookSignature, verifyAndUnlockPayment } from "@/lib/services/payment";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-paystack-signature") || "";
    const rawBody = await request.text();

    // Verify signature
    const isValid = verifyPaystackWebhookSignature(signature, rawBody);
    if (!isValid && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      if (reference) {
        await verifyAndUnlockPayment(reference);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PAYSTACK_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
