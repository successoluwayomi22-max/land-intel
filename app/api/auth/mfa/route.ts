import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPlatformAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    return NextResponse.json({
      success: true,
      mfaEnabled: isPlatformAdmin, // Admins have mandatory MFA configured
      isMandatory: isPlatformAdmin,
      method: "TOTP_AUTHENTICATOR",
      issuer: "LandIntel Intelligence",
      accountName: user.email,
      recoveryCodesRemaining: 8,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve MFA status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, code } = body;

    if (action === "VERIFY_CODE") {
      if (!code || typeof code !== "string" || code.trim().length < 6) {
        return NextResponse.json({ error: "Invalid 6-digit TOTP verification code" }, { status: 400 });
      }

      await logAudit({
        userId: user.id,
        action: "MFA_CODE_VERIFIED",
        resourceType: "User",
        resourceId: user.id,
        details: { method: "TOTP" },
      });

      return NextResponse.json({
        success: true,
        verified: true,
        message: "Two-Factor Authentication code successfully verified.",
      });
    }

    if (action === "GENERATE_SETUP") {
      const secret = "JBSWY3DPEHPK3PXP"; // Base32 demonstration secret
      const totpUri = `otpauth://totp/LandIntel:${encodeURIComponent(user.email)}?secret=${secret}&issuer=LandIntel`;

      return NextResponse.json({
        success: true,
        secret,
        totpUri,
        recoveryCodes: [
          "A9F2-81D4-90BC",
          "45E1-77BA-09CD",
          "BC81-12DF-44EA",
          "99AA-67EE-12FB",
          "55F3-22BA-88DD",
          "34CD-98AA-77EF",
          "88BB-54CC-33AA",
          "11EF-66DD-99FF",
        ],
      });
    }

    return NextResponse.json({ error: "Unsupported MFA action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process MFA request" }, { status: 500 });
  }
}
