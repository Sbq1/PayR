const DANGEROUS_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Escape a CSV cell per RFC 4180:
 * - wrap in quotes if contains comma, quote, newline, or CR
 * - escape internal quotes by doubling
 *
 * Also prefix with a single quote any cell starting with =, +, -, @, tab, CR
 * to prevent CSV injection (aka formula injection) when opened in Excel.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);

  // CSV injection guard
  if (s.length > 0 && DANGEROUS_PREFIXES.includes(s[0])) {
    s = `'${s}`;
  }

  if (/[",\r\n]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build a CSV string from rows. First row is assumed to be the header.
 * Uses CRLF as per spec + UTF-8 BOM prefix for Excel compatibility.
 */
export function buildCsv(rows: unknown[][]): string {
  const lines = rows.map((row) => row.map(csvCell).join(","));
  return `\uFEFF${lines.join("\r\n")}`;
}
