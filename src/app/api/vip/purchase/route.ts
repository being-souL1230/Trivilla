import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vipMemberships } from "@/db/schema";
import { ApiError, notify, requireUser, notifyManagers } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
const fail = (e: unknown) => {
  if (e instanceof ApiError) return json({ error: e.message }, e.status);
  console.error(e);
  return json({ error: "Something went wrong" }, 500);
};

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    const body = await req.json().catch(() => ({}));
    const plan = body.plan === "yearly" ? "yearly" : "monthly";
    const amount = plan === "yearly" ? 99999 : 9999;

    // Check if already has active VIP
    const existing = await db
      .select({ id: vipMemberships.id, status: vipMemberships.status })
      .from(vipMemberships)
      .where(eq(vipMemberships.userId, me.id))
      .limit(1);

    if (existing[0]?.status === "active") {
      throw new ApiError(409, "You already have an active VIP membership");
    }

    // Generate VIP ID
    const count = await db
      .select({ n: sql<number>`count(*)` })
      .from(vipMemberships);
    const num = 1 + Number(count[0]?.n ?? 0);
    const vipId = `TRI-VIP-${String(num).padStart(5, "0")}`;

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (plan === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Upsert: delete old then insert
    if (existing[0]) {
      await db.delete(vipMemberships).where(eq(vipMemberships.id, existing[0].id));
    }

    const [row] = await db
      .insert(vipMemberships)
      .values({
        userId: me.id,
        vipId,
        plan,
        amountPaid: amount,
        status: "active",
        startDate,
        endDate,
      })
      .returning();

    await notify(
      me.id,
      "🎉 You're now a VIP member!",
      `Enjoy 35% off on food & 50% off on drinks. Your VIP ID: ${vipId}`,
    );
    await notifyManagers(
      `🎉 New VIP member: ${me.name}`,
      `${vipId} • ${plan} plan • ₹${amount}`,
    );

    return json(row, 201);
  } catch (e) {
    return fail(e);
  }
}
