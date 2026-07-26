import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { inventory, menuItems, orderItems, orders, reservations, staff, tables } from "@/db/schema";
import { requireManager, ApiError } from "@/lib/auth";
import { daysLeft, todayStr } from "@/lib/utils";

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    /* Public "live kitchen" pulse — shown to every customer. */
    if (url.searchParams.get("public") === "1") {
      const [cooking, placed, avail, total] = await Promise.all([
        db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, "cooking")),
        db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, "placed")),
        db.select({ n: sql<number>`count(*)::int` }).from(menuItems).where(eq(menuItems.available, true)),
        db.select({ n: sql<number>`count(*)::int` }).from(menuItems),
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
    const [all, items, inv, tbls, staffRows, resRows, menuRows] = await Promise.all([
      db.select().from(orders),
      db.select().from(orderItems),
      db.select().from(inventory),
      db.select().from(tables),
      db.select().from(staff),
      db.select().from(reservations),
      db.select().from(menuItems),
    ]);
    const valid = all.filter((o) => o.status !== "cancelled");
    const todayKey = new Date().toDateString();
    const todayOrders = valid.filter(
      (o) => new Date(o.createdAt).toDateString() === todayKey,
    );
    const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
    const yKey = new Date(Date.now() - 864e5).toDateString();
    const yOrders = valid.filter(
      (o) => new Date(o.createdAt).toDateString() === yKey,
    );
    const ySales = yOrders.reduce((s, o) => s + o.total, 0);
    const staffOn = staffRows.filter((s) => s.onDuty).length;
    const reservationsToday = resRows.filter(
      (r) => r.date === todayStr() && r.status !== "cancelled",
    ).length;
    const perUser = new Map<number, number>();
    for (const o of valid) perUser.set(o.userId, (perUser.get(o.userId) ?? 0) + 1);
    const buyers = [...perUser.values()];
    const repeatPct = buyers.length
      ? Math.round((buyers.filter((n) => n >= 2).length / buyers.length) * 100)
      : 0;
    const imgByName = new Map(menuRows.map((m) => [m.name, m.image]));

    const week = [...Array(7)].map((_, i) => {
      const dt = new Date();
      dt.setDate(dt.getDate() - (6 - i));
      const key = dt.toDateString();
      const dayOrders = valid.filter(
        (o) => new Date(o.createdAt).toDateString() === key,
      );
      return {
        label: dt.toLocaleDateString("en-IN", { weekday: "short" }),
        date: dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        sales: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
      };
    });

    const hours = [12, 13, 14, 19, 20, 21].map((h) => ({
      label: h > 12 ? `${h - 12} PM` : `${h} PM`,
      count: valid.filter((o) => new Date(o.createdAt).getHours() === h).length,
    }));

    const validIds = new Set(valid.map((o) => o.id));
    const agg = new Map<number, { name: string; qty: number; sales: number }>();
    for (const it of items) {
      if (!validIds.has(it.orderId)) continue;
      const a = agg.get(it.menuItemId) ?? { name: it.name, qty: 0, sales: 0 };
      a.qty += it.qty;
      a.sales += it.qty * it.price;
      agg.set(it.menuItemId, a);
    }
    const topItems = [...agg.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map((t) => ({ ...t, image: imgByName.get(t.name) ?? "" }));

    const lowStock = inv.filter((i) => i.qty <= i.minQty || daysLeft(i) <= 2);

    return json({
      todaySales,
      todayOrders: todayOrders.length,
      ySales,
      yOrders: yOrders.length,
      avgOrder: todayOrders.length ? Math.round(todaySales / todayOrders.length) : 0,
      yAvgOrder: yOrders.length ? Math.round(ySales / yOrders.length) : 0,
      staffOn,
      staffTotal: staffRows.length,
      reservationsToday,
      repeatPct,
      active: all.filter((o) => ["placed", "cooking"].includes(o.status)).length,
      statusCounts: {
        placed: all.filter((o) => o.status === "placed").length,
        cooking: all.filter((o) => o.status === "cooking").length,
        ready: all.filter((o) => o.status === "ready").length,
        served: all.filter((o) => o.status === "served").length,
        cancelled: all.filter((o) => o.status === "cancelled").length,
      },
      week,
      hours,
      topItems,
      lowStock,
      tables: {
        total: tbls.length,
        occupied: tbls.filter((t) => t.status === "occupied").length,
        free: tbls.filter((t) => t.status === "free").length,
      },
    });
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Something went wrong on our side" }, 500);
  }
}
