import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// Allowed types: images for photos/covers/inline, plus PDF for test reports.
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid form data." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "No file provided." },
      { status: 400 }
    );
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: "Unsupported file type. Use JPG, PNG, WEBP, GIF, or PDF." },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "File too large (max 8 MB)." },
      { status: 413 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), bytes);
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to store the file." },
      { status: 500 }
    );
  }

  const url = `/uploads/${name}`;
  return NextResponse.json({ ok: true, url, type: file.type }, { status: 201 });
}
