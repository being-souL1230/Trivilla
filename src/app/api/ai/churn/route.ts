import { NextResponse } from "next/server";
import { getChurnedCustomers } from "@/lib/ai";
import { requireManager, ApiError } from "@/lib/auth";

export async function GET() {
  try {
    await requireManager();
    const churned = await getChurnedCustomers();
    return NextResponse.json(churned);
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Churn detector error:", e);
    return NextResponse.json({ error: "Could not detect churned customers" }, { status: 500 });
  }
}
