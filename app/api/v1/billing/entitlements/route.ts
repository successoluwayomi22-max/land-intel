import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/services/entitlement";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entitlements = await getUserEntitlements(user.id);

  return NextResponse.json({
    success: true,
    entitlements,
  });
}
