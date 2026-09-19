import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payments = await db.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      propertyCase: {
        select: {
          id: true,
          title: true,
          country: true,
          countryCode: true,
          address: true,
          lga: true,
          state: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    payments: payments.map((p: any) => {
      let meta: any = {};
      try {
        meta = typeof p.metadata === "string" ? JSON.parse(p.metadata) : p.metadata || {};
      } catch (e) {}

      const locationParts = p.propertyCase
        ? [p.propertyCase.lga, p.propertyCase.state, p.propertyCase.country].filter(Boolean).join(", ")
        : "";

      return {
        id: p.id,
        reference: p.reference,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        caseTitle: p.propertyCase?.title || meta.description || meta.packageName || "LandIntel Cadastral Audit Report",
        caseId: p.caseId,
        caseLocation: locationParts || null,
        caseAddress: p.propertyCase?.address || null,
        customerName: user.name || "Valued Client",
        customerEmail: user.email,
        verifiedAt: p.verifiedAt,
        createdAt: p.createdAt,
        metadata: meta,
      };
    }),
  });
}
