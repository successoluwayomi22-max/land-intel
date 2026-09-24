export interface PaymentReceiptEmailProps {
  userName: string;
  userEmail: string;
  reference: string;
  amount: number;
  currency: string;
  packageName: string;
  dateStr?: string;
  subtotal?: number;
  vatAmount?: number;
  vatRate?: string;
  paymentMethod?: string;
  reportUrl?: string;
}

/**
 * Payment receipt & tax invoice email template.
 */
export function PaymentReceiptEmail({
  userName,
  userEmail,
  reference,
  amount,
  currency = "NGN",
  packageName,
  dateStr = new Date().toUTCString(),
  subtotal,
  vatAmount,
  vatRate = "7.5%",
  paymentMethod = "Paystack Online Checkout",
  reportUrl = "https://land-intel-omega.vercel.app/dashboard",
}: PaymentReceiptEmailProps): string {
  const firstName = userName.split(" ")[0] || userName;

  const currSymbol = currency.toUpperCase() === "USD" ? "$" : currency.toUpperCase() === "GBP" ? "£" : currency.toUpperCase() === "EUR" ? "€" : "₦";
  const formattedTotal = `${currSymbol}${amount.toLocaleString()}`;
  const formattedSubtotal = subtotal ? `${currSymbol}${subtotal.toLocaleString()}` : formattedTotal;
  const formattedVat = vatAmount ? `${currSymbol}${vatAmount.toLocaleString()}` : `${currSymbol}0`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Payment Receipt & Invoice — ${reference}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0c1427 0%,#1e293b 100%);padding:36px 32px;text-align:left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;width:40px;height:40px;background-color:rgba(255,255,255,0.15);border-radius:10px;line-height:40px;font-size:20px;font-weight:900;color:#ffffff;text-align:center;">L</div>
                    <span style="font-size:18px;font-weight:800;color:#ffffff;margin-left:10px;vertical-align:middle;">LandIntel</span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background-color:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:0.5px;">
                      PAID IN FULL
                    </span>
                  </td>
                </tr>
              </table>
              <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:20px 0 4px;letter-spacing:-0.5px;">Official Payment Receipt & Tax Invoice</h1>
              <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;">Ref: <span style="font-family:monospace;color:#38bdf8;">${reference}</span></p>
            </td>
          </tr>

          <!-- Receipt Details -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:14px;color:#334155;margin:0 0 20px;line-height:1.6;">
                Thank you for your business, <strong>${firstName}</strong>. We have received your payment for institutional land verification. Your invoice details are recorded below:
              </p>

              <!-- Meta Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;padding:16px;">
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#64748b;width:35%;">Billed To:</td>
                  <td style="padding:4px 0;font-size:12px;font-weight:700;color:#0f172a;">${userName} (${userEmail})</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#64748b;">Transaction Date:</td>
                  <td style="padding:4px 0;font-size:12px;font-weight:600;color:#0f172a;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#64748b;">Payment Method:</td>
                  <td style="padding:4px 0;font-size:12px;font-weight:600;color:#0f172a;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#64748b;">Invoice Reference:</td>
                  <td style="padding:4px 0;font-size:12px;font-family:monospace;font-weight:700;color:#0369a1;">${reference}</td>
                </tr>
              </table>

              <!-- Line Items -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
                <thead>
                  <tr style="border-bottom:2px solid #e2e8f0;">
                    <th align="left" style="padding:8px 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Item Description</th>
                    <th align="right" style="padding:8px 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:12px 0;font-size:13px;color:#0f172a;font-weight:600;">
                      ${packageName}
                      <span style="display:block;font-size:11px;color:#64748b;font-weight:normal;margin-top:2px;">
                        Forensic boundary verification, gazette setback check & 11-point legal deed cross-examination
                      </span>
                    </td>
                    <td align="right" style="padding:12px 0;font-size:13px;color:#0f172a;font-weight:700;">
                      ${formattedSubtotal}
                    </td>
                  </tr>
                  ${
                    vatAmount
                      ? `<tr>
                          <td style="padding:8px 0;font-size:12px;color:#64748b;">Statutory VAT (${vatRate})</td>
                          <td align="right" style="padding:8px 0;font-size:12px;color:#64748b;font-weight:600;">${formattedVat}</td>
                        </tr>`
                      : ""
                  }
                  <tr style="border-top:2px solid #e2e8f0;">
                    <td style="padding:12px 0;font-size:14px;font-weight:800;color:#0f172a;">Total Paid</td>
                    <td align="right" style="padding:12px 0;font-size:16px;font-weight:900;color:#047857;">
                      ${formattedTotal}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${reportUrl}" target="_blank" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;">
                      Open Investor Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;text-align:center;">
                Please retain this receipt for your corporate taxation or tax relief records. For billing inquiries, email <strong>billing@landintel.ai</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
              <p style="font-size:11px;color:#94a3b8;margin:0;">
                LandIntel Global Technologies &bull; Institutional Land Due Diligence &bull; support@landintel.ai
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
