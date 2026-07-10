import { NextResponse } from "next/server";
import { getMedicineDB, searchMedicineDB } from "@/lib/medicine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const db = await getMedicineDB();
  const results = searchMedicineDB(db, q, 15);
  return NextResponse.json(results);
}
