import { NextRequest, NextResponse } from "next/server";
import { and, eq, desc, inArray, sql, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  inventory,
  menuItems,
  notifications,
  orderItems,
  orders,
  reservations,
  staff,
  tables,
  users,
} from "@/db/schema";
import {
  ApiError,
  createSession,
  getSessionUser,
  notify,
  notifyManagers,
  requireManager,
  requireUser,
} from "@/lib/auth";
import { DINNER_SLOTS, LUNCH_SLOTS, todayStr } from "@/lib/utils";

type Ctx = { params: Promise<{ resource: string }> };

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

const fail = (e: unknown) => {
  if (e instanceof ApiError) return json({ error: e.message }, e.status);
  console.error(e);
  return json({ error: "Something went wrong on our side" }, 500);
};

const num = (v: unknown, dflt = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
};

/* ============================== LIST ============================== */

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { resource } = await ctx.params;
  try {
    const me = await getSessionUser();
    switch (resource) {
      case "menu": {
        return json(await db.select().from(menuItems).orderBy(asc(menuItems.id)));
      }
      case "tables": {
        return json(await db.select().from(tables).orderBy(asc(tables.tableNo)));
      }
      case "orders": {
        if (!me) throw new ApiError(401, "Please sign in first");
        const rows =
          me.role === "manager" || me.role === "chef"
            ? await db.select().from(orders).orderBy(desc(orders.id))
            : await db
                .select()
                .from(orders)
                .where(eq(orders.userId, me.id))
                .orderBy(desc(orders.id));
        const items = rows.length
          ? await db
              .select()
              .from(orderItems)
              .where(inArray(orderItems.orderId, rows.map((r) => r.id)))
          : [];
        const tmap = new Map(
          (await db.select().from(tables)).map((t) => [t.id, t.tableNo]),
        );
        const byOrder = new Map<number, typeof items>();
        for (const it of items) {
          const arr = byOrder.get(it.orderId) ?? [];
          arr.push(it);
          byOrder.set(it.orderId, arr);
        }
        return json(
          rows.map((r) => ({
            ...r,
            tableNo: r.tableId ? (tmap.get(r.tableId) ?? null) : null,
            items: byOrder.get(r.id) ?? [],
          })),
        );
      }
      case "reservations": {
        if (!me) throw new ApiError(401, "Please sign in first");
        const rows =
          me.role === "manager"
            ? await db.select().from(reservations).orderBy(desc(reservations.id))
            : await db
                .select()
                .from(reservations)
                .where(eq(reservations.userId, me.id))
                .orderBy(desc(reservations.id));
        const tmap = new Map(
          (await db.select().from(tables)).map((t) => [t.id, t.tableNo]),
        );
        return json(
          rows.map((r) => ({
            ...r,
            tableNo: r.tableId ? (tmap.get(r.tableId) ?? null) : null,
          })),
        );
      }
      case "inventory": {
        await requireManager();
        return json(await db.select().from(inventory).orderBy(asc(inventory.id)));
      }
      case "staff": {
        await requireManager();
        return json(await db.select().from(staff).orderBy(asc(staff.id)));
      }
      case "customers": {
        await requireManager();
        const all = await db.select().from(users);
        const ords = await db.select().from(orders);
        return json(
          all
            .filter((u) => u.role === "customer")
            .map((u) => {
              const mine = ords.filter(
                (o) => o.userId === u.id && o.status !== "cancelled",
              );
              return {
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                vegOnly: u.vegOnly,
                isGoogle: u.isGoogle,
                createdAt: u.createdAt,
                orders: mine.length,
                spent: mine.reduce((s, o) => s + o.total, 0),
              };
            }),
        );
      }
      case "bills": {
        if (!me) throw new ApiError(401, "Please sign in first");
        const rows =
          me.role === "manager"
            ? await db.select().from(orders).where(eq(orders.status, "served")).orderBy(desc(orders.id))
            : await db.select().from(orders).where(and(eq(orders.userId, me.id), eq(orders.status, "served"))).orderBy(desc(orders.id));
        const items = rows.length
          ? await db
              .select()
              .from(orderItems)
              .where(inArray(orderItems.orderId, rows.map((r) => r.id)))
          : [];
        const tmap = new Map(
          (await db.select().from(tables)).map((t) => [t.id, t.tableNo]),
        );
        const byOrder = new Map<number, typeof items>();
        for (const it of items) {
          const arr = byOrder.get(it.orderId) ?? [];
          arr.push(it);
          byOrder.set(it.orderId, arr);
        }
        return json(
          rows.map((r) => ({
            ...r,
            tableNo: r.tableId ? (tmap.get(r.tableId) ?? null) : null,
            items: byOrder.get(r.id) ?? [],
          })),
        );
      }
      case "notifications": {
        if (!me) return json([]);
        return json(
          await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, me.id))
            .orderBy(desc(notifications.id))
            .limit(30),
        );
      }
      default:
        return json({ error: "Not found" }, 404);
    }
  } catch (e) {
    return fail(e);
  }
}

/* ============================== CREATE ============================== */

