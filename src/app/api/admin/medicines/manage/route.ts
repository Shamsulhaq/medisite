import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getMedicineDB,
  importMedicines,
  exportMedicineCSV,
  parseMedicineCSV,
} from "@/lib/medicine-db";
import type { MedicineRef } from "@/lib/medicines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET → export as JSON or CSV
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const db = await getMedicineDB();

  if (format === "csv") {
    const csv = exportMedicineCSV(db);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=medicines.csv",
      },
    });
  }
  return NextResponse.json(db);
}

// POST → import JSON or CSV
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";
  const modeParam = new URL(request.url).searchParams.get("mode") ?? "merge";
  const mode = modeParam === "replace" ? "replace" : "merge";

  let medicines: MedicineRef[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file." }, { status: 400 });
    }
    const text = await file.text();
    if (file.name.endsWith(".csv")) {
      medicines = parseMedicineCSV(text);
    } else {
      try {
        medicines = JSON.parse(text);
        if (!Array.isArray(medicines)) throw new Error();
      } catch {
        return NextResponse.json(
          { ok: false, error: "Invalid JSON file." },
          { status: 400 }
        );
      }
    }
  } else {
    try {
      medicines = await request.json();
      if (!Array.isArray(medicines)) throw new Error();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid body." },
        { status: 400 }
      );
    }
  }

  const count = await importMedicines(medicines, mode);
  const total = (await getMedicineDB()).length;
  return NextResponse.json({ ok: true, imported: count, total });
}
