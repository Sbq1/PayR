import QRCode from "qrcode";

/**
 * Genera la URL del QR para una mesa.
 */
export function getTableQrUrl(slug: string, tableId: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\\n|\n/g, "").trim();
  return `${baseUrl}/${slug}/${tableId}`;
}

/**
 * Genera un QR code como data URL (base64 PNG).
 */
export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}
