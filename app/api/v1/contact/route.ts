import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformContact, updatePlatformContact } from "@/lib/settings";

export const dynamic = "force-dynamic";

// GET /api/v1/contact
export async function GET() {
  try {
    const contact = await getPlatformContact();
    return NextResponse.json(
      {
        data: {
          ...contact,
          enabledChannels: {
            email: Boolean(contact.email),
            whatsapp: Boolean(contact.primaryWhatsapp),
            facebook: Boolean(contact.facebook),
            instagram: Boolean(contact.instagram),
          },
        },
        meta: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: error.message || "Failed to retrieve contact configuration",
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
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

    const updated = await updatePlatformContact(body);

    // Log admin audit event for contact update
    try {
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
    } catch (auditErr) {
      console.warn("[PATCH /api/v1/contact] Audit log warning:", auditErr);
    }

    return NextResponse.json({
      data: {
        updated: true,
        contact: updated,
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
