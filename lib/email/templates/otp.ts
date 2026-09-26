interface OTPEmailProps {
  userName: string;
  otpCode: string;
  expiresInMinutes?: number;
}

/**
 * OTP verification email template.
 * Large, clearly-formatted 6-digit code with expiry countdown.
 */
export function OTPEmail({
  userName,
  otpCode,
  expiresInMinutes = 10,
}: OTPEmailProps): string {
  const firstName = userName.split(" ")[0] || userName;
  // Space out digits for readability: "123456" → "1 2 3 4 5 6"
  const spacedCode = otpCode.split("").join(" &nbsp; ");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your LandIntel Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0c1427 0%,#1e3a5f 100%);padding:32px;text-align:center;">
              <img src="https://land-intel-omega.vercel.app/logo-icon.svg" width="44" height="44" alt="Land Intel" style="display:inline-block;width:44px;height:44px;border:0;outline:none;" />
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:12px 0 0;font-weight:600;">Email Verification</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px;color:#1e293b;margin:0 0 12px;line-height:1.5;">
                Hi <strong>${firstName}</strong>,
              </p>
              <p style="font-size:14px;color:#475569;margin:0 0 28px;line-height:1.6;">
                Enter this verification code to confirm your email address and activate your LandIntel account:
              </p>

              <!-- OTP Code Block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;padding:20px 40px;background-color:#f8fafc;border:2px dashed #cbd5e1;border-radius:14px;">
                      <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#0f172a;font-family:'Courier New',monospace;">
                        ${spacedCode}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;background-color:#fef3c7;border-radius:8px;border:1px solid #fde68a;">
                    <p style="font-size:13px;color:#92400e;margin:0;font-weight:700;">
                      ⏱ This verification code expires in ${expiresInMinutes} minutes.
                    </p>
                    <p style="font-size:11px;color:#b45309;margin:4px 0 0;">
                      If your code expires before you submit it, simply click "Resend Code" on the verification screen to receive a new one. Do not share this code with anyone.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;text-align:center;">
                If you didn't request this code, you can safely ignore this email. Need help? Contact <a href="mailto:support@landintel.ai" style="color:#2563eb;text-decoration:none;font-weight:600;">support@landintel.ai</a>.
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
