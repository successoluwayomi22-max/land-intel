import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS, PlanKey } from "@/lib/services/plans";
import { getUserEntitlements } from "@/lib/services/entitlement";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEntitlements = await getUserEntitlements(user.id);

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const subscription = membership?.organization?.subscriptions?.[0];
  const now = new Date();
  const isSubExpired = subscription ? new Date(subscription.currentPeriodEnd) < now : false;

  const planName = userEntitlements.planKey;
  const planDef = PLANS[planName] || PLANS.FREE;

  let displayStatus = "FREE";
  if (subscription) {
    displayStatus = isSubExpired ? "EXPIRED" : subscription.status;
  } else if (userEntitlements.planKey !== "FREE") {
    displayStatus = "ACTIVE";
  } else if (user.role === "PAID" && userEntitlements.planKey === "FREE") {
    displayStatus = "EXPIRED";
  }

  return NextResponse.json({
    success: true,
    subscription: subscription
      ? {
          id: subscription.id,
          status: displayStatus,
          isExpired: isSubExpired,
          provider: subscription.provider,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          plan: {
            key: planName,
            name: planDef.name,
            priceNgn: planDef.priceNgn,
            priceUsd: planDef.priceUsd,
            features: planDef.entitlements,
          },
        }
      : {
          id: null,
          status: displayStatus,
          isExpired: displayStatus === "EXPIRED",
          provider: "NONE",
          plan: {
            key: planName,
            name: planDef.name,
            priceNgn: planDef.priceNgn,
            priceUsd: planDef.priceUsd,
            features: planDef.entitlements,
          },
        },
    organization: membership?.organization
      ? {
          id: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug,
        }
      : null,
  });
}
