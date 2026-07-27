import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

const FROM = "Trivilla <onboarding@resend.dev>";

/**
 * Send a 6-digit OTP to the user's email address.
 * Returns `true` if the email was sent successfully, `false` otherwise.
 */
export async function sendOtpEmail(
  email: string,
  otp: string,
  name: string,
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Your Trivilla OTP — ${otp}`,
      html: otpEmailHtml(name, otp),
    });

    if (error) {
      console.error("Resend send error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend exception:", err);
    return false;
  }
}

export type BillDetails = {
  code: string;
  customerName: string;
  type: string;
  tableNo?: number | null;
  paymentMode: string;
  subtotal: number;
  tax: number;
  total: number;
  items: { name: string; qty: number; price: number }[];
  note?: string;
  createdAt: string;
};

/**
 * Send a beautifully formatted bill invoice to the customer's email,
 * including a QR code they can scan to view the bill on their phone.
 * Returns `true` if the email was sent successfully, `false` otherwise.
 */
export async function sendBillEmail(
  email: string,
  bill: BillDetails,
  billUrl: string,
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Your Invoice — ${bill.code} from Trivilla`,
      html: billEmailHtml(bill, billUrl),
    });

    if (error) {
      console.error("Resend send bill error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend exception:", err);
    return false;
  }
}

