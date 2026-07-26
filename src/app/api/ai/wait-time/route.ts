import { NextResponse } from "next/server";
import { getWaitTime } from "@/lib/ai";

export async function GET() {
  try {
    const waitTime = await getWaitTime();
    return NextResponse.json(waitTime);
  } catch (e) {
    console.error("AI wait-time error:", e);
    // Fallback: return a sensible default
    return NextResponse.json({
      averageWait: 15,
      queueDepth: 0,
      activeChefs: 2,
      peakMultiplier: 1,
      orderEstimates: [],
    });
  }
}
