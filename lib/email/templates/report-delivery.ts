export interface ReportDeliveryEmailProps {
  userName: string;
  caseTitle: string;
  caseId: string;
  location?: string;
  riskScore?: number;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  reference: string;
  reportUrl: string;
  pdfUrl?: string;
}

/**
 * Report delivery email template — sent upon successful payment unlock of a property report.
 */
export function ReportDeliveryEmail({
  userName,
  caseTitle,
  caseId,
  location = "Nigeria",
  riskScore = 18,
  riskLevel = "LOW",
  reference,
  reportUrl,
  pdfUrl,
}: ReportDeliveryEmailProps): string {
  const firstName = userName.split(" ")[0] || userName;

  const riskBadgeBg =
    riskLevel === "LOW" ? "#ecfdf5" : riskLevel === "MEDIUM" ? "#fffbeb" : "#fef2f2";
  const riskBadgeText =
    riskLevel === "LOW" ? "#065f46" : riskLevel === "MEDIUM" ? "#92400e" : "#991b1b";
  const riskBadgeBorder =
    riskLevel === "LOW" ? "#a7f3d0" : riskLevel === "MEDIUM" ? "#fde68a" : "#fecaca";
  const riskLabel =
    riskLevel === "LOW"
      ? "Clean Title & Beacons Verified (Low Risk)"
      : riskLevel === "MEDIUM"
      ? "Caution Advised — Discrepancies Found"
      : "Critical Cadastral Risk Detected";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your LandIntel Property Due-Diligence Dossier is Ready</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0c1427 0%,#064e3b 100%);padding:40px 32px;text-align:center;">
              <div style="display:inline-block;width:48px;height:48px;background-color:rgba(255,255,255,0.15);border-radius:12px;line-height:48px;font-size:22px;font-weight:900;color:#ffffff;text-align:center;margin-bottom:14px;">L</div>
              <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 6px;letter-spacing:-0.5px;">Due-Diligence Dossier Certified</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;font-weight:500;">Official Land Title & Cadastral Audit Report</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px;color:#1e293b;margin:0 0 16px;line-height:1.6;">
                Dear <strong>${firstName}</strong>,
              </p>
              <p style="font-size:14px;color:#475569;margin:0 0 20px;line-height:1.7;">
                Your comprehensive 15-section forensic property due-diligence report for <strong>"${caseTitle}"</strong> has been fully certified and unlocked in your workspace.
              </p>

              <!-- Audit Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;background-color:#f1f5f9;">
                    <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Investigation Overview</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;width:38%;">Property Case:</td>
                        <td style="padding:6px 0;font-size:13px;font-weight:700;color:#0f172a;">${caseTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Jurisdiction:</td>
                        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${location}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Audit Certificate:</td>
                        <td style="padding:6px 0;font-size:12px;font-family:monospace;font-weight:700;color:#0369a1;">${reference}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0 4px;font-size:13px;color:#64748b;">Risk Evaluation:</td>
                        <td style="padding:8px 0 4px;">
                          <span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;background-color:${riskBadgeBg};color:${riskBadgeText};border:1px solid ${riskBadgeBorder};">
                            ${riskLabel} (${riskScore}/100)
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${reportUrl}" target="_blank" style="display:inline-block;background-color:#047857;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;box-shadow:0 2px 4px rgba(4,120,87,0.25);">
                      View Certified Dossier Online &rarr;
                    </a>
                  </td>
                </tr>
                ${
                  pdfUrl
                    ? `<tr>
                        <td align="center" style="padding-top:10px;">
                          <a href="${pdfUrl}" target="_blank" style="font-size:12px;color:#0369a1;text-decoration:underline;font-weight:600;">
                            Download Standalone PDF Version
                          </a>
                        </td>
                      </tr>`
                    : ""
                }
              </table>

              <!-- Forensic Points Checked -->
              <div style="background-color:#f8fafc;border-left:4px solid #047857;padding:14px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
                <p style="font-size:12px;font-weight:700;color:#0f172a;margin:0 0 6px;">Included in Your Certified Dossier:</p>
                <p style="font-size:12px;color:#475569;margin:0;line-height:1.6;">
                  • Beacon coordinates mathematical boundary plotting (WGS-84)<br />
                  • Government arterial setback & drainage buffer overlay check<br />
                  • Surveyor General registry registration status verification<br />
                  • 11-point statutory legal land title heuristic review
                </p>
              </div>

              <p style="font-size:13px;color:#64748b;margin:0;line-height:1.6;">
                If you have questions about the findings or need additional title verification services, our senior cadastral intelligence team is at your disposal.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 32px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#0f172a;margin:0 0 4px;">LandIntel Global Technologies</p>
              <p style="font-size:11px;color:#94a3b8;margin:0 0 8px;">Institutional Due Diligence & Cadastral Risk Intelligence</p>
              <p style="font-size:11px;color:#94a3b8;margin:0;">
                <a href="${reportUrl}" style="color:#0369a1;text-decoration:none;">Workspace</a> &bull;
                <a href="https://land-intel-omega.vercel.app/security" style="color:#0369a1;text-decoration:none;">Security & NDPR</a> &bull;
                <a href="mailto:support@landintel.ai" style="color:#0369a1;text-decoration:none;">Contact Support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
