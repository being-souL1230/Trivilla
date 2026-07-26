import { NextResponse } from "next/server";
import { getSpecials } from "@/lib/ai";

export async function GET() {
  try {
    const specials = await getSpecials();
    return NextResponse.json(specials);
  } catch (e) {
    console.error("AI specials error:", e);
    return NextResponse.json(
      { error: "Could not load specials" },
      { status: 500 },
    );
  }
}
