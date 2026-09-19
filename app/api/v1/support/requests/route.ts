import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { APP_CONFIG } from "@/lib/config";

// POST /api/v1/support/requests
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const {
      name,
      email,
      category = "GENERAL_SUPPORT",
      subject,
      message,
      caseId,
      priority = "NORMAL",
      contactPreference = "EMAIL",
    } = body;

    if (!email || !subject || !message) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Email, subject, and message are required fields.",
            requestId: crypto.randomUUID(),
          },
        },
        { status: 400 }
      );
    }

    const ticketNumber = `DL-SUP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const supportPayload = {
      ticketNumber,
      name: name || user?.name || "Guest Inquirer",
      email: email || user?.email,
      category,
      subject,
      message,
      caseId: caseId || null,
      priority,
      contactPreference,
      status: "OPEN",
      notifiedAdminEmail: APP_CONFIG.platformContact.email,
      createdAt: new Date().toISOString(),
    };

    // Store in AuditLog as official support request record
    const auditRecord = await db.auditLog.create({
      data: {
        userId: user ? user.id : null,
        action: "SUPPORT_REQUEST",
        resourceType: "SupportRequest",
        resourceId: ticketNumber,
        details: JSON.stringify(supportPayload),
      },
    });

    return NextResponse.json(
      {
        data: {
          id: auditRecord.id,
          ticketNumber,
          status: "OPEN",
          category,
          subject,
          adminNotified: true,
          adminContact: {
            email: APP_CONFIG.platformContact.email,
            whatsapp: APP_CONFIG.platformContact.primaryWhatsapp,
          },
          createdAt: supportPayload.createdAt,
        },
        meta: {
          requestId: crypto.randomUUID(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Support request creation error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to submit support request.",
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}

// GET /api/v1/support/requests
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: "AUTH_REQUIRED",
            message: "Authentication required to view support tickets.",
            requestId: crypto.randomUUID(),
          },
        },
        { status: 401 }
      );
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    // If admin, fetch all support requests; otherwise, fetch user's requests
    const records = await db.auditLog.findMany({
      where: {
        action: "SUPPORT_REQUEST",
        ...(isAdmin ? {} : { userId: user.id }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const requests = records.map((r: any) => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(r.details || "{}");
      } catch (e) {}
      return {
        id: r.id,
        ticketNumber: r.resourceId,
        userId: r.userId,
        createdAt: r.createdAt,
        ...parsed,
      };
    });

    return NextResponse.json({
      data: requests,
      meta: {
        requestId: crypto.randomUUID(),
        total: requests.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to retrieve support requests.",
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}
