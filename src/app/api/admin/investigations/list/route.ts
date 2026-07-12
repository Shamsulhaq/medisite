import { NextResponse } from "next/server";
import { getInvestigations } from "@/lib/investigations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const all = await getInvestigations();
  return NextResponse.json(all);
}
