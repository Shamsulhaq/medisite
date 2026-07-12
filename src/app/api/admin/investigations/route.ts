import { NextResponse } from "next/server";
import { searchInvestigations, addInvestigation } from "@/lib/investigations";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = await searchInvestigations(q, 12);
  return NextResponse.json(results);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    await addInvestigation({ name: body.name, category: body.category || "", aliases: body.aliases || [] });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to add investigation." }, { status: 500 });
  }
}
