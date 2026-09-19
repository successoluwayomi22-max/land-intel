import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "Authentication is required to view notifications.",
          requestId,
        },
      },
      { status: 401 }
    );
  }

  // Generate personalized notifications based on user context
  const notifications = [
    {
      id: "notif-welcome-" + user.id.slice(-6),
      userId: user.id,
      type: "WELCOME",
      title: "Welcome to Landintel Due-Diligence Engine",
      message:
        "Your account is active. You can now upload property documents, verify cadastral boundaries, and cross-reconcile ownership records.",
      severity: "INFO",
      read: false,
      createdAt: user.createdAt.toISOString(),
    },
    {
      id: "notif-security-" + user.id.slice(-6),
      userId: user.id,
      type: "SECURITY",
      title: "Account Security & Multi-Factor Protection",
      message:
        "Your investor session is encrypted and protected with server-authoritative audit logging.",
      severity: "SUCCESS",
      read: true,
      createdAt: user.createdAt.toISOString(),
    },
  ];

  return NextResponse.json({
    data: notifications,
    meta: {
      requestId,
      total: notifications.length,
    },
  });
}
