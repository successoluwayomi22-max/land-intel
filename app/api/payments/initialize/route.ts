import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { assertCaseOwnership, isReportUnlocked } from "@/lib/services/entitlement";
import { initializeReportPayment } from "@/lib/services/payment";

const InitSchema = z.object({
  caseId: z.string(),
  packageType: z.enum(["STANDARD_AUDIT", "FULL_TITLE_VERIFICATION"]).optional(),
  method: z.enum(["PAYSTACK", "CARD", "WIRE", "SANDBOX", "INSTANT"]).optional(),
  currency: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = InitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid case ID or payment parameters" }, { status: 400 });
    }

    const { caseId, packageType, method, currency } = parsed.data;
    await assertCaseOwnership(user.id, caseId, user.role);

    const alreadyUnlocked = await isReportUnlocked(caseId, user.id, user.role);
    if (alreadyUnlocked) {
      return NextResponse.json({
        isUnlocked: true,
        alreadyUnlocked: true,
        message: "Full certification report is already unlocked.",
      });
    }

    // Determine public base origin so reverse proxy / Cloudflare tunnels work seamlessly
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;

    const paymentSession = await initializeReportPayment({
      userId: user.id,
      userEmail: user.email,
      caseId,
      packageType,
      origin,
      method: method || "PAYSTACK",
      currency: currency || "NGN",
    });

    return NextResponse.json(paymentSession);
  } catch (error: any) {
    console.error("[INIT_PAYMENT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to initialize payment" }, { status: 500 });
  }
}
