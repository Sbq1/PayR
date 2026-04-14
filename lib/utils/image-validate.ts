import sharp from "sharp";

export const LOGO_MAX_BYTES = 512_000; // 500 KB
export const LOGO_MAX_DIMENSION = 1000; // px
export const LOGO_ALLOWED_MIMES = ["image/png", "image/jpeg", "image/webp"] as const;

export type LogoMime = (typeof LOGO_ALLOWED_MIMES)[number];

export interface ValidatedImage {
  buffer: Buffer;
  mime: LogoMime;
  width: number;
  height: number;
}

export type ImageValidationError =
  | { code: "invalid_mime" }
  | { code: "invalid_image" }
  | { code: "file_too_large"; max: number }
  | { code: "dimensions_too_large"; max: number }
  | { code: "empty_file" };

export type ValidationResult =
  | { ok: true; data: ValidatedImage }
  | { ok: false; error: ImageValidationError };

function matchesMagicBytes(buf: Buffer, mime: LogoMime): boolean {
  if (mime === "image/png") {
    return (
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  }
  if (mime === "image/jpeg") {
    return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === "image/webp") {
    return (
      buf.length >= 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    );
  }
  return false;
}

function isAllowedMime(mime: string): mime is LogoMime {
  return (LOGO_ALLOWED_MIMES as readonly string[]).includes(mime);
}

export async function validateImageUpload(file: File): Promise<ValidationResult> {
  if (!file || file.size === 0) {
    return { ok: false, error: { code: "empty_file" } };
  }

  if (file.size > LOGO_MAX_BYTES) {
    return { ok: false, error: { code: "file_too_large", max: LOGO_MAX_BYTES } };
  }

  if (!isAllowedMime(file.type)) {
    return { ok: false, error: { code: "invalid_mime" } };
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  if (!matchesMagicBytes(rawBuffer, file.type)) {
    return { ok: false, error: { code: "invalid_image" } };
  }

  let meta: sharp.Metadata;
  let cleanBuffer: Buffer;
  try {
    const pipeline = sharp(rawBuffer, { failOn: "error" }).rotate();
    meta = await pipeline.metadata();
    cleanBuffer = await pipeline.toBuffer();
  } catch {
    return { ok: false, error: { code: "invalid_image" } };
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width === 0 || height === 0) {
    return { ok: false, error: { code: "invalid_image" } };
  }
  if (width > LOGO_MAX_DIMENSION || height > LOGO_MAX_DIMENSION) {
    return {
      ok: false,
      error: { code: "dimensions_too_large", max: LOGO_MAX_DIMENSION },
    };
  }

  return {
    ok: true,
    data: {
      buffer: cleanBuffer,
      mime: file.type,
      width,
      height,
    },
  };
}

export function imageValidationMessage(err: ImageValidationError): string {
  switch (err.code) {
    case "invalid_mime":
      return "Formato no permitido. Usa PNG, JPEG o WebP.";
    case "invalid_image":
      return "El archivo no es una imagen válida.";
    case "file_too_large":
      return `El archivo supera el límite de ${Math.round(err.max / 1024)} KB.`;
    case "dimensions_too_large":
      return `La imagen supera ${err.max}×${err.max} px.`;
    case "empty_file":
      return "El archivo está vacío.";
  }
}
