import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendSms } from "@/lib/textbee";

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const cleaned = String(phone ?? "").replace(/\D/g, "");

    if (cleaned.length < 10) {
      return json({ error: "Enter a valid 10-digit phone number" }, 400);
    }

    const formatted = cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;

    // Rate-limit: don't allow sending more than one OTP per 60 seconds
    const recent = await db
      .select({ id: otpCodes.id })
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, formatted),
          eq(otpCodes.used, false),
          gt(otpCodes.createdAt, new Date(Date.now() - 60 * 1000)),
        ),
      )
      .limit(1);

    if (recent.length) {
      return json({ error: "Please wait 60 seconds before requesting a new OTP" }, 429);
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Delete old unused OTPs for this phone
    await db.delete(otpCodes).where(eq(otpCodes.email, formatted));

    // Store OTP in DB
    await db.insert(otpCodes).values({
      email: formatted,
      code,
      meta: JSON.stringify({ phone: formatted }),
    });

    // Send SMS via TextBee
    const sent = await sendSms(cleaned, `Your Trivilla OTP is ${code}. It is valid for 10 minutes.`);

    if (!sent) {
      await db.delete(otpCodes).where(eq(otpCodes.email, formatted));
      return json({ error: "Failed to send OTP. Please try again." }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("Send phone OTP error:", e);
    return json({ error: "Something went wrong" }, 500);
  }
}
