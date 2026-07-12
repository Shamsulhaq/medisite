import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public assets are stored outside Next's build-time `public/` dir so runtime
// uploads are served reliably in production (see /uploads route handler).
const UPLOAD_DIR = path.join(process.cwd(), "data", "public-uploads");
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per file

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Find session
  const uploadSession = await prisma.uploadSession.findUnique({
    where: { token },
  });

  if (!uploadSession) {
    return NextResponse.json({ ok: false, error: "Invalid upload link" }, { status: 404 });
  }

  // Check expiry
  if (new Date() > uploadSession.expiresAt) {
    if (uploadSession.status === "waiting") {
      await prisma.uploadSession.update({
        where: { id: uploadSession.id },
        data: { status: "expired" },
      });
    }
    return NextResponse.json({ ok: false, error: "This upload link has expired" }, { status: 410 });
  }

  // Check status
  if (uploadSession.status !== "waiting") {
    return NextResponse.json({ ok: false, error: "This upload session is no longer active" }, { status: 400 });
  }

  // Parse form data
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
  }

  const files = form.getAll("files");
  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "No files provided" }, { status: 400 });
  }

  const urls: string[] = [];

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  for (const file of files) {
    if (!(file instanceof File)) continue;

    const ext = ALLOWED[file.type];
    if (!ext) continue; // skip unsupported files

    if (file.size > MAX_BYTES) continue; // skip too-large files

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

    await fs.writeFile(path.join(UPLOAD_DIR, name), bytes);
    urls.push(`/uploads/${name}`);
  }

  if (urls.length === 0) {
    return NextResponse.json({ ok: false, error: "No valid files uploaded. Supported: JPG, PNG, WEBP, GIF, PDF (max 8MB each)" }, { status: 400 });
  }

  // Update session with uploaded file URLs and mark completed
  await prisma.uploadSession.update({
    where: { id: uploadSession.id },
    data: {
      files: urls,
      status: "completed",
    },
  });

  return NextResponse.json({ ok: true, files: urls }, { status: 201 });
}
