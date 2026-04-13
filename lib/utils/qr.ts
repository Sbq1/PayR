import QRCode from "qrcode";

export type QrErrorCorrection = "L" | "M" | "Q" | "H";

export interface QrRenderOptions {
  dark?: string;
  light?: string;
  errorCorrection?: QrErrorCorrection;
  width?: number;
  margin?: number;
}

const DEFAULTS: Required<QrRenderOptions> = {
  dark: "#000000",
  light: "#ffffff",
  errorCorrection: "M",
  width: 400,
  margin: 2,
};

/**
 * Genera la URL del QR para una mesa.
 */
export function getTableQrUrl(slug: string, tableId: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\\n|\n/g, "").trim();
  return `${baseUrl}/${slug}/${tableId}`;
}

/**
 * Genera un QR code como data URL (base64 PNG) con opciones personalizadas.
 * Valores fuera de spec caen a default — nunca lanza.
 */
export async function generateQrDataUrl(
  url: string,
  opts: QrRenderOptions = {},
): Promise<string> {
  const merged = { ...DEFAULTS, ...opts };
  return QRCode.toDataURL(url, {
    width: merged.width,
    margin: merged.margin,
    color: {
      dark: merged.dark,
      light: merged.light,
    },
    errorCorrectionLevel: merged.errorCorrection,
  });
}
