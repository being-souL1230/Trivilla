import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, otpCodes, users } from "@/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { createSession } from "@/lib/auth";

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export async function POST(req: NextRequest) {
  try {
    const { phone, code, name } = await req.json();
    const cleaned = String(phone ?? "").replace(/\D/g, "");
    const formatted = cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;
    const otpCode = String(code ?? "").trim();

    if (cleaned.length < 10 || !otpCode) {
      return json({ error: "Enter the 6-digit code" }, 400);
    }

    // Find valid OTP
    const rows = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, formatted),
          eq(otpCodes.used, false),
          gt(otpCodes.createdAt, new Date(Date.now() - 10 * 60 * 1000)),
        ),
      )
      .orderBy(desc(otpCodes.id))
      .limit(1);

    const otp = rows[0];
    if (!otp || otp.code !== otpCode) {
      return json({ error: "That code didn't match — check and try again" }, 400);
    }

    // Mark OTP as used
    await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otp.id));

    // Find or create user
    let userId: number;
    const existing = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.phone, cleaned))
      .limit(1);

    if (existing.length) {
      userId = existing[0].id;
    } else {
      const displayName = (name || "").trim() || `User${cleaned.slice(-4)}`;
      const [newUser] = await db
        .insert(users)
        .values({
          name: displayName,
          email: `phone_${cleaned}@trivilla.phone`,
          phone: cleaned,
        })
        .returning();
      userId = newUser.id;

      // Welcome notification for new users
      await db.insert(notifications).values({
        userId,
        title: "Welcome to Trivilla!",
        body: "Your account is ready. Order something tasty!",
      });
    }

    // Create session
    await createSession(userId);

    return json({ ok: true });
  } catch (e) {
    console.error("Verify phone OTP error:", e);
    return json({ error: "Something went wrong" }, 500);
  }
}
