import { NextRequest, NextResponse } from "next/server";
import { incrementViewCount } from "@/lib/store";

export async function POST(request: NextRequest) {
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
