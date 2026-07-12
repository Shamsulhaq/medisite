// -----------------------------------------------------------------------------
// Public asset serving route — serves uploaded public files (doctor photo,
// blog cover images) at /uploads/<filename>.
//
// Why a route handler instead of the static /public directory?
// Next.js treats `public/` as BUILD-TIME static assets. Files uploaded at
// runtime are not reliably served in production (standalone output serves a
// build snapshot; containerized/ephemeral filesystems reset public/ on deploy).
// Reading the bytes from disk here makes uploads work in every deployment mode,
// exactly like the authenticated /api/admin/files route does for secure files.
//
// Storage: files are read from data/public-uploads/ (persistent) with a
// fallback to the legacy public/uploads/ location for older uploads.
// -----------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read order: persistent dir first, then the legacy public/uploads location.
const UPLOAD_DIRS = [
  path.join(process.cwd(), "data", "public-uploads"),
  path.join(process.cwd(), "public", "uploads"),
];

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path;
  if (!segments || segments.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Prevent path traversal
  const filename = segments.join("/");
  if (filename.includes("..") || filename.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext];
  if (!contentType) {
    // Only known public asset types are served here.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  for (const dir of UPLOAD_DIRS) {
    const resolved = path.resolve(path.join(dir, filename));
    // Ensure the resolved path stays within the base directory.
    if (!resolved.startsWith(path.resolve(dir) + path.sep)) {
      continue;
    }
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isFile()) continue;
      const fileBuffer = await fs.readFile(resolved);
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(stat.size),
          // Filenames are unique (timestamp + random), so cache aggressively.
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
          // Parity with the previous nginx /uploads block.
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch {
      // Not in this directory — try the next one.
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
