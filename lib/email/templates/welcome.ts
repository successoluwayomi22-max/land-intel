import * as React from "react";

interface WelcomeEmailProps {
  userName: string;
  loginUrl?: string;
}

/**
 * Welcome email template — sent after successful registration.
 * Uses inline styles for maximum email client compatibility.
 */
export function WelcomeEmail({
  userName,
  loginUrl = "https://land-intel-omega.vercel.app/login",
}: WelcomeEmailProps): string {
  const firstName = userName.split(" ")[0] || userName;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to LandIntel</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0c1427 0%,#1e3a5f 100%);padding:40px 32px;text-align:center;">
              <img src="https://land-intel-omega.vercel.app/logo-icon.svg" width="48" height="48" alt="Land Intel" style="display:inline-block;width:48px;height:48px;border:0;outline:none;margin-bottom:14px;" />
              <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:12px 0 4px;letter-spacing:-0.5px;">Welcome to LandIntel</h1>
              <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;font-weight:500;">Cadastral Due Diligence & Title Verification</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:16px;color:#1e293b;margin:0 0 16px;line-height:1.6;">
                Hi <strong>${firstName}</strong>,
              </p>
              <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.7;">
                Your LandIntel account is ready. You now have access to institutional-grade property due diligence, cadastral boundary verification, and statutory title search certification.
              </p>

              <!-- What you can do -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                    <p style="font-size:12px;color:#64748b;margin:0 0 8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Here's what you can do:</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr><td style="padding:4px 0;font-size:13px;color:#334155;">✅ &nbsp;Submit property cases for due diligence analysis</td></tr>
                      <tr><td style="padding:4px 0;font-size:13px;color:#334155;">✅ &nbsp;Verify cadastral boundaries against official records</td></tr>
                      <tr><td style="padding:4px 0;font-size:13px;color:#334155;">✅ &nbsp;Generate title search & risk assessment reports</td></tr>
                      <tr><td style="padding:4px 0;font-size:13px;color:#334155;">✅ &nbsp;Access multi-jurisdiction verification (Nigeria, UK, US, UAE)</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${loginUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#059669,#047857);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                      Open Your Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;text-align:center;">
                Need help? Reply to this email or contact <a href="mailto:successoluwayomi22@gmail.com" style="color:#2563eb;text-decoration:none;font-weight:600;">support@landintel.ai</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="font-size:11px;color:#94a3b8;margin:0;line-height:1.5;">
                LandIntel — Institutional Property Intelligence<br />
                © ${new Date().getFullYear()} LandIntel. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
