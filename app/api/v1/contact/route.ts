import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/v1/contact
export async function GET() {
  return NextResponse.json({
    data: {
      email: APP_CONFIG.platformContact.email,
      whatsappNumbers: APP_CONFIG.platformContact.whatsappNumbers,
      primaryWhatsapp: APP_CONFIG.platformContact.primaryWhatsapp,
      secondaryWhatsapp: APP_CONFIG.platformContact.secondaryWhatsapp,
      facebook: APP_CONFIG.platformContact.facebook,
      facebookUrl: APP_CONFIG.platformContact.facebookUrl,
      instagram: APP_CONFIG.platformContact.instagram,
      instagramUrl: APP_CONFIG.platformContact.instagramUrl,
      supportAvailability: APP_CONFIG.platformContact.supportAvailability,
      supportMessage: APP_CONFIG.platformContact.supportMessage,
      enabledChannels: {
        email: true,
        whatsapp: true,
        facebook: true,
        instagram: true,
      },
    },
    meta: {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    },
  });
}

// PATCH /api/v1/contact - Admin update contact configuration
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        {
          error: {
            code: "ADMIN_REQUIRED",
            message: "Administrative privileges required to modify contact channels.",
            requestId: crypto.randomUUID(),
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Log admin audit event for contact update
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "ADMIN_UPDATE_CONTACT",
        resourceType: "PlatformContact",
        details: JSON.stringify({
          updatedBy: user.email,
          changes: body,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      data: {
        updated: true,
        contact: {
          ...APP_CONFIG.platformContact,
          ...body,
        },
      },
      meta: {
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to update contact channels",
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}
