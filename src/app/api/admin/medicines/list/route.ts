import { NextResponse } from "next/server";
import { getMedicineDB } from "@/lib/medicine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(100, Math.max(10, Number(searchParams.get("per") ?? 50)));
  const alpha = (searchParams.get("alpha") ?? "").toLowerCase();

  const db = await getMedicineDB();

  const filtered = alpha
    ? db.filter((m) => m.generic.toLowerCase().startsWith(alpha))
    : db;

  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const items = filtered.slice((page - 1) * perPage, page * perPage);

  return NextResponse.json({ items, total, page, totalPages, perPage });
}
