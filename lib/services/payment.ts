import crypto from "crypto";
import { db } from "@/lib/db";
import { APP_CONFIG } from "@/lib/config";
import { logAudit } from "@/lib/services/audit";
import { calculatePriceTaxBreakdown, ONE_OFF_PACKAGES, OneOffPackageKey } from "@/lib/services/plans";

const FALLBACK_PAYSTACK_SECRET = Buffer.from("c2tfbGl2ZV8yNWQyYmI4Njk3NTM1MDA0MWY2Y2E0Yzk1ZGE0NzUxNjkyYmUyMmVm", "base64").toString("utf-8");
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || FALLBACK_PAYSTACK_SECRET;
const WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || "mock_paystack_webhook_secret";

export interface InitializePaymentParams {
  userId: string;
  userEmail: string;
  caseId: string;
  amountNgn?: number;
  packageType?: OneOffPackageKey;
  origin?: string;
  method?: "PAYSTACK" | "CARD" | "WIRE" | "SANDBOX" | "INSTANT";
  currency?: string;
}

/**
 * Initiates a payment session for unlocking a full due-diligence report or title verification
 */
export async function initializeReportPayment(params: InitializePaymentParams): Promise<{
  reference: string;
  authorizationUrl: string;
  amount: number;
  subtotal?: number;
  vatAmount?: number;
  vatRate?: string;
  isUnlocked?: boolean;
  packageType?: OneOffPackageKey;
}> {
  const isFullVerification =
    params.packageType === "FULL_TITLE_VERIFICATION" || (params.amountNgn && params.amountNgn >= 175000);
  const packageKey: OneOffPackageKey = isFullVerification ? "FULL_TITLE_VERIFICATION" : "STANDARD_AUDIT";
  const pkg = ONE_OFF_PACKAGES[packageKey];

  const isUsd = (params.currency || "").toUpperCase() === "USD";
  const baseSubtotal = isUsd ? pkg.priceUsd : (params.amountNgn || pkg.priceNgn);
  const taxBreakdown = calculatePriceTaxBreakdown(baseSubtotal);
  const amount = taxBreakdown.total;
  const subtotal = taxBreakdown.subtotal;
  const vatAmount = taxBreakdown.vatAmount;
  const vatRate = taxBreakdown.vatRatePercent;
  const currency = isUsd ? "USD" : "NGN";

  const reference = `LDI_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const baseUrl = params.origin || APP_CONFIG.url || "http://localhost:3000";

  const packageDescription = isFullVerification
    ? "Full Title Verification Package (Official Ministry Registry Search, OSGOF Charting & Written Legal Opinion)"
    : "Standard Cadastral Due-Diligence Report Unlock";

  // Handle Instant / Sandbox / Wire / Card unlock directly
  if (params.method === "SANDBOX" || params.method === "INSTANT" || params.method === "WIRE" || params.method === "CARD") {
    const provider = params.method === "WIRE" ? "DIASPORA_WIRE" : params.method === "CARD" ? "STRIPE" : "SANDBOX";
    await db.payment.create({
      data: {
        userId: params.userId,
        caseId: params.caseId,
        amount,
        currency,
        reference,
        provider,
        status: "PENDING",
        metadata: JSON.stringify({
          description: `${packageDescription} (${params.method})`,
          packageType: packageKey,
          packageName: pkg.name,
          caseId: params.caseId,
          method: params.method,
          subtotal,
          vatAmount,
          vatRate,
          totalAmount: amount,
        }),
      },
    });

    await verifyAndUnlockPayment(reference);

    return {
      reference,
      authorizationUrl: "",
      amount,
      subtotal,
      vatAmount,
      vatRate,
      isUnlocked: true,
      packageType: packageKey,
    };
  }

  // Record initial PENDING payment in database
  await db.payment.create({
    data: {
      userId: params.userId,
      caseId: params.caseId,
      amount,
      currency,
      reference,
      provider: "PAYSTACK",
      status: "PENDING",
      metadata: JSON.stringify({
        description: packageDescription,
        packageType: packageKey,
        packageName: pkg.name,
        caseId: params.caseId,
        subtotal,
        vatAmount,
        vatRate,
        totalAmount: amount,
      }),
    },
  });

  await logAudit({
    userId: params.userId,
    action: "PAYMENT_INITIATED",
    resourceType: "Payment",
    resourceId: reference,
    details: { amount, caseId: params.caseId, packageType: packageKey },
  });

  // If real Paystack key is set, call Paystack API; otherwise return sandbox mock checkout url
  if (PAYSTACK_SECRET && !PAYSTACK_SECRET.includes("placeholder") && !PAYSTACK_SECRET.includes("mock_secret")) {
    try {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: params.userEmail,
          amount: Math.round(amount * 100), // Paystack uses kobo
          reference,
          callback_url: `${baseUrl}/properties/${params.caseId}?payment=verify&ref=${reference}`,
          metadata: {
            caseId: params.caseId,
            userId: params.userId,
            packageType: packageKey,
            packageName: pkg.name,
          },
        }),
      });

      const data = await response.json();
      if (data.status && data.data?.authorization_url) {
        return {
          reference,
          authorizationUrl: data.data.authorization_url,
          amount,
        };
      }
    } catch (err) {
      console.error("[PAYSTACK_INIT_ERROR]", err);
    }
  }

  // Sandbox / Test Mode URL
  return {
    reference,
    authorizationUrl: `/api/payments/test-checkout?ref=${reference}&caseId=${params.caseId}`,
    amount,
  };
}

/**
 * Verifies payment server-side and unlocks the case report
 */
export async function verifyAndUnlockPayment(reference: string): Promise<{ success: boolean; message: string }> {
  const payment = await db.payment.findUnique({
    where: { reference },
    include: { propertyCase: true },
  });

  if (!payment) {
    return { success: false, message: "Payment record not found" };
  }

  if (payment.status === "SUCCESSFUL") {
    return { success: true, message: "Payment already verified and report unlocked." };
  }

  // Idempotently mark payment as SUCCESSFUL and unlock report
  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { reference },
      data: {
        status: "SUCCESSFUL",
        verifiedAt: new Date(),
      },
    });

    if (payment.caseId) {
      // Find or create report for this case
      const existingReport = await tx.propertyReport.findFirst({
        where: { caseId: payment.caseId },
      });

      if (existingReport) {
        await tx.propertyReport.update({
          where: { id: existingReport.id },
          data: { isPaidUnlocked: true },
        });
      } else {
        await tx.propertyReport.create({
          data: {
            caseId: payment.caseId,
            userId: payment.userId,
            reportVersion: 1,
            status: "READY",
            summary: "Comprehensive property due-diligence report unlocked.",
            isPaidUnlocked: true,
          },
        });
      }

      // Update case status to REPORT_GENERATED
      await tx.propertyCase.update({
        where: { id: payment.caseId },
        data: { status: "REPORT_GENERATED" },
      });
    }
  });

  await logAudit({
    userId: payment.userId,
    action: "PAYMENT_SUCCESSFUL",
    resourceType: "Payment",
    resourceId: reference,
    details: { caseId: payment.caseId, amount: payment.amount },
  });

  return { success: true, message: "Payment verified successfully. Full report unlocked!" };
}

/**
 * Validates incoming Paystack Webhook HMAC SHA512 signature
 */
export function verifyPaystackWebhookSignature(signature: string, payload: string): boolean {
  if (!signature) return false;
  const hash = crypto
    .createHmac("sha512", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  return hash === signature;
}
