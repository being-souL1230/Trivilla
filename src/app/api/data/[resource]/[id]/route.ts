import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  inventory,
  menuItems,
  notifications,
  orders,
  reservations,
  staff,
  tables,
} from "@/db/schema";
import { ApiError, notify, notifyManagers, requireManager, requireUser } from "@/lib/auth";

type Ctx = { params: Promise<{ resource: string; id: string }> };

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

const fail = (e: unknown) => {
  if (e instanceof ApiError) return json({ error: e.message }, e.status);
  console.error(e);
  return json({ error: "Something went wrong on our side" }, 500);
};

/* ============================== UPDATE ============================== */

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    switch (resource) {
      case "menu": {
        await requireManager();
        const set: Record<string, unknown> = {};
        if (body.name !== undefined) set.name = String(body.name).trim() || undefined;
        if (body.description !== undefined) set.description = String(body.description);
        if (body.category !== undefined) set.category = String(body.category);
        if (body.price !== undefined) {
          const p = Math.round(Number(body.price));
          if (!Number.isFinite(p) || p <= 0)
            throw new ApiError(400, "Price must be more than ₹0");
          set.price = p;
        }
        for (const k of ["veg", "available", "popular"] as const)
          if (body[k] !== undefined) set[k] = !!body[k];
        if (body.spice !== undefined)
          set.spice = Math.min(3, Math.max(0, Number(body.spice) || 0));
        if (body.prepTime !== undefined)
          set.prepTime = Math.max(1, Number(body.prepTime) || 10);
        if (body.image !== undefined) set.image = String(body.image);
        if (!Object.keys(set).length) throw new ApiError(400, "Nothing to update");
        const [row] = await db
          .update(menuItems)
          .set(set)
          .where(eq(menuItems.id, Number(id)))
          .returning();
        if (!row) throw new ApiError(404, "Dish not found");
        return json(row);
      }

      case "tables": {
        await requireManager();
        const set: Record<string, unknown> = {};
        if (body.tableNo !== undefined) set.tableNo = Number(body.tableNo);
        if (body.seats !== undefined) set.seats = Math.max(1, Number(body.seats) || 2);
        if (body.zone !== undefined) set.zone = String(body.zone);
        if (body.status !== undefined) {
          if (!["free", "occupied", "reserved", "cleaning"].includes(body.status))
            throw new ApiError(400, "Invalid table status");
          set.status = String(body.status);
        }
        const [row] = await db
          .update(tables)
          .set(set)
          .where(eq(tables.id, Number(id)))
          .returning();
        if (!row) throw new ApiError(404, "Table not found");
        return json(row);
      }

      case "inventory": {
        await requireManager();
        const set: Record<string, unknown> = {};
        if (body.restock) {
          const cur = await db
            .select()
            .from(inventory)
            .where(eq(inventory.id, Number(id)))
            .limit(1);
          if (!cur[0]) throw new ApiError(404, "Item not found");
          const target = Math.max(cur[0].minQty * 4, cur[0].qty);
          set.qty = target;
          set.lastRestocked = new Date();
        } else {
          for (const k of ["name", "category", "unit", "supplier"] as const)
            if (body[k] !== undefined) set[k] = String(body[k]);
          for (const k of ["qty", "minQty", "avgDailyUse", "costPerUnit"] as const)
            if (body[k] !== undefined) set[k] = Math.max(0, Number(body[k]) || 0);
        }
        const [row] = await db
          .update(inventory)
          .set(set)
          .where(eq(inventory.id, Number(id)))
          .returning();
        if (!row) throw new ApiError(404, "Item not found");
        return json(row);
      }

      case "staff": {
        await requireManager();
        const set: Record<string, unknown> = {};
        for (const k of ["name", "duty", "phone", "shift", "joinedOn"] as const)
          if (body[k] !== undefined) set[k] = String(body[k]);
        if (body.onDuty !== undefined) set.onDuty = !!body.onDuty;
        const [row] = await db
          .update(staff)
          .set(set)
          .where(eq(staff.id, Number(id)))
          .returning();
        if (!row) throw new ApiError(404, "Staff member not found");
        return json(row);
      }

      /* ---- order status flow (manager) / cancel (customer) ---- */
      case "orders": {
        const me = await requireUser();
        const oid = Number(id);
        const rows = await db.select().from(orders).where(eq(orders.id, oid)).limit(1);
        const order = rows[0];
        if (!order) throw new ApiError(404, "Order not found");
        const next = String(body.status ?? "");
        if (me.role === "manager") {
          if (!["placed", "cooking", "ready", "served", "cancelled"].includes(next))
            throw new ApiError(400, "Invalid status");
          await db
            .update(orders)
            .set({ status: next, updatedAt: new Date() })
            .where(eq(orders.id, oid));
          const msgs: Record<string, [string, string]> = {
            cooking: [
              `Chef has started on ${order.code}`,
              "Your food is being cooked fresh right now.",
            ],
            ready:
              order.type === "takeaway"
                ? [`${order.code} is ready`, "It's hot — pick it up at the counter!"]
                : [`${order.code} is on its way`, "Sit back — your food is coming to the table."],
            served: [`${order.code} served — bill generated`, "Your bill is ready! View it in My Orders. Total: ₹" + order.total],
            cancelled: [
              `${order.code} was cancelled`,
              "The restaurant cancelled this order. Any payment will be refunded in 3–5 days.",
            ],
          };
          if (msgs[next]) await notify(order.userId, msgs[next][0], msgs[next][1]);
          if (next === "served" && order.tableId) {
            await db
              .update(tables)
              .set({ status: "cleaning" })
              .where(and(eq(tables.id, order.tableId), eq(tables.status, "occupied")));
          }
          return json({ ok: true, status: next });
        }
        // customer
        if (order.userId !== me.id) throw new ApiError(403, "This is not your order");
        if (next !== "cancelled") throw new ApiError(400, "You can only cancel an order");
        if (order.status !== "placed")
          throw new ApiError(409, "The kitchen already started — please call the counter to cancel");
        await db
          .update(orders)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(orders.id, oid));
        await notifyManagers(`Order ${order.code} cancelled by customer`, order.customerName);
        return json({ ok: true, status: "cancelled" });
      }

      /* ---- reservation flow ---- */
      case "reservations": {
        const me = await requireUser();
        const rid = Number(id);
        const rows = await db
          .select()
          .from(reservations)
          .where(eq(reservations.id, rid))
          .limit(1);
        const res = rows[0];
        if (!res) throw new ApiError(404, "Booking not found");
        const next = String(body.status ?? "");

        if (me.role === "manager") {
          // === LOCKED STATES: tableId/status can't be changed for these ===
          if (["confirmed", "seated", "completed", "cancelled"].includes(res.status) && next !== "cancelled" && next !== "seated" && next !== "completed") {
            // Allow progression: confirmed→seated→completed, or any→cancelled
            // But don't allow changing tableId or switching back
            if (body.tableId !== undefined && Number(body.tableId) !== res.tableId)
              throw new ApiError(400, "Table is already locked — can't change after confirmation");
          }
          // Lock: if confirmed+, don't allow status to go backwards
          if (res.status === "confirmed" && next !== "seated" && next !== "cancelled" && next !== "completed")
            throw new ApiError(400, "Booking is already confirmed — can't go back");
          if (res.status === "seated" && next !== "completed" && next !== "cancelled")
            throw new ApiError(400, "Guests are already seated");

          const set: Record<string, unknown> = {};
          const newTableId = body.tableId !== undefined ? (body.tableId ? Number(body.tableId) : null) : undefined;

          // === MANAGER: confirm with requested table (directly) ===
          if (next === "confirmed" && res.status === "requested") {
            const assignTableId = newTableId ?? res.tableId;
            if (!assignTableId)
              throw new ApiError(400, "Select a table before confirming");
            // Check if table is available
            const t = await db.select().from(tables).where(eq(tables.id, assignTableId)).limit(1);
            if (!t[0]) throw new ApiError(404, "Table not found");
            if (t[0].status !== "free")
              throw new ApiError(409, `Table ${t[0].tableNo} is currently ${t[0].status}`);

            // If assigned table differs from requested → offer as alternate instead
            if (res.requestedTableId && assignTableId !== res.requestedTableId) {
              set.status = "alternate_offered";
              set.tableId = assignTableId;
              const [updated] = await db
                .update(reservations)
                .set(set)
                .where(eq(reservations.id, rid))
                .returning();
              await notify(
                res.userId,
                `Alternate table offered`,
                `We suggest Table ${t[0].tableNo} instead. Please accept or decline in your bookings.`,
              );
              return json(updated);
            }

            // Same table (or no preference) → confirm directly
            set.status = "confirmed";
            set.tableId = assignTableId;
            const [updated] = await db
              .update(reservations)
              .set(set)
              .where(eq(reservations.id, rid))
              .returning();
            await db
              .update(tables)
              .set({ status: "reserved" })
              .where(and(eq(tables.id, assignTableId), eq(tables.status, "free")));
            await notify(
              res.userId,
              `Table booked: ${res.slot}, ${res.date}`,
              `Table ${t[0].tableNo} will be waiting for you. Please arrive 10 minutes early.`,
            );
            return json(updated);
          }

          // === MANAGER: progress confirmed → seated → completed ===
          if (next === "seated" && res.status === "confirmed") {
            const tableId = res.tableId;
            set.status = "seated";
            const [updated] = await db
              .update(reservations)
              .set(set)
              .where(eq(reservations.id, rid))
              .returning();
            if (tableId) {
              await db
                .update(tables)
                .set({ status: "occupied" })
                .where(eq(tables.id, tableId));
            }
            await notify(res.userId, "You're seated — enjoy!", "Tell us if you need anything at all.");
            return json(updated);
          }

          if (next === "completed" && res.status === "seated") {
            set.status = "completed";
            const [updated] = await db
              .update(reservations)
              .set(set)
              .where(eq(reservations.id, rid))
              .returning();
            if (res.tableId)
              await db.update(tables).set({ status: "free" }).where(eq(tables.id, res.tableId));
            return json(updated);
          }

          // === MANAGER: cancel any status ===
          if (next === "cancelled") {
            const [updated] = await db
              .update(reservations)
              .set({ status: "cancelled" })
              .where(eq(reservations.id, rid))
              .returning();
            if (res.tableId) {
              const t = await db.select().from(tables).where(eq(tables.id, res.tableId)).limit(1);
              if (t[0] && t[0].status !== "free")
                await db.update(tables).set({ status: "free" }).where(eq(tables.id, res.tableId));
            }
            await notify(
              res.userId,
              `Booking for ${res.slot}, ${res.date} cancelled`,
              "This slot couldn't be held. Please try another time — sorry for the trouble!",
            );
            return json(updated);
          }

          // === MANAGER: update tableId only while not locked (requested or alternate_offered) ===
          if (["requested", "alternate_offered"].includes(res.status) && newTableId !== undefined && !next) {
            const [updated] = await db
              .update(reservations)
              .set({ tableId: newTableId })
              .where(eq(reservations.id, rid))
              .returning();
            return json(updated);
          }

          throw new ApiError(400, "Invalid status transition");
        }

        // === CUSTOMER: accept or decline alternate table offer ===
        if (res.userId !== me.id) throw new ApiError(403, "This is not your booking");

        if (res.status === "alternate_offered" && next === "confirmed") {
          // Customer accepts alternate table
          const [updated] = await db
            .update(reservations)
            .set({ status: "confirmed" })
            .where(eq(reservations.id, rid))
            .returning();
          if (updated.tableId) {
            await db
              .update(tables)
              .set({ status: "reserved" })
              .where(and(eq(tables.id, updated.tableId), eq(tables.status, "free")));
            const t = await db.select({ tableNo: tables.tableNo }).from(tables).where(eq(tables.id, updated.tableId)).limit(1);
            await notify(res.userId, "Alternate accepted", `Table ${t[0]?.tableNo} is now reserved for you.`);
            await notifyManagers(
              `Alternate accepted by ${me.name}`,
              `Table ${t[0]?.tableNo} confirmed for ${res.date}, ${res.slot}`,
            );
          }
          return json(updated);
        }

        if (res.status === "alternate_offered" && next === "requested") {
          // Customer declines → go back to requested with original preference
          const [updated] = await db
            .update(reservations)
            .set({
              status: "requested",
              tableId: res.requestedTableId ?? null,
            })
            .where(eq(reservations.id, rid))
            .returning();
          await notify(res.userId, "Alternate declined — reverting", "We'll let the restaurant know. They may suggest another option.");
          await notifyManagers(
            `Alternate declined by ${me.name}`,
            `${res.date}, ${res.slot} • guest prefers their original choice`,
          );
          return json(updated);
        }

        // customer: can only cancel their own upcoming booking
        if (next !== "cancelled") throw new ApiError(400, "You can only cancel a booking");
        if (!["requested", "confirmed", "alternate_offered"].includes(res.status))
          throw new ApiError(409, "This booking can't be cancelled anymore");
        await db
          .update(reservations)
          .set({ status: "cancelled" })
          .where(eq(reservations.id, rid));
        if (res.tableId) {
          const t = await db.select().from(tables).where(eq(tables.id, res.tableId)).limit(1);
          if (t[0] && t[0].status !== "free")
            await db.update(tables).set({ status: "free" }).where(eq(tables.id, res.tableId));
        }
        await notifyManagers(`Booking cancelled by ${me.name}`, `${res.date}, ${res.slot} • ${res.guests} guests`);
        return json({ ok: true });
      }

      /* ---- notifications: mark one (or all) as read ---- */
      case "notifications": {
        const me = await requireUser();
        if (id === "all") {
          await db
            .update(notifications)
            .set({ read: true })
            .where(and(eq(notifications.userId, me.id), eq(notifications.read, false)));
          return json({ ok: true });
        }
        await db
          .update(notifications)
          .set({ read: true })
          .where(and(eq(notifications.id, Number(id)), eq(notifications.userId, me.id)));
        return json({ ok: true });
      }

      default:
        return json({ error: "Not found" }, 404);
    }
  } catch (e) {
    return fail(e);
  }
}

/* ============================== DELETE ============================== */

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { resource, id } = await ctx.params;
  try {
    await requireManager();
    const nid = Number(id);
    switch (resource) {
      case "menu":
        await db.delete(menuItems).where(eq(menuItems.id, nid));
        return json({ ok: true });
      case "tables": {
        try {
          await db.delete(tables).where(eq(tables.id, nid));
        } catch {
          throw new ApiError(409, "This table is linked to past orders/bookings — mark it Cleaning instead");
        }
        return json({ ok: true });
      }
      case "inventory":
        await db.delete(inventory).where(eq(inventory.id, nid));
        return json({ ok: true });
      case "staff":
        await db.delete(staff).where(eq(staff.id, nid));
        return json({ ok: true });
      default:
        return json({ error: "Not found" }, 404);
    }
  } catch (e) {
    return fail(e);
  }
}