function billEmailHtml(bill: BillDetails, billUrl: string): string {
  const itemsHtml = bill.items
    .map(
      (i) => `
        <tr>
          <td style="padding:6px 0; font-size:13px; color:#2a1d0f; font-weight:600;">${i.name}</td>
          <td style="padding:6px 0; font-size:13px; color:#6b5a44; text-align:center;">×${i.qty}</td>
          <td style="padding:6px 0; font-size:13px; color:#2a1d0f; font-weight:700; text-align:right;">₹${Math.round(i.price * i.qty).toLocaleString("en-IN")}</td>
        </tr>`,
    )
    .join("");

  const cgst = Math.round(bill.tax / 2);
  const sgst = bill.tax - cgst;
  const date = new Date(bill.createdAt);
  const dateStr = date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
  const tableInfo =
    bill.type === "dine-in" && bill.tableNo
      ? `Table ${bill.tableNo}`
      : "Takeaway";

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(billUrl)}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background-color: #f5f0e8;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 520px;
            margin: 24px auto;
            background: #fffcf7;
            border-radius: 20px;
            border: 1px solid #e8ddd0;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          }
          .header {
            background: linear-gradient(135deg, #1e293b, #334155);
            padding: 22px 24px;
            text-align: center;
          }
          .header h1 {
            color: #fdf3e3;
            font-size: 26px;
            margin: 0;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .header span {
            color: #f0b86c;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .header .paid-badge {
            display: inline-block;
            margin-top: 8px;
            padding: 3px 14px;
            border-radius: 20px;
            background: rgba(255,255,255,0.12);
            color: #f0b86c;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            padding: 14px 24px;
            background: #faf6ef;
            border-bottom: 1px solid #e8ddd0;
          }
          .meta-item {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #a0907a;
          }
          .meta-value {
            font-size: 13px;
            font-weight: 700;
            color: #2a1d0f;
            margin-top: 2px;
          }
          .body {
            padding: 0 24px;
          }
          .customer-name {
            font-size: 13px;
            font-weight: 700;
            color: #2a1d0f;
            padding: 12px 24px;
            border-bottom: 1px solid #e8ddd0;
            background: #fdfaf5;
          }
          .items-header {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #a0907a;
            padding: 12px 24px 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            padding: 0 24px;
          }
          .totals {
            padding: 12px 24px;
            border-top: 1px solid #e8ddd0;
            background: #faf6ef;
          }
          .totals .row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: #6b5a44;
            padding: 3px 0;
          }
          .totals .grand {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            font-weight: 800;
            color: #2a1d0f;
            border-top: 1px dashed #d4c9b8;
            padding-top: 8px;
            margin-top: 6px;
          }
          .qr-section {
            text-align: center;
            padding: 20px 24px;
            border-top: 1px solid #e8ddd0;
          }
          .qr-section p {
            font-size: 12px;
            color: #6b5a44;
            margin: 8px 0 0;
            font-weight: 500;
          }
          .qr-section a {
            color: #bc4a10;
            font-weight: 700;
            text-decoration: underline;
          }
          .footer {
            font-size: 11px;
            color: #a0907a;
            text-align: center;
            padding: 14px 24px;
            border-top: 1px solid #e8ddd0;
            background: #faf6ef;
          }
          .note-banner {
            padding: 8px 24px;
            background: #fef7e6;
            font-size: 12px;
            color: #8a6d2b;
            font-weight: 600;
            border-top: 1px solid #e8ddd0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span>Trivilla</span>
            <h1>Smart Restaurant</h1>
            <div class="paid-badge">Paid</div>
          </div>

          <div class="meta">
            <div>
              <div class="meta-item">Invoice</div>
              <div class="meta-value">${bill.code}</div>
            </div>
            <div style="text-align:right;">
              <div class="meta-item">Date & Time</div>
              <div class="meta-value">${dateStr} · ${timeStr}</div>
            </div>
          </div>

          <div class="meta" style="border-top:0;">
            <div>
              <div class="meta-item">Service</div>
              <div class="meta-value">${tableInfo}</div>
            </div>
            <div style="text-align:right;">
              <div class="meta-item">Payment</div>
              <div class="meta-value">${bill.paymentMode.toUpperCase()}</div>
            </div>
          </div>

          <div class="customer-name">
            ${bill.customerName}
          </div>

          <div class="items-header">Order Details</div>
          <table style="padding:0 24px;">
            <thead>
              <tr style="border-bottom:1px solid #e8ddd0; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#a0907a;">
                <th style="text-align:left; padding-bottom:4px;">Item</th>
                <th style="text-align:center; padding-bottom:4px;">Qty</th>
                <th style="text-align:right; padding-bottom:4px;">Amt</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="row"><span>Subtotal</span><span style="font-weight:600;color:#2a1d0f;">₹${bill.subtotal.toLocaleString("en-IN")}</span></div>
            <div class="row"><span>CGST (2.5%)</span><span>₹${cgst.toLocaleString("en-IN")}</span></div>
            <div class="row"><span>SGST (2.5%)</span><span>₹${sgst.toLocaleString("en-IN")}</span></div>
            <div class="grand"><span>Grand Total</span><span>₹${bill.total.toLocaleString("en-IN")}</span></div>
          </div>

          ${bill.note ? `<div class="note-banner">📝 ${bill.note}</div>` : ""}

          <div class="qr-section">
            <img src="${qrUrl}" alt="Scan to view bill" width="180" height="180" style="border-radius:12px;" />
            <p>Scan the QR code or <a href="${billUrl}">click here</a> to view your bill online</p>
          </div>

          <div class="footer">
            Trivilla Smart Restaurant &bull; Linking Road, Bandra West, Mumbai - 400050<br />
            GSTIN: 27AABCT1234Q1Z5 &bull; Thank you for dining with us!
          </div>
        </div>
      </body>
    </html>
  `;
}

function otpEmailHtml(name: string, otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background-color: #faf6ef;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 480px;
            margin: 24px auto;
            background: #fffcf7;
            border-radius: 20px;
            border: 1px solid #e8ddd0;
            overflow: hidden;
          }
          .header {
            background: #bc4a10;
            padding: 28px 24px;
            text-align: center;
          }
          .header h1 {
            color: #fdf3e3;
            font-size: 28px;
            margin: 0;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .header span {
            color: #e8b85c;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .body {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 16px;
            font-weight: 600;
            color: #2a1d0f;
            margin: 0 0 8px;
          }
          .text {
            font-size: 14px;
            line-height: 1.6;
            color: #6b5a44;
            margin: 0 0 20px;
          }
          .otp-box {
            background: #fdf3e3;
            border: 2px dashed #e8b85c;
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-code {
            font-size: 40px;
            font-weight: 800;
            letter-spacing: 10px;
            color: #2a1d0f;
            font-family: 'Courier New', monospace;
            margin: 0;
          }
          .otp-hint {
            font-size: 12px;
            color: #8a7a64;
            margin: 8px 0 0;
          }
          .footer {
            font-size: 11px;
            color: #a0907a;
            text-align: center;
            padding: 16px 24px;
            border-top: 1px solid #e8ddd0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span>Trivilla</span>
            <h1>Smart Restaurant</h1>
          </div>
          <div class="body">
            <p class="greeting">Hello ${name}</p>
            <p class="text">
              This OTP code is to verify your account. It is valid for
              <strong>10 minutes</strong>.
            </p>
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
              <p class="otp-hint">Enter this code to verify your account</p>
            </div>
            <p class="text" style="margin-top: 20px;">
              If you did not request this, please ignore this email.
              Do not share this code with anyone.
            </p>
            <p class="text" style="margin-bottom: 0;">
              — Trivilla family
            </p>
          </div>
          <div class="footer">
            Trivilla Smart Restaurant &bull; Laxmi Road, Pune
          </div>
        </div>
      </body>
    </html>
  `;
}
