import { NextRequest, NextResponse } from "next/server";
import { getReadyTime } from "@/lib/ai";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const result = await getReadyTime(Number(orderId));
    if (!result) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("Ready-time error:", e);
    return NextResponse.json({ error: "Could not estimate ready time" }, { status: 500 });
  }
}
