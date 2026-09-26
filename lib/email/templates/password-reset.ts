interface PasswordResetEmailProps {
  userName: string;
  otpCode: string;
  expiresInMinutes?: number;
}

/**
 * Password reset 6-digit OTP email template.
 */
export function PasswordResetEmail({
  userName,
  otpCode,
  expiresInMinutes = 5,
}: PasswordResetEmailProps): string {
  const firstName = userName.split(" ")[0] || userName;
  const spacedCode = otpCode.split("").join(" &nbsp; ");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reset Your LandIntel Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0c1427 0%,#1e3a5f 100%);padding:36px;text-align:center;">
              <img src="https://land-intel-omega.vercel.app/logo-icon.svg" width="44" height="44" alt="Land Intel" style="display:inline-block;width:44px;height:44px;border:0;outline:none;margin-bottom:12px;" />
              <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:12px 0 4px;letter-spacing:-0.5px;">Password Reset Code</h1>
              <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;font-weight:500;">LandIntel Account Security</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px;color:#1e293b;margin:0 0 12px;line-height:1.5;">
                Hi <strong>${firstName}</strong>,
              </p>
              <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6;">
                We received a request to reset your password for your LandIntel account. Enter this 6-digit verification code on the reset page:
              </p>

              <!-- OTP Code Block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;padding:18px 36px;background-color:#f8fafc;border:2px dashed #0284c7;border-radius:14px;">
                      <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#0369a1;font-family:'Courier New',monospace;">
                        ${spacedCode}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 14px;background-color:#fef3c7;border-radius:8px;border:1px solid #fde68a;">
                    <p style="font-size:12px;color:#92400e;margin:0;font-weight:600;">
                      ⏱ This verification code expires in ${expiresInMinutes} minutes. If you requested multiple codes, only the most recent code will work.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;text-align:center;">
                Questions? Contact our security team at <a href="mailto:support@landintel.ai" style="color:#2563eb;text-decoration:none;font-weight:600;">support@landintel.ai</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="font-size:11px;color:#94a3b8;margin:0;line-height:1.5;">
                LandIntel Technologies Ltd &bull; CAC Reg. RC 8365907<br />
                Plot 14, Commercial Avenue, Victoria Island, Lagos, Nigeria<br />
                &copy; ${new Date().getFullYear()} LandIntel. All rights reserved.
              </p>
              <p style="font-size:10px;color:#cbd5e1;margin:6px 0 0;">
                Security Notice: LandIntel will never ask for your password, OTP, or banking PIN via email.
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
