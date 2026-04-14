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
  logoBuffer: Buffer | null;
  logoMime: string | null;
  qrDark: string;
  qrLight: string;
  qrEc: QrErrorCorrection;
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const FALLBACK_PRIMARY = "#4648d4";
const FALLBACK_SECONDARY = "#6b38d4";

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

  // Branded requires a logo; fallback to simple if missing.
  let effectiveStyle: QrFrameStyle = opts.frameStyle;
  if (effectiveStyle === "branded" && !opts.logoBuffer) {
    effectiveStyle = "simple";
  }

  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  drawContent(doc, opts, effectiveStyle, qrBuffer, opts.logoBuffer);

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
    const qrSize = 400;
    doc.image(qr, cx - qrSize / 2, (PAGE_HEIGHT - qrSize) / 2, { width: qrSize });
    return;
  }

  if (style === "simple") {
    const blockW = 320;
    const blockH = 460;
    const blockX = cx - blockW / 2;
    const blockY = (PAGE_HEIGHT - blockH) / 2;

    doc
      .roundedRect(blockX, blockY, blockW, blockH, 20)
      .fill("#FFFFFF");
    
    doc
      .roundedRect(blockX, blockY, blockW, blockH, 20)
      .lineWidth(1)
      .stroke("#E5E7EB");

    let cursorY = blockY + 56;

    const qrSize = 220;
    doc.image(qr, cx - qrSize / 2, cursorY, { width: qrSize });
    cursorY += qrSize + 56;

    const tableText = opts.tableLabel || `Mesa ${opts.tableNumber}`;
    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor("#111827")
      .text(tableText, blockX, cursorY, { width: blockW, align: "center" });

    cursorY += 34;

    doc
      .font("Helvetica")
      .fontSize(14)
      .fillColor("#6B7280")
      .text("Escanea para pagar", blockX, cursorY, {
        width: blockW,
        align: "center",
      });
    return;
  }

  // branded
  const blockW = 360;
  const blockH = 540;
  const blockX = cx - blockW / 2;
  const blockY = (PAGE_HEIGHT - blockH) / 2;

  const primary = sanitizeHex(opts.primaryColor, FALLBACK_PRIMARY);
  const secondary = sanitizeHex(opts.secondaryColor, FALLBACK_SECONDARY);

  // Background and border
  doc
    .roundedRect(blockX, blockY, blockW, blockH, 24)
    .fill("#FFFFFF");

  doc
    .roundedRect(blockX, blockY, blockW, blockH, 24)
    .lineWidth(1)
    .stroke("#E5E7EB");

  // Top color line
  doc.save();
  doc.roundedRect(blockX, blockY, blockW, blockH, 24).clip();
  doc.rect(blockX, blockY, blockW, 8).fill(primary);
  doc.restore();

  let cursorY = blockY + 44;

  if (logo) {
    const logoMaxH = 52;
    const logoMaxW = 160;
    try {
      doc.image(logo, cx - logoMaxW / 2, cursorY, { 
        fit: [logoMaxW, logoMaxH],
        align: "center",
        valign: "center" 
      });
      cursorY += logoMaxH + 16;
    } catch {
      cursorY += 24;
    }
  } else {
    cursorY += 24;
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#111827")
    .text(opts.restaurantName, blockX, cursorY, { width: blockW, align: "center" });
  
  cursorY += 28;

  // Frame around QR to make it feel premium (like a product image)
  const qrFrameSize = 250;
  const qrSize = 210;
  const qrFrameX = cx - qrFrameSize / 2;
  
  doc
    .roundedRect(qrFrameX, cursorY, qrFrameSize, qrFrameSize, 20)
    .fill("#F9FAFB");
  
  doc
    .roundedRect(qrFrameX, cursorY, qrFrameSize, qrFrameSize, 20)
    .lineWidth(1)
    .stroke("#F3F4F6");

  const qrOffset = (qrFrameSize - qrSize) / 2;
  doc.image(qr, qrFrameX + qrOffset, cursorY + qrOffset, { width: qrSize });
  
  cursorY += qrFrameSize + 36;

  const tableText = opts.tableLabel || `Mesa ${opts.tableNumber}`;
  
  doc
    .font("Helvetica-Bold")
    .fontSize(28)
    .fillColor(primary)
    .text(tableText, blockX, cursorY, { width: blockW, align: "center" });
  
  cursorY += 34;

  doc
    .font("Helvetica")
    .fontSize(14)
    .fillColor(secondary)
    .text("Escanea para pagar", blockX, cursorY, { width: blockW, align: "center" });
}
