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
          message: "Authentication is required.",
          requestId,
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    data: {
      unreadCount: 1,
    },
    meta: {
      requestId,
    },
  });
}
