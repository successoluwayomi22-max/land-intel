import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { BillingService, BillingProvider } from "@/lib/services/billing";

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const providerParam = params.provider.toUpperCase();

  try {
    const rawBody = await request.text();

    // 1. Signature Verification for Paystack
    if (providerParam === "PAYSTACK") {
      const signature = request.headers.get("x-paystack-signature") || "";
      const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || "placeholder_secret";

      if (process.env.PAYSTACK_WEBHOOK_SECRET && !process.env.PAYSTACK_WEBHOOK_SECRET.includes("placeholder")) {
        const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
        if (hash !== signature) {
          try {
            const { threatEngine } = await import("@/lib/security/engine");
            await threatEngine.reportThreat("WEBHOOK_INVALID_SIGNATURE", {
              ip: request.headers.get("x-forwarded-for")?.split(",")[0] || "0.0.0.0",
              endpoint: `/api/v1/billing/webhooks/${params.provider}`,
              method: "POST",
            }, { provider: providerParam });
          } catch {}
          return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }
      }
    }

    const payload = JSON.parse(rawBody);

    // 2. Normalization
    let reference = "";
    let eventName = "";
    let amount = 0;
    let currency = "NGN";
    let metadata: Record<string, any> = {};

    if (providerParam === "PAYSTACK") {
      eventName = payload.event || "charge.success";
      const data = payload.data || {};
      reference = data.reference;
      amount = (data.amount || 0) / 100;
      currency = data.currency || "NGN";
      metadata = data.metadata || {};
    } else if (providerParam === "STRIPE") {
      eventName = payload.type || "payment_intent.succeeded";
      const data = payload.data?.object || {};
      reference = data.metadata?.reference || data.id;
      amount = (data.amount || 0) / 100;
      currency = (data.currency || "USD").toUpperCase();
      metadata = data.metadata || {};
    } else {
      // Sandbox / Generic
      eventName = payload.event || "charge.success";
      reference = payload.reference || payload.data?.reference;
      amount = payload.amount || payload.data?.amount || 0;
      currency = payload.currency || payload.data?.currency || "NGN";
      metadata = payload.metadata || payload.data?.metadata || {};
    }

    if (!reference) {
      return NextResponse.json({ error: "Missing transaction reference in payload" }, { status: 400 });
    }

    // 3. Process Event
    if (eventName === "charge.success" || eventName === "payment_intent.succeeded") {
      const result = await BillingService.activatePaymentAndSubscription({
        provider: providerParam as BillingProvider,
        event: eventName,
        reference,
        amount,
        currency,
        metadata,
        rawPayload: rawBody,
      });

      return NextResponse.json({ success: true, result });
    } else if (eventName === "charge.failed" || eventName === "payment_intent.payment_failed") {
      await BillingService.handlePaymentFailure(reference, payload.data?.gateway_response || "Payment declined");
      return NextResponse.json({ success: true, status: "failed_recorded" });
    }

    return NextResponse.json({ success: true, status: "ignored_event" });
  } catch (error: any) {
    console.error("[WEBHOOK_PROCESSING_ERROR]", error);
    return NextResponse.json({ error: error.message || "Webhook handling failed" }, { status: 500 });
  }
}
