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

/**
 * Retorna el rango del periodo anterior para comparacion.
 * today -> ayer, week -> semana pasada, month -> mes pasado
 */
export function getPreviousRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "today": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return getDayRange(yesterday);
    }
    case "week": {
      const prevWeek = new Date(now);
      prevWeek.setDate(prevWeek.getDate() - 7);
      return getWeekRange(prevWeek);
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    default:
      return getMonthRange();
  }
}
