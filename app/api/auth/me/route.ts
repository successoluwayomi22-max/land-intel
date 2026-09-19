import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/services/entitlement";

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ user: null, entitlements: null });
  }

  const entitlements = await getUserEntitlements(user.id);

  return NextResponse.json({
    user,
    entitlements,
  });
}
