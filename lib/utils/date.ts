/**
 * Retorna el inicio y fin del dia en UTC para una fecha dada.
 */
export function getDayRange(date: Date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Retorna el inicio de la semana (lunes) y hoy.
 */
export function getWeekRange(date: Date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Retorna el inicio del mes y hoy.
 */
export function getMonthRange(date: Date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
