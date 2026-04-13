/**
 * Validación de colores para QR personalizado.
 *
 * - Hex #RRGGBB (6 chars) — no aceptamos shorthand #RGB ni alpha
 * - Contraste WCAG: para QR escaneable se recomienda ratio ≥ 3:1.
 *   El algoritmo QR tolera, pero la fase de decodificación física
 *   (camera + ML) falla con bajo contraste.
 */

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const MIN_CONTRAST_RATIO = 3;

export function isValidHex(value: string): boolean {
  return HEX_RE.test(value);
}

export function normalizeHex(value: string): string {
  return value.toLowerCase();
}

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Ratio WCAG (1 a 21). ≥4.5 para texto normal AA, ≥3 para UI / large text.
 * Para QR usamos 3 como mínimo funcional (no solo estético).
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ColorValidationError =
  | { code: "invalid_hex"; which: "dark" | "light" }
  | { code: "colors_identical" }
  | { code: "contrast_insufficient"; ratio: number; min: number };

export function validateQrColors(
  dark: string,
  light: string,
): ColorValidationError | null {
  if (!isValidHex(dark)) return { code: "invalid_hex", which: "dark" };
  if (!isValidHex(light)) return { code: "invalid_hex", which: "light" };

  const d = normalizeHex(dark);
  const l = normalizeHex(light);
  if (d === l) return { code: "colors_identical" };

  const ratio = contrastRatio(d, l);
  if (ratio < MIN_CONTRAST_RATIO) {
    return {
      code: "contrast_insufficient",
      ratio: Math.round(ratio * 100) / 100,
      min: MIN_CONTRAST_RATIO,
    };
  }

  return null;
}
