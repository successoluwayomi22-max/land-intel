import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/services/entitlement";
import { logAudit } from "@/lib/services/audit";
import { randomUUID } from "crypto";

const CreateCaseSchema = z.object({
  name: z.string().min(3, "Case name must be at least 3 characters"),
  countryCode: z.string().length(2).default("NG"),
  jurisdiction: z
    .object({
      regionCode: z.string().optional(),
      districtCode: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
  propertyType: z.enum([
    "LAND",
    "RESIDENTIAL",
    "COMMERCIAL",
    "AGRICULTURAL",
    "MIXED_USE",
    "OTHER",
  ]),
  purchasePrice: z.number().optional().nullable(),
  currency: z.string().default("NGN"),
  sellerName: z.string().optional().nullable(),
  agentName: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "Authentication is required to list property cases.",
          requestId,
        },
      },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10)));
  const statusFilter = searchParams.get("status");

  const where: any = { userId: user.id };
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [total, rawCases] = await Promise.all([
    db.propertyCase.count({ where }),
    db.propertyCase.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const cases = rawCases.map((c) => ({
    id: c.id,
    reference: `DL-${new Date().getFullYear()}-${c.id.slice(-6).toUpperCase()}`,
    name: c.title,
    status: c.status,
    countryCode: c.country === "Nigeria" ? "NG" : c.country,
    jurisdiction: {
      regionCode: c.state,
      districtCode: c.lga,
      city: c.address,
    },
    propertyType: c.propertyType,
    purchasePrice: c.purchasePrice,
    currency: c.currency,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return NextResponse.json({
    data: cases,
    meta: {
      requestId,
      page,
      pageSize,
      total,
      hasNextPage: page * pageSize < total,
    },
  });
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "Authentication is required to create a property case.",
          requestId,
        },
      },
      { status: 401 }
    );
  }

  const entitlements = await getUserEntitlements(user.id);
  if (entitlements.activeCaseCount >= entitlements.maxCases) {
    return NextResponse.json(
      {
        error: {
          code: "USAGE_LIMIT_REACHED",
          message: `Case limit of ${entitlements.maxCases} properties reached on your plan. Upgrade required.`,
          requestId,
        },
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = CreateCaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.errors[0].message,
            details: parsed.error.format(),
            requestId,
          },
        },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const { getJurisdictionAdapter } = await import("@/lib/jurisdictions/registry");
    const adapter = getJurisdictionAdapter(d.countryCode);

    const propertyCase = await db.propertyCase.create({
      data: {
        userId: user.id,
        title: d.name,
        country: adapter.name,
        state: d.jurisdiction?.regionCode || "Lagos",
        lga: d.jurisdiction?.districtCode || "Ibeju-Lekki",
        address: d.address || d.jurisdiction?.city || "Plot Reference Unspecified",
        propertyType: d.propertyType,
        purchasePrice: d.purchasePrice || null,
        currency: d.currency || adapter.primaryCurrency,
        sellerName: d.sellerName || null,
        agentName: d.agentName || null,
        latitude: d.latitude || null,
        longitude: d.longitude || null,
        status: "DRAFT",
      },
    });

    await logAudit({
      userId: user.id,
      action: "CASE_CREATE_V1",
      resourceType: "PropertyCase",
      resourceId: propertyCase.id,
      details: { reference: `DL-${new Date().getFullYear()}-${propertyCase.id.slice(-6).toUpperCase()}` },
    });

    return NextResponse.json(
      {
        data: {
          id: propertyCase.id,
          reference: `DL-${new Date().getFullYear()}-${propertyCase.id.slice(-6).toUpperCase()}`,
          name: propertyCase.title,
          status: propertyCase.status,
          countryCode: d.countryCode,
          jurisdiction: d.jurisdiction,
          propertyType: propertyCase.propertyType,
          purchasePrice: propertyCase.purchasePrice,
          currency: propertyCase.currency,
          createdAt: propertyCase.createdAt.toISOString(),
          updatedAt: propertyCase.updatedAt.toISOString(),
        },
        meta: { requestId },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err.message || "Failed to create property case",
          requestId,
        },
      },
      { status: 500 }
    );
  }
}
