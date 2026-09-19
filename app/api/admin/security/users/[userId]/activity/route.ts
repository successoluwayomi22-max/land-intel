import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { securityStore } from "@/lib/security/store";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await requireAdmin();
    const { userId } = params;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        isVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Audit logs for this user
    const auditLogs = await db.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // 2. Security events involving this user
    const allEvents = (await securityStore.getEvents({ limit: 500 })).events;
    const userSecurityEvents = allEvents.filter(
      (e) => e.actorId === userId || e.actorEmail === user.email
    );

    // 3. User payments
    const payments = await db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // 4. Synthesize unified timeline
    const timeline = [
      ...auditLogs.map((a) => ({
        id: a.id,
        timestamp: a.createdAt.toISOString(),
        type: "AUDIT",
        action: a.action,
        description: `Action ${a.action} performed on ${a.resourceType || "resource"} (${a.resourceId || "N/A"})`,
        ip: a.ipAddress,
      })),
      ...userSecurityEvents.map((s) => ({
        id: s.id,
        timestamp: s.timestamp,
        type: "SECURITY",
        action: s.eventType,
        description: `Security Rule ${s.detectionRule}: ${s.actionTaken}`,
        ip: s.ip,
        severity: s.severity,
      })),
      ...payments.map((p) => ({
        id: p.id,
        timestamp: p.createdAt.toISOString(),
        type: "BILLING",
        action: `PAYMENT_${p.status}`,
        description: `Payment ${p.reference} of ₦${p.amount.toLocaleString()} - Status: ${p.status}`,
        ip: undefined,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      user,
      timeline,
      totalActivityCount: timeline.length,
    });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}
