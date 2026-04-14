import QRCode from "qrcode";
import sharp from "sharp";

export type QrErrorCorrection = "L" | "M" | "Q" | "H";

export interface QrRenderOptions {
  dark?: string;
  light?: string;
  errorCorrection?: QrErrorCorrection;
  width?: number;
  margin?: number;
}

export interface QrLogoInput {
  buffer: Buffer;
  mime: string;
}

const DEFAULTS: Required<QrRenderOptions> = {
  dark: "#000000",
  light: "#ffffff",
  errorCorrection: "M",
  width: 400,
  margin: 2,
};

const LOGO_RATIO = 0.23;
const LOGO_PAD_RATIO = 0.18;
const LOGO_CORNER_RADIUS_RATIO = 0.18;

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

/**
 * Genera un QR con logo embebido en el centro (20% del QR).
 * Fuerza EC "H" internamente para tolerar la zona oculta por el logo.
 */
export async function generateQrWithLogo(
  url: string,
  opts: QrRenderOptions,
  logo: QrLogoInput,
): Promise<string> {
  const merged = { ...DEFAULTS, ...opts, errorCorrection: "H" as QrErrorCorrection };

  const qrBuffer = await QRCode.toBuffer(url, {
    width: merged.width,
    margin: merged.margin,
    color: { dark: merged.dark, light: merged.light },
    errorCorrectionLevel: merged.errorCorrection,
    type: "png",
  });

  const logoSize = Math.round(merged.width * LOGO_RATIO);
  const pad = Math.round(logoSize * LOGO_PAD_RATIO);
  const innerSize = Math.max(1, logoSize - pad * 2);
  const cornerRadius = Math.round(logoSize * LOGO_CORNER_RADIUS_RATIO);
  const padColor = hexToRgb(merged.light);
  const safeLight = /^#[0-9a-fA-F]{6}$/.test(merged.light) ? merged.light : "#ffffff";

  // Logo: flatten alpha + resize sin amplificar (evita pixelar logos chicos)
  const logoContent = await sharp(logo.buffer)
    .flatten({ background: padColor })
    .resize(innerSize, innerSize, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  // Card: fondo con esquinas redondeadas (SVG mask) sobre canvas transparente
  const roundedBg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${logoSize}" height="${logoSize}"><rect width="${logoSize}" height="${logoSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="${safeLight}"/></svg>`,
  );

  const logoCard = await sharp({
    create: {
      width: logoSize,
      height: logoSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: roundedBg, top: 0, left: 0 },
      { input: logoContent, gravity: "center" },
    ])
    .png()
    .toBuffer();

  const finalBuffer = await sharp(qrBuffer)
    .composite([{ input: logoCard, gravity: "center" }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${finalBuffer.toString("base64")}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number; alpha: 1 } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return {
    r: Number.isFinite(r) ? r : 255,
    g: Number.isFinite(g) ? g : 255,
    b: Number.isFinite(b) ? b : 255,
    alpha: 1,
  };
}
