/**
 * Convierte pesos COP a centavos para almacenamiento.
 */
export function toCents(cop: number): number {
  return Math.round(cop * 100);
}

/**
 * Convierte centavos a pesos COP.
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Formatea centavos como moneda colombiana.
 * Ejemplo: 4990000 → "$49.900"
 */
export function formatCOP(cents: number): string {
  const pesos = Math.round(cents / 100);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pesos);
}
