import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { securityStore } from "@/lib/security/store";
import { threatEngine } from "@/lib/security/engine";
import { IPSecurityState } from "@/lib/security/types";

export async function GET() {
  try {
    await requireAdmin();
    const records = await securityStore.getAllIPRecords();

    const activeBlocks = records.filter(
      (r) => r.status === "TEMPORARILY_BLOCKED" || r.status === "PERMANENTLY_BLOCKED"
    );
    const allowlist = records.filter((r) => r.isAllowlisted || r.status === "ALLOW");
    const denylist = records.filter((r) => r.isDenylisted || r.status === "PERMANENTLY_BLOCKED");
    const monitored = records.filter((r) => r.status === "MONITOR" && r.threatScore >= 20);

    return NextResponse.json({
      records,
      activeBlocks,
      allowlist,
      denylist,
      monitored,
      totalTrackedIps: records.length,
    });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const { ip, state, reason, durationMinutes } = body;

    if (!ip || !state || !reason) {
      return NextResponse.json(
        { error: "IP, state (ALLOW, MONITOR, RATE_LIMIT, TEMPORARILY_BLOCKED, PERMANENTLY_BLOCKED), and reason are required" },
        { status: 400 }
      );
    }

    // Protect super admin from locking out localhost
    if ((ip === "127.0.0.1" || ip === "localhost") && state.includes("BLOCKED")) {
      return NextResponse.json(
        { error: "Accidental lockout prevention: Loopback address (127.0.0.1) cannot be blocked." },
        { status: 400 }
      );
    }

    const updated = await threatEngine.updateIpEnforcement({
      ip,
      state: state as IPSecurityState,
      reason,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
      adminEmail: admin.email,
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}
