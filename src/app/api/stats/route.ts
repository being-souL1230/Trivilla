import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { menuItems, orders } from "@/db/schema";
import { requireManager, ApiError } from "@/lib/auth";
import { getBadgeStats, getFullStats } from "@/lib/stats";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    /* Public "live kitchen" pulse. */
    if (url.searchParams.get("public") === "1") {
      const [cooking, placed, avail, total] = await Promise.all([
        db.select({ n: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "cooking")),
        db.select({ n: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "placed")),
        db.select({ n: sql<number>`count(*)` }).from(menuItems).where(eq(menuItems.available, true)),
        db.select({ n: sql<number>`count(*)` }).from(menuItems),
      ]);
      const c = Number(cooking[0]?.n ?? 0);
      const p = Number(placed[0]?.n ?? 0);
      return json({
        cooking: c,
        placed: p,
        availableDishes: Number(avail[0]?.n ?? 0),
        totalDishes: Number(total[0]?.n ?? 0),
        estWait: Math.min(40, 8 + c * 4 + p * 2),
      });
    }

    /* Full manager analytics. */
    await requireManager();
    return json(await getFullStats());
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Something went wrong on our side" }, 500);
  }
}
