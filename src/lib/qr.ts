import QRCode from "qrcode";

/**
 * Generate a QR code as a base64-encoded SVG data string.
 * Used for embedding in prescription print HTML.
 */
export async function generateQRBase64(data: string): Promise<string> {
  try {
    const svg = await QRCode.toString(data, { type: "svg", width: 80, margin: 1 });
    return Buffer.from(svg).toString("base64");
  } catch {
    return "";
  }
}
