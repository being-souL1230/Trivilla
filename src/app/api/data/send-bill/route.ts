import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, tables } from "@/db/schema";
import { ApiError, getSessionUser } from "@/lib/auth";
import { sendBillEmail } from "@/lib/resend";

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

const fail = (e: unknown) => {
  if (e instanceof ApiError) return json({ error: e.message }, e.status);
  console.error(e);
  return json({ error: "Something went wrong on our side" }, 500);
};

/**
 * POST /api/data/send-bill
 * Body: { orderId: number, email: string }
 *
 * Sends a beautifully formatted bill invoice to the customer's email
 * with a QR code they can scan to view the bill online.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const me = await getSessionUser();
    const orderId = Number(body.orderId ?? 0);
    if (!orderId) throw new ApiError(400, "Order ID is required");

    // Fetch the order
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    const order = rows[0];
    if (!order) throw new ApiError(404, "Order not found");

    // Only allow sending bill if order is served or completed
    if (order.status !== "served" && order.status !== "completed") {
      throw new ApiError(400, "Bill can only be sent after the order is served");
    }

    // Authorisation: must be the order owner, manager, or chef
    if (me) {
      if (
        me.role !== "manager" &&
        me.role !== "chef" &&
        me.id !== order.userId
      ) {
        throw new ApiError(403, "This is not your order");
      }
    }

    // Determine the recipient email
    let email = String(body.email ?? "").trim().toLowerCase();

    // If the user is logged in and no explicit email provided, use their account email
    if (!email && me) {
      email = me.email;
    }

    if (!email) {
      throw new ApiError(400, "Recipient email is required");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "That email doesn't look right");
    }

    // Fetch order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Fetch table info
    let tableNo: number | null = null;
    if (order.tableId) {
      const t = await db
        .select()
        .from(tables)
        .where(eq(tables.id, order.tableId))
        .limit(1);
      tableNo = t[0]?.tableNo ?? null;
    }

    // Build the bill URL (for QR code)
    const origin = req.headers.get("origin") || req.headers.get("host") || "http://localhost:3000";
    const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`;
    const billUrl = `${baseUrl}/orders?bill=${order.code}`;

    // Send the email
    const sent = await sendBillEmail(email, {
      code: order.code,
      customerName: order.customerName,
      type: order.type,
      tableNo,
      paymentMode: order.paymentMode,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      items: items.map((i) => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
      })),
      note: order.note || undefined,
      createdAt: order.createdAt.toISOString(),
    }, billUrl);

    if (!sent) {
      throw new ApiError(500, "Failed to send email. Please try again.");
    }

    return json({ ok: true, message: `Bill sent to ${email}` });
  } catch (e) {
    return fail(e);
  }
}
