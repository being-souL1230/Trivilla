import { NextResponse } from "next/server";
import { getStaffRecommendation } from "@/lib/ai";
import { requireManager, ApiError } from "@/lib/auth";

export async function GET() {
  try {
    await requireManager();
    const recommendation = await getStaffRecommendation();
    return NextResponse.json(recommendation);
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Staff optimizer error:", e);
    return NextResponse.json({ error: "Could not optimize staff" }, { status: 500 });
  }
}
