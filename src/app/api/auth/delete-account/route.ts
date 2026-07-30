import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, orders, reservations, orderItems } from "@/db/schema";
import { getSessionUser, destroySession } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Delete order items first (cascade)
    await db
      .delete(orderItems)
      .where(
        eq(
          orderItems.orderId,
          db.select({ id: orders.id }).from(orders).where(eq(orders.userId, user.id))
        )
      );

    // Delete orders
    await db.delete(orders).where(eq(orders.userId, user.id));

    // Delete reservations
    await db.delete(reservations).where(eq(reservations.userId, user.id));

    // Delete user (sessions and notifications will cascade automatically)
    await db.delete(users).where(eq(users.id, user.id));

    // Destroy session
    await destroySession();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
