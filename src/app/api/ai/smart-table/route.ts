import { NextRequest, NextResponse } from "next/server";
import { getSmartTableSuggestion } from "@/lib/ai";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const guests = parseInt(url.searchParams.get("guests") ?? "2", 10);
    const zone = url.searchParams.get("zone") ?? undefined;
    const excludeParam = url.searchParams.get("exclude") ?? "";
    const excludeTableIds = excludeParam
      ? excludeParam.split(",").map(Number).filter(Boolean)
      : [];

    const suggestion = await getSmartTableSuggestion(guests, zone, excludeTableIds);
    return NextResponse.json(suggestion ? [suggestion] : []);
  } catch (e) {
    console.error("Smart table error:", e);
    return NextResponse.json({ error: "Could not suggest table" }, { status: 500 });
  }
}
