import { NextResponse } from "next/server";
import { getMedicinesPage } from "@/lib/medicine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(100, Math.max(10, Number(searchParams.get("per") ?? 50)));
  const alpha = searchParams.get("alpha") ?? "";

  // DB-level pagination: only the requested page is loaded from the database
  // (previously the entire medicine table was loaded and sliced in memory).
  const { items, total, totalPages, page: current, perPage: per } =
    await getMedicinesPage({ page, perPage, alpha });

  return NextResponse.json({ items, total, page: current, totalPages, perPage: per });
}
