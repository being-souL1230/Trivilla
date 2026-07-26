import { NextRequest, NextResponse } from "next/server";
import { getComboPairings } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const menuItemIds = (body.menuItemIds ?? []) as number[];
    const limit = typeof body.limit === "number" ? body.limit : 4;

    const pairings = await getComboPairings(menuItemIds, limit);
    return NextResponse.json(pairings);
  } catch (e) {
    console.error("Pairings error:", e);
    return NextResponse.json({ error: "Could not load pairings" }, { status: 500 });
  }
}
