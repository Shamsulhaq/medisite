import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateQRBase64 } from "@/lib/qr";

// -----------------------------------------------------------------------------
// GET /api/admin/qr?data=<url> — generates a QR code (base64 SVG) for the
// given text/URL. Used by client components (e.g. ConsultationForm's print
// preview) that need a QR code before a record has a server-renderable page
// of its own, since `generateQRBase64` depends on the Node `qrcode` package
// and cannot run in the browser.
// -----------------------------------------------------------------------------

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data") ?? "";
  if (!data) {
    return NextResponse.json({ error: "Missing 'data' query parameter" }, { status: 400 });
  }
  // Cap length to avoid generating unreasonably large QR codes from abuse.
  if (data.length > 2000) {
    return NextResponse.json({ error: "'data' is too long" }, { status: 400 });
  }

  const svgBase64 = await generateQRBase64(data);
  return NextResponse.json({ svgBase64 });
}
