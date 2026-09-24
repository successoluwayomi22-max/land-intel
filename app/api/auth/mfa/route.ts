import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, comparePassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/services/audit";
import {
  generateTotpSecret,
  generateTotpUri,
  verifyTotpCode,
  generateBackupCodes,
  verifyAndConsumeBackupCode,
} from "@/lib/security/totp";

// GET /api/auth/mfa - Get current MFA configuration status
export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        mfaEnabled: true,
        mfaBackupCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let recoveryCodesRemaining = 0;
    if (user.mfaBackupCodes) {
      try {
        const parsed = JSON.parse(user.mfaBackupCodes);
        if (Array.isArray(parsed)) {
          recoveryCodesRemaining = parsed.length;
        }
      } catch {}
    }

    const isPlatformAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    return NextResponse.json({
      success: true,
      mfaEnabled: !!user.mfaEnabled,
      isMandatory: isPlatformAdmin,
      method: "TOTP_AUTHENTICATOR",
      issuer: "LandIntel",
      accountName: user.email,
      recoveryCodesRemaining,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve MFA status" },
      { status: 500 }
    );
  }
}

// POST /api/auth/mfa - Setup, Verify, or Disable MFA
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, code, secret, backupCodes, password } = body;

    // 1. GENERATE FRESH SETUP (Secret, QR URI, Backup Codes)
    if (action === "GENERATE_SETUP") {
      const generatedSecret = generateTotpSecret(20);
      const generatedBackupCodes = generateBackupCodes(8);
      const totpUri = generateTotpUri(user.email, generatedSecret, "LandIntel");

      return NextResponse.json({
        success: true,
        secret: generatedSecret,
        totpUri,
        recoveryCodes: generatedBackupCodes,
      });
    }

    // 2. VERIFY CODE & ACTIVATE MFA
    if (action === "VERIFY_CODE" || action === "VERIFY_AND_ENABLE") {
      if (!code || typeof code !== "string") {
        return NextResponse.json(
          { error: "Invalid 6-digit TOTP verification code" },
          { status: 400 }
        );
      }

      // Check whether verifying against newly generated secret or existing secret
      const secretToVerify = secret || user.mfaSecret;

      if (!secretToVerify) {
        return NextResponse.json(
          { error: "No MFA secret found to verify. Please initialize setup first." },
          { status: 400 }
        );
      }

      const isValid = verifyTotpCode(code, secretToVerify, 1);

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid authenticator code. Check your authenticator app and try again." },
          { status: 400 }
        );
      }

      // Codes were verified! Save to database to activate MFA
      const codesToSave = backupCodes || generateBackupCodes(8);

      await db.user.update({
        where: { id: user.id },
        data: {
          mfaEnabled: true,
          mfaSecret: secretToVerify,
          mfaBackupCodes: JSON.stringify(codesToSave),
        },
      });

      await logAudit({
        userId: user.id,
        action: "MFA_ENABLED",
        resourceType: "User",
        resourceId: user.id,
        details: { method: "TOTP_RFC6238" },
      });

      return NextResponse.json({
        success: true,
        verified: true,
        mfaEnabled: true,
        recoveryCodes: codesToSave,
        message: "Two-Factor Authentication (TOTP) successfully activated.",
      });
    }

    // 3. DISABLE MFA
    if (action === "DISABLE") {
      // Must authenticate with current password or valid TOTP code to disable
      let authorized = false;

      if (password && user.passwordHash) {
        authorized = await comparePassword(password, user.passwordHash);
      } else if (code && user.mfaSecret) {
        authorized = verifyTotpCode(code, user.mfaSecret, 1);
        if (!authorized && user.mfaBackupCodes) {
          const backupCheck = verifyAndConsumeBackupCode(code, user.mfaBackupCodes);
          authorized = backupCheck.valid;
        }
      }

      if (!authorized) {
        return NextResponse.json(
          { error: "Authorization failed. Please enter your valid current password or authenticator code." },
          { status: 401 }
        );
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: null,
        },
      });

      await logAudit({
        userId: user.id,
        action: "MFA_DISABLED",
        resourceType: "User",
        resourceId: user.id,
        details: { method: "TOTP_RFC6238" },
      });

      return NextResponse.json({
        success: true,
        mfaEnabled: false,
        message: "Two-Factor Authentication has been successfully disabled.",
      });
    }

    return NextResponse.json({ error: "Unsupported MFA action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process MFA request" },
      { status: 500 }
    );
  }
}
