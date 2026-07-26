import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getRecommendations } from "@/lib/ai";

export async function GET(_req: NextRequest) {
  try {
    const user = await getSessionUser();
    const userId = user?.id ?? null;
    const vegOnly = user?.vegOnly ?? false;

    const recommendations = await getRecommendations(userId, vegOnly);
    return NextResponse.json(recommendations);
  } catch (e) {
    console.error("AI recommendations error:", e);
    return NextResponse.json(
      { error: "Could not load recommendations" },
      { status: 500 },
    );
  }
}