export async function POST(req: NextRequest, ctx: Ctx) {
  const { resource } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    switch (resource) {
      case "menu": {
        await requireManager();
        const name = String(body.name ?? "").trim();
        const price = num(body.price);
        if (!name) throw new ApiError(400, "Dish name is required");
        if (price <= 0) throw new ApiError(400, "Price must be more than ₹0");
        const [row] = await db
          .insert(menuItems)
          .values({
            name,
            description: String(body.description ?? ""),
            category: String(body.category ?? "Main Course"),
            price: Math.round(price),
            veg: !!body.veg,
            available: body.available !== false,
            popular: !!body.popular,
            spice: Math.min(3, Math.max(0, num(body.spice, 1))),
            prepTime: Math.max(1, num(body.prepTime, 15)),
            image: String(body.image ?? ""),
          })
          .returning();
        return json(row, 201);
      }
      case "tables": {
        await requireManager();
        const tableNo = num(body.tableNo);
        if (tableNo <= 0) throw new ApiError(400, "Table number is required");
        const dup = await db
          .select({ id: tables.id })
          .from(tables)
          .where(eq(tables.tableNo, tableNo))
          .limit(1);
        if (dup.length)
          throw new ApiError(409, `Table ${tableNo} already exists`);
        const [row] = await db
          .insert(tables)
          .values({
            tableNo,
            seats: Math.max(1, num(body.seats, 4)),
            zone: String(body.zone ?? "Main Hall"),
            status: String(body.status ?? "free"),
          })
          .returning();
        return json(row, 201);
      }
      case "inventory": {
        await requireManager();
        const name = String(body.name ?? "").trim();
        if (!name) throw new ApiError(400, "Item name is required");
        const [row] = await db
          .insert(inventory)
          .values({
            name,
            category: String(body.category ?? "Grocery"),
            unit: String(body.unit ?? "kg"),
            qty: Math.max(0, num(body.qty)),
            minQty: Math.max(0, num(body.minQty, 5)),
            avgDailyUse: Math.max(0, num(body.avgDailyUse, 1)),
            costPerUnit: Math.max(0, num(body.costPerUnit)),
            supplier: String(body.supplier ?? ""),
          })
          .returning();
        return json(row, 201);
      }
      case "staff": {
        await requireManager();
        const name = String(body.name ?? "").trim();
        if (!name) throw new ApiError(400, "Staff name is required");
        const [row] = await db
          .insert(staff)
          .values({
            name,
            duty: String(body.duty ?? "Waiter"),
            phone: String(body.phone ?? ""),
            shift: String(body.shift ?? "Full Day"),
            onDuty: body.onDuty !== false,
            joinedOn: String(body.joinedOn ?? todayStr()),
          })
          .returning();
        return json(row, 201);
      }

      /* ---- customer places an order (guests welcome — no sign-in needed) ---- */
      case "orders": {
        const me = await getSessionUser();
        let userId: number;
        let customerName: string;
        let customerPhone: string;
        if (me) {
          userId = me.id;
          customerName = me.name;
          customerPhone = me.phone;
        } else {
          const name = String(body.name ?? "").trim();
          const phone = String(body.phone ?? "").replace(/[^\d+ ]/g, "").trim();
          if (name.length < 2) throw new ApiError(400, "Please tell us your name");
          if (phone.replace(/\D/g, "").length < 10)
            throw new ApiError(400, "Enter a valid 10-digit phone number");
          customerName = name;
          customerPhone = phone;
          const gemail = `guest.${phone.replace(/\D/g, "")}@trivilla.guest`;
          const existing = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, gemail))
            .limit(1);
          if (existing[0]) {
            userId = existing[0].id;
          } else {
            const [g] = await db
              .insert(users)
              .values({ name, email: gemail, phone, role: "customer" })
              .returning();
            userId = g.id;
          }
          // silent guest session so they can track this order right away
          await createSession(userId);
        }
        const rawItems = Array.isArray(body.items) ? body.items : [];
        if (!rawItems.length)
          throw new ApiError(400, "Your tray is empty — add a dish first");
        const qmap = new Map<number, number>(
          rawItems.map((i: { menuItemId?: unknown; qty?: unknown }) => [
            num(i.menuItemId, -1),
            Math.min(10, Math.max(1, num(i.qty, 1))),
          ]),
        );
        const ids = [...qmap.keys()].filter((i) => i > 0);
        if (!ids.length) throw new ApiError(400, "No valid dishes in tray");
        const dishes = await db
          .select()
          .from(menuItems)
          .where(inArray(menuItems.id, ids));
        if (dishes.length !== ids.length)
          throw new ApiError(400, "Some dishes were not found in the menu");
        const soldOut = dishes.filter((d) => !d.available);
        if (soldOut.length)
          throw new ApiError(
            409,
            `${soldOut.map((d) => d.name).join(", ")} just sold out — remove it from your tray`,
          );
        const type = body.type === "takeaway" ? "takeaway" : "dine-in";
        let tableId: number | null = null;
        let tableNo: number | null = null;
        if (type === "dine-in" && body.tableId) {
          const t = await db
            .select()
            .from(tables)
            .where(eq(tables.id, num(body.tableId, -1)))
            .limit(1);
          tableId = t[0]?.id ?? null;
          tableNo = t[0]?.tableNo ?? null;
        }
        const subtotal = dishes.reduce(
          (s, d) => s + d.price * (qmap.get(d.id) ?? 1),
          0,
        );
        const tax = Math.round(subtotal * 0.05);
        const cnt = await db
          .select({ n: sql<number>`count(*)` })
          .from(orders);
        const code = `RS-${1001 + Number(cnt[0]?.n ?? 0)}`;
        const order = await db.transaction(async (tx) => {
          const [o] = await tx
            .insert(orders)
            .values({
              code,
              userId,
              customerName,
              type,
              tableId,
              paymentMode: ["upi", "card", "cash"].includes(body.paymentMode)
                ? body.paymentMode
                : "upi",
              note: String(body.note ?? "").slice(0, 300),
              subtotal,
              tax,
              total: subtotal + tax,
              status: "placed",
            })
            .returning();
          await tx.insert(orderItems).values(
            dishes.map((d) => ({
              orderId: o.id,
              menuItemId: d.id,
              name: d.name,
              price: d.price,
              qty: qmap.get(d.id) ?? 1,
            })),
          );
          return o;
        });
        await notify(
          userId,
          `Order ${code} received`,
          "It's with the kitchen — we'll ping you at every step.",
        );
        await notifyManagers(
          `New order ${code} — ${type === "dine-in" && tableNo ? `Table ${tableNo}` : "Takeaway"}`,
          `${customerName} • ₹${order.total} • ${dishes.length} dish(es)${me ? "" : " • guest order"}`,
        );
        return json({ ...order, items: [] }, 201);
      }

      /* ---- customer books a table (guests allowed — no sign-in needed) ---- */
      case "reservations": {
        const me = await getSessionUser();
        const date = String(body.date ?? "");
        const slot = String(body.slot ?? "");
        const guests = num(body.guests, 2);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
          throw new ApiError(400, "Please pick a date");
        if (date < todayStr())
          throw new ApiError(400, "That date has already passed — pick today or later");
        if (![...LUNCH_SLOTS, ...DINNER_SLOTS].includes(slot))
          throw new ApiError(400, "Please pick a time slot");
        if (guests < 1 || guests > 12)
          throw new ApiError(400, "Guests should be between 1 and 12");
        const allTables = await db.select().from(tables);
        const suitable = allTables.filter((t) => t.seats >= guests);
        if (!suitable.length)
          throw new ApiError(
            400,
            `No table fits ${guests} guests — try fewer guests or call us for a big group`,
          );
        const booked = await db
          .select({ id: reservations.id })
          .from(reservations)
          .where(
            and(
              eq(reservations.date, date),
              eq(reservations.slot, slot),
              inArray(reservations.status, ["requested", "confirmed", "seated"]),
            ),
          );
        if (booked.length >= suitable.length)
          throw new ApiError(409, "That slot is full — please try another time");
        let userId: number;
        let customerName: string;
        let phone: string;
        if (me) {
          userId = me.id;
          customerName = me.name;
          phone = String(body.phone ?? me.phone ?? "");
        } else {
          const name = String(body.name ?? "").trim();
          phone = String(body.phone ?? "").replace(/[^\d+ ]/g, "").trim();
          if (name.length < 2) throw new ApiError(400, "Please tell us your name");
          if (phone.replace(/\D/g, "").length < 10)
            throw new ApiError(400, "Enter a valid 10-digit phone number");
          customerName = name;
          // find-or-create a lightweight guest account so the booking is trackable
          const gemail = `guest.${phone.replace(/\D/g, "")}@trivilla.guest`;
          const existing = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, gemail))
            .limit(1);
          if (existing[0]) {
            userId = existing[0].id;
          } else {
            const [g] = await db
              .insert(users)
              .values({ name, email: gemail, phone, role: "customer" })
              .returning();
            userId = g.id;
          }
        }
        // Customer's preferred table (optional)
        const preferredTableId = num(body.tableId, 0);
        const requestedTableId =
          preferredTableId > 0 && allTables.some((t) => t.id === preferredTableId && t.seats >= guests)
            ? preferredTableId
            : null;
        const [row] = await db
          .insert(reservations)
          .values({
            userId,
            customerName,
            phone,
            date,
            slot,
            guests,
            tableId: requestedTableId,
            requestedTableId,
            note: String(body.note ?? "").slice(0, 300),
            status: "requested",
          })
          .returning();
        await notify(
          userId,
          "Booking request sent",
          `We'll confirm your table for ${slot} on ${date} shortly.`,
        );
        const prefTno = requestedTableId
          ? allTables.find((t) => t.id === requestedTableId)?.tableNo
          : null;
        await notifyManagers(
          "New booking request",
          `${customerName} • ${guests} guest(s) • ${date}, ${slot}${prefTno ? ` • wants Table ${prefTno}` : ""}${me ? "" : " • walk-in booking"}`,
        );
        return json(row, 201);
      }

      default:
        return json({ error: "Not found" }, 404);
    }
  } catch (e) {
    return fail(e);
  }
}
