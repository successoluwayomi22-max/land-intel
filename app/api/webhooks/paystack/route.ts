import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackWebhookSignature, verifyAndUnlockPayment } from "@/lib/services/payment";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-paystack-signature") || "";
    const rawBody = await request.text();

    // Verify HMAC SHA512 signature
    const isValid = verifyPaystackWebhookSignature(signature, rawBody);
    if (!isValid && process.env.NODE_ENV === "production") {
      console.warn("[PAYSTACK_WEBHOOK] Rejected invalid or unauthenticated signature");
      return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      if (reference) {
        console.log(`[PAYSTACK_WEBHOOK] Processing charge.success for ref: ${reference}`);
        await verifyAndUnlockPayment(reference);
      }
    }

    return NextResponse.json({ received: true, status: "SUCCESS" }, { status: 200 });
  } catch (error) {
    console.error("[PAYSTACK_WEBHOOK_PROCESSING_ERROR]", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
