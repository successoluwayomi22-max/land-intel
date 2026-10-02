export interface SecurityAlertProps {
  attackerIp: string;
  attackType: string;
  threatScore: number;
  strikeCount: number;
  actionTaken: string;
  bannedUntil?: string;
  details?: string;
  targetEndpoint?: string;
  userAgent?: string;
  timestamp?: string;
  adminDashboardUrl?: string;
}

/**
 * Cyber Defense Security Alert Email Template
 * Sent to platform owner (successoluwayomi22@gmail.com) upon detecting spam attacks,
 * malicious probes, or when an attacking IP is automatically banned.
 */
export function SecurityAlertEmail({
  attackerIp,
  attackType,
  threatScore,
  strikeCount,
  actionTaken,
  bannedUntil = "24 Hours (Progressive Multiplier Active)",
  details = "High-frequency automated spam detected exceeding behavioral security thresholds.",
  targetEndpoint = "/api/auth/register",
  userAgent = "Unknown or Automated Script",
  timestamp = new Date().toUTCString(),
  adminDashboardUrl = "https://landintel.ai/admin",
}: SecurityAlertProps): string {
  const isCritical = threatScore >= 30 || strikeCount >= 3;
  const badgeColor = isCritical ? "#dc2626" : "#f59e0b";
  const badgeBg = isCritical ? "rgba(220, 38, 38, 0.15)" : "rgba(245, 158, 11, 0.15)";
  const levelText = isCritical ? "CRITICAL THREAT" : "ELEVATED ALERT";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Security Incident Alert - LandIntel</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0f19;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f19;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#0f172a;border-radius:16px;overflow:hidden;border:1px solid #1e293b;box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);">
          
          <!-- Alert Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#0f172a 100%);padding:32px 28px;border-bottom:1px solid #1e293b;text-align:left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;padding:4px 10px;border-radius:20px;background-color:${badgeBg};border:1px solid ${badgeColor};color:${badgeColor};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">
                      🛡️ ${levelText} &bull; STRIKE ${strikeCount}
                    </div>
                    <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 6px;letter-spacing:-0.5px;">
                      Hostile IP Blocked & Neutralized
                    </h1>
                    <p style="color:#94a3b8;font-size:13px;margin:0;">
                      LandIntel Adaptive Threat Engine has detected and mitigated an attack.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Incident Dossier Body -->
          <tr>
            <td style="padding:28px;">
              
              <!-- Key Incident Snapshot Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#090d16;border-radius:12px;border:1px solid #1e293b;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-weight:600;width:140px;">Attacker IP:</td>
                        <td style="padding:6px 0;font-size:13px;color:#f87171;font-family:monospace;font-weight:700;">
                          ${attackerIp}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-weight:600;">Attack Signature:</td>
                        <td style="padding:6px 0;font-size:13px;color:#f1f5f9;font-weight:600;">
                          ${attackType}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-weight:600;">Threat Score:</td>
                        <td style="padding:6px 0;font-size:13px;color:${badgeColor};font-weight:700;">
                          ${threatScore} / 100
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-weight:600;">Action Enforced:</td>
                        <td style="padding:6px 0;font-size:13px;color:#34d399;font-weight:700;">
                          ${actionTaken}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-weight:600;">Ban Duration:</td>
                        <td style="padding:6px 0;font-size:12px;color:#cbd5e1;font-family:monospace;">
                          ${bannedUntil}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-weight:600;">Target Route:</td>
                        <td style="padding:6px 0;font-size:12px;color:#38bdf8;font-family:monospace;">
                          ${targetEndpoint}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-weight:600;">Timestamp:</td>
                        <td style="padding:6px 0;font-size:12px;color:#94a3b8;font-family:monospace;">
                          ${timestamp}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Threat Analysis & Learning Context -->
              <div style="background-color:#111827;border-left:4px solid ${badgeColor};border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
                <p style="font-size:12px;color:#e2e8f0;margin:0 0 6px;font-weight:700;">
                  Incident Analysis & Adaptive Defense Response:
                </p>
                <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;">
                  ${details}
                </p>
                <p style="font-size:11px;color:#64748b;margin:8px 0 0;font-style:italic;">
                  Client User-Agent: ${userAgent}
                </p>
              </div>

              <!-- How the system got stronger -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 16px;background-color:#090d16;border-radius:10px;border:1px solid #1e293b;">
                    <p style="font-size:11px;color:#fbbf24;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      ⚡ Adaptive Escalation Status:
                    </p>
                    <p style="font-size:12px;color:#cbd5e1;margin:0;line-height:1.5;">
                      Strike penalty count for this IP is now <strong>Strike ${strikeCount}</strong>. If this attacker continues or tries to rotate user-agents, the penalty duration will automatically escalate by <strong>2.5x</strong> and enforce a permanent firewall freeze.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Call to Action -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${adminDashboardUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f172a;font-size:13px;font-weight:800;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                      Open Security Radar in Admin Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Security Footer -->
          <tr>
            <td style="padding:18px 28px;background-color:#090d16;border-top:1px solid #1e293b;text-align:center;">
              <p style="font-size:11px;color:#64748b;margin:0;line-height:1.5;">
                This is an automated high-priority cyber defense dispatch from <strong>LandIntel Security Engine</strong>.<br />
                Sent directly to platform administrator: <strong>successoluwayomi22@gmail.com</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
