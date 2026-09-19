import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/services/audit";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const sub = await db.subscription.findFirst({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
  });

  if (!sub) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  await db.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: false, status: "ACTIVE" },
  });

  await logAudit({
    userId: user.id,
    action: "SUBSCRIPTION_REACTIVATED",
    resourceType: "Subscription",
    resourceId: sub.id,
  });

  return NextResponse.json({
    success: true,
    message: "Subscription has been reactivated successfully.",
  });
}
