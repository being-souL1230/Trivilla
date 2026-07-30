import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, vipMemberships } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { eq, gte } from "drizzle-orm";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function GET(_req: NextRequest) {
  try {
    await requireManager();
    const rows = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        vipId: vipMemberships.vipId,
        plan: vipMemberships.plan,
        amountPaid: vipMemberships.amountPaid,
        status: vipMemberships.status,
        startDate: vipMemberships.startDate,
        endDate: vipMemberships.endDate,
      })
      .from(vipMemberships)
      .innerJoin(users, eq(users.id, vipMemberships.userId))
      .where(eq(vipMemberships.status, "active"));

    return json(rows.map((r) => ({
      ...r,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      daysLeft: Math.max(0, Math.ceil((r.endDate.getTime() - Date.now()) / 86400000)),
    })));
  } catch {
    return json([]);
  }
}
