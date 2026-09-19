import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/services/entitlement";
import { logAudit } from "@/lib/services/audit";

const CreateCaseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  country: z.string().default("Nigeria"),
  countryCode: z.string().default("NG"),
  state: z.string().min(2, "State/Region is required"),
  lga: z.string().min(2, "District/LGA is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  propertyType: z.string(),
  purchasePrice: z.number().optional().nullable(),
  currency: z.string().default("NGN"),
  sellerName: z.string().optional().nullable(),
  agentName: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cases = await db.propertyCase.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.id },
    include: {
      riskScore: true,
      documents: { select: { id: true, originalName: true, category: true, processingStatus: true } },
      reports: { select: { id: true, isPaidUnlocked: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ cases });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entitlements = await getUserEntitlements(user.id);
  if (entitlements.activeCaseCount >= entitlements.maxCases) {
    return NextResponse.json(
      {
        error: `You have reached your case limit of ${entitlements.maxCases} properties on your current plan. Upgrade to analyze additional properties.`,
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = CreateCaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;

    const propertyCase = await db.propertyCase.create({
      data: {
        userId: user.id,
        title: data.title,
        country: data.country || "Nigeria",
        countryCode: data.countryCode || "NG",
        state: data.state,
        lga: data.lga,
        address: data.address,
        propertyType: data.propertyType,
        purchasePrice: data.purchasePrice || null,
        currency: data.currency || "NGN",
        sellerName: data.sellerName || null,
        agentName: data.agentName || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        description: data.description || null,
        status: "DRAFT",
      },
    });

    await logAudit({
      userId: user.id,
      action: "CASE_CREATED",
      resourceType: "PropertyCase",
      resourceId: propertyCase.id,
      details: { title: propertyCase.title, state: propertyCase.state },
    });

    return NextResponse.json({ case: propertyCase }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_CASE_ERROR]", error);
    return NextResponse.json({ error: "Failed to create property case" }, { status: 500 });
  }
}
