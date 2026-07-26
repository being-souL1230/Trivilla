import { NextRequest } from "next/server";
import { requireManager } from "@/lib/auth";
import { getBadgeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireManager();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const push = async () => {
        if (closed) return;
        try {
          const data = await getBadgeStats();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // keep-alive on error
        }
      };

      // Push immediately, then every 3s
      push();
      const interval = setInterval(push, 3000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
