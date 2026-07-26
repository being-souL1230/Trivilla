import { db } from "@/db";
import { inventory, menuItems, orderItems, orders, reservations, staff, tables } from "@/db/schema";
import { daysLeft, todayStr } from "@/lib/utils";

/* Lightweight badge-only stats (fast query — no heavy analytics). */
export async function getBadgeStats() {
  const [all, inv, resRows] = await Promise.all([
    db.select({ id: orders.id, status: orders.status, total: orders.total, createdAt: orders.createdAt, userId: orders.userId }).from(orders),
    db.select({ id: inventory.id, qty: inventory.qty, minQty: inventory.minQty, avgDailyUse: inventory.avgDailyUse }).from(inventory),
    db.select({ id: reservations.id, date: reservations.date, status: reservations.status }).from(reservations),
  ]);
  return {
    active: all.filter((o) => ["placed", "cooking"].includes(o.status)).length,
    lowStock: inv.filter((i) => i.qty <= i.minQty || daysLeft(i) <= 2),
    pendingReservations: resRows.filter((r) => ["requested", "alternate_offered"].includes(r.status)).length,
  };
}

/* Full manager analytics (same as /api/stats). */
export async function getFullStats() {
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
  const todayOrders = valid.filter((o) => new Date(o.createdAt).toDateString() === todayKey);
  const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
  const yKey = new Date(Date.now() - 864e5).toDateString();
  const yOrders = valid.filter((o) => new Date(o.createdAt).toDateString() === yKey);
  const ySales = yOrders.reduce((s, o) => s + o.total, 0);
  const staffOn = staffRows.filter((s) => s.onDuty).length;
  const reservationsToday = resRows.filter((r) => r.date === todayStr() && r.status !== "cancelled").length;
  const perUser = new Map<number, number>();
  for (const o of valid) perUser.set(o.userId, (perUser.get(o.userId) ?? 0) + 1);
  const buyers = [...perUser.values()];
  const repeatPct = buyers.length ? Math.round((buyers.filter((n) => n >= 2).length / buyers.length) * 100) : 0;
  const imgByName = new Map(menuRows.map((m) => [m.name, m.image]));
  const week = [...Array(7)].map((_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - (6 - i));
    const key = dt.toDateString();
    const dayOrders = valid.filter((o) => new Date(o.createdAt).toDateString() === key);
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
  const topItems = [...agg.values()].sort((a, b) => b.qty - a.qty).slice(0, 5).map((t) => ({ ...t, image: imgByName.get(t.name) ?? "" }));
  const lowStock = inv.filter((i) => i.qty <= i.minQty || daysLeft(i) <= 2);
  return {
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
    pendingReservations: resRows.filter((r) => ["requested", "alternate_offered"].includes(r.status)).length,
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
  };
}
