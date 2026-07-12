import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPatients } from "@/lib/patients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json([], { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (!q) return NextResponse.json([]);

  const patients = await getPatients();
  const results = patients
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.replace(/[\s\-()]/g, "").includes(q.replace(/[\s\-()]/g, "")) ||
        p.patientId.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    )
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      patientId: p.patientId,
    }));

  return NextResponse.json(results);
}
