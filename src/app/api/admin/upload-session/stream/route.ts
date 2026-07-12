import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // No auth required — the upload token itself is the secret (time-limited, single-use)
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response(JSON.stringify({ error: "token is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify session exists
  const uploadSession = await prisma.uploadSession.findUnique({
    where: { token },
  });

  if (!uploadSession) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If already completed or expired, send immediate response
  if (uploadSession.status === "completed") {
    const body = `event: update\ndata: ${JSON.stringify({ status: "completed", files: uploadSession.files })}\n\n`;
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  if (uploadSession.status === "expired" || new Date() > uploadSession.expiresAt) {
    const body = `event: expired\ndata: ${JSON.stringify({ status: "expired" })}\n\n`;
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // Create SSE stream
  let closed = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          cleanup();
        }
      }

      function cleanup() {
        closed = true;
        if (pollInterval) clearInterval(pollInterval);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      }

      // Send initial connected event
      send("connected", { status: "waiting" });

      // Poll database every 2 seconds for status changes
      pollInterval = setInterval(async () => {
        if (closed) return;

        try {
          const current = await prisma.uploadSession.findUnique({
            where: { token },
          });

          if (!current) {
            send("error", { message: "Session not found" });
            cleanup();
            return;
          }

          // Check if expired by time
          if (new Date() > current.expiresAt && current.status === "waiting") {
            await prisma.uploadSession.update({
              where: { id: current.id },
              data: { status: "expired" },
            });
            send("expired", { status: "expired" });
            cleanup();
            return;
          }

          if (current.status === "completed") {
            send("update", { status: "completed", files: current.files });
            cleanup();
            return;
          }

          if (current.status === "expired") {
            send("expired", { status: "expired" });
            cleanup();
            return;
          }
        } catch {
          // DB error — don't close, will retry next interval
        }
      }, 2000);

      // Heartbeat every 15 seconds to keep connection alive
      heartbeatInterval = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          cleanup();
        }
      }, 15000);

      // Safety: close after 11 minutes max (session expires in 10 min)
      setTimeout(() => {
        if (!closed) {
          send("expired", { status: "expired", message: "Stream timeout" });
          cleanup();
        }
      }, 11 * 60 * 1000);
    },

    cancel() {
      closed = true;
      if (pollInterval) clearInterval(pollInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
