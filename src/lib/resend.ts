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
            <p class="greeting">Namaste ${name}</p>
            <p class="text">
              Aapka account verify karne ke liye ye OTP code hai. Yeh code
              <strong>10 minutes</strong> ke liye valid hai.
            </p>
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
              <p class="otp-hint">Enter this code to verify your account</p>
            </div>
            <p class="text" style="margin-top: 20px;">
              Agar aapne ye request nahi kiya, to is email ko ignore karein.
              Kisi ke saath bhi ye code share na karein.
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
