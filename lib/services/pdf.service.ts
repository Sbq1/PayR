import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import type { QrErrorCorrection } from "@/lib/utils/qr";
import type { QrFrameStyle } from "@/lib/services/qr.service";

export interface PrintableOpts {
  qrUrl: string;
  frameStyle: QrFrameStyle;
  tableNumber: number;
  tableLabel: string | null;
  restaurantName: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  qrDark: string;
  qrLight: string;
  qrEc: QrErrorCorrection;
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const FALLBACK_PRIMARY = "#4648d4";
const FALLBACK_SECONDARY = "#6b38d4";
const LOGO_FETCH_TIMEOUT_MS = 5_000;
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_ALLOWED_HOSTS = /\.(supabase\.co|supabase\.in)$/i;

async function fetchLogoBuffer(url: string): Promise<Buffer | null> {
  // SSRF guard: https-only + hostname whitelist + no redirect following.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (!LOGO_ALLOWED_HOSTS.test(parsed.hostname)) return null;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(LOGO_FETCH_TIMEOUT_MS),
      redirect: "error",
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return null;

    const declared = Number(res.headers.get("content-length") || 0);
    if (declared > LOGO_MAX_BYTES) return null;

    const arr = await res.arrayBuffer();
    if (arr.byteLength > LOGO_MAX_BYTES) return null;
    return Buffer.from(arr);
  } catch {
    return null;
  }
}

function sanitizeHex(hex: string | null | undefined, fallback: string): string {
  if (hex && /^#[0-9a-f]{6}$/i.test(hex)) return hex;
  return fallback;
}

export async function generatePrintablePdf(opts: PrintableOpts): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(opts.qrUrl, {
    width: 900,
    margin: 1,
    color: { dark: opts.qrDark, light: opts.qrLight },
    errorCorrectionLevel: opts.qrEc,
  });

  // Branded requires a logo; fallback to simple if missing or fetch fails.
  let effectiveStyle: QrFrameStyle = opts.frameStyle;
  let logoBuffer: Buffer | null = null;
  if (effectiveStyle === "branded") {
    if (opts.logoUrl) {
      logoBuffer = await fetchLogoBuffer(opts.logoUrl);
      if (!logoBuffer) effectiveStyle = "simple";
    } else {
      effectiveStyle = "simple";
    }
  }

  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  drawContent(doc, opts, effectiveStyle, qrBuffer, logoBuffer);

  doc.end();
  return done;
}

function drawContent(
  doc: PDFKit.PDFDocument,
  opts: PrintableOpts,
  style: QrFrameStyle,
  qr: Buffer,
  logo: Buffer | null,
): void {
  const cx = PAGE_WIDTH / 2;

  if (style === "none") {
    const qrSize = 260;
    doc.image(qr, cx - qrSize / 2, (PAGE_HEIGHT - qrSize) / 2, { width: qrSize });
    return;
  }

  const blockW = 300;
  const blockH = 380;
  const blockX = cx - blockW / 2;
  const blockY = (PAGE_HEIGHT - blockH) / 2;

  if (style === "simple") {
    doc
      .roundedRect(blockX, blockY, blockW, blockH, 14)
      .lineWidth(1.5)
      .stroke("#141b2b");

    const qrSize = 220;
    const qrY = blockY + 28;
    doc.image(qr, cx - qrSize / 2, qrY, { width: qrSize });

    const tableText = opts.tableLabel || `Mesa ${opts.tableNumber}`;
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#141b2b")
      .text(tableText, blockX, qrY + qrSize + 16, { width: blockW, align: "center" });

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#464554")
      .text("Escanea para pagar", blockX, qrY + qrSize + 40, {
        width: blockW,
        align: "center",
      });
    return;
  }

  // branded
  const primary = sanitizeHex(opts.primaryColor, FALLBACK_PRIMARY);
  const secondary = sanitizeHex(opts.secondaryColor, FALLBACK_SECONDARY);

  doc
    .roundedRect(blockX, blockY, blockW, blockH, 16)
    .lineWidth(2.5)
    .stroke(primary);

  let cursorY = blockY + 22;

  if (logo) {
    const logoMaxH = 40;
    const logoMaxW = 120;
    try {
      doc.image(logo, cx - logoMaxW / 2, cursorY, { fit: [logoMaxW, logoMaxH] });
      cursorY += logoMaxH + 6;
    } catch {
      // unsupported format — continue without logo
    }
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#464554")
    .text(opts.restaurantName, blockX, cursorY, { width: blockW, align: "center" });
  cursorY += 18;

  const qrSize = 200;
  doc.image(qr, cx - qrSize / 2, cursorY, { width: qrSize });
  cursorY += qrSize + 14;

  const tableText = opts.tableLabel || `Mesa ${opts.tableNumber}`;
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(primary)
    .text(tableText, blockX, cursorY, { width: blockW, align: "center" });
  cursorY += 26;

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(secondary)
    .text("Escanea para pagar", blockX, cursorY, { width: blockW, align: "center" });
}
