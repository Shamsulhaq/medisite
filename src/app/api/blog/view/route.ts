import { NextRequest, NextResponse } from "next/server";
import { incrementViewCount } from "@/lib/store";
import { rateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rl = rateLimit(`blogview:${getClientIp(request)}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }
  try {
    const { slug } = await request.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
    await incrementViewCount(slug);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to increment view" }, { status: 500 });
  }
}
