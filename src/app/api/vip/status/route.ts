import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vipMemberships } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { eq, and, gte } from "drizzle-orm";
import { getVipDiscount, type VipMembershipInfo } from "@/lib/vip";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function GET(_req: NextRequest) {
  try {
    const me = await getSessionUser();
    if (!me) return json({ vip: false, membership: null, discount: null });

    const row = await db
      .select()
      .from(vipMemberships)
      .where(
        and(
          eq(vipMemberships.userId, me.id),
          eq(vipMemberships.status, "active"),
          gte(vipMemberships.endDate, new Date()),
        ),
      )
      .limit(1);

    const membership = row[0] ?? null;
    if (!membership) return json({ vip: false, membership: null, discount: null });

    const daysLeft = Math.max(0, Math.ceil(
      (membership.endDate.getTime() - Date.now()) / 86400000,
    ));

    const info: VipMembershipInfo = {
      id: membership.id,
      vipId: membership.vipId,
      plan: membership.plan as "monthly" | "yearly",
      amountPaid: membership.amountPaid,
      status: membership.status as "active" | "expired" | "cancelled",
      startDate: membership.startDate.toISOString(),
      endDate: membership.endDate.toISOString(),
      daysLeft,
      discount: getVipDiscount(),
    };

    return json({ vip: true, membership: info, discount: info.discount });
  } catch {
    return json({ vip: false, membership: null, discount: null });
  }
}
