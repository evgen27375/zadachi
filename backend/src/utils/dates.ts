/**
 * Форматирование дат на русском в заданном часовом поясе (IANA).
 * Используется для текстов уведомлений и отчётов.
 */

export function formatDateTimeRu(iso: string | Date, timeZone: string): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(d);
}

export function formatDateRu(iso: string | Date, timeZone: string): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(d);
}

/** Начало текущей недели (понедельник 00:00) в UTC-приближении по смещению. */
export function startOfISOWeek(ref: Date): Date {
  const d = new Date(ref);
  const day = (d.getUTCDay() + 6) % 7; // 0 = понедельник
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function addDays(ref: Date, days: number): Date {
  const d = new Date(ref);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
