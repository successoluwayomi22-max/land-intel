import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getThreatRadarTelemetry,
  unbanIp,
  manualBanIp,
  recordThreatEvent,
} from "@/lib/security/threat-engine";
import { sendSecurityThreatAlertEmail } from "@/lib/email/send";
import { getClientIp } from "@/lib/rate-limit";

// GET /api/admin/security/threats - Fetch live threat telemetry and active bans
export async function GET() {
  try {
    await requireAdmin();
    const telemetry = await getThreatRadarTelemetry();
    return NextResponse.json({ success: true, ...telemetry });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Unauthorized" },
      { status: 403 }
    );
  }
}

// POST /api/admin/security/threats - Admin actions (Unban, Manual Ban, Send Test Alert)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const { action, ip, reason, durationHours, isPermanent } = body;

    if (action === "UNBAN") {
      if (!ip) {
        return NextResponse.json({ success: false, error: "Missing required parameter: ip" }, { status: 400 });
      }
      await unbanIp(ip);
      return NextResponse.json({
        success: true,
        message: `IP ${ip} has been successfully unbanned and removed from the active blocklist.`,
      });
    }

    if (action === "MANUAL_BAN") {
      if (!ip) {
        return NextResponse.json({ success: false, error: "Missing required parameter: ip" }, { status: 400 });
      }
      const profile = await manualBanIp(
        ip,
        reason || "Manually blacklisted by administrator",
        durationHours || 24,
        !!isPermanent
      );
      return NextResponse.json({
        success: true,
        message: `IP ${ip} is now blocked (${isPermanent ? "Permanent Blacklist" : `${durationHours || 24} Hours`}).`,
        profile,
      });
    }

    if (action === "TEST_ALERT") {
      const adminIp = getClientIp(request);
      const res = await sendSecurityThreatAlertEmail(
        {
          attackerIp: "197.210.65.184 (Simulated Attack)",
          attackType: "Automated Registration Spam & Rapid OTP Flood",
          threatScore: 45,
          strikeCount: 3,
          actionTaken: "AUTOMATIC IP BAN (24 Hours - Escalation Active)",
          bannedUntil: "24 Hours (Progressive Multiplier Applied)",
          details:
            "Test incident dispatched from Admin Dashboard. This confirms that the LandIntel Adaptive Cyber Defense Engine has direct delivery to your email inbox.",
          targetEndpoint: "/api/auth/register",
          userAgent: request.headers.get("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          timestamp: new Date().toUTCString(),
          adminDashboardUrl: "https://landintel.ai/admin",
        },
        "successoluwayomi22@gmail.com"
      );

      if (res.success) {
        return NextResponse.json({
          success: true,
          message: "Test cyber defense security alert successfully dispatched to successoluwayomi22@gmail.com!",
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: res.error || "Failed to send email alert. Please check SMTP / Resend configuration.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Supported: UNBAN, MANUAL_BAN, TEST_ALERT" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute threat management action" },
      { status: 500 }
    );
  }
}
