import type { HistoryEventType, Priority, TaskStatus } from '../types';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  NOT_STARTED: 'Не начато',
  IN_PROGRESS: 'В процессе',
  DONE: 'Выполнено',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  NORMAL: 'Обычный',
  IMPORTANT: 'Важный',
  URGENT: 'Срочный',
};

export const EVENT_LABEL: Record<HistoryEventType, string> = {
  CREATED: 'Задача создана',
  STARTED: 'Начато выполнение',
  COMPLETED: 'Задача выполнена',
  STATUS_CHANGED: 'Изменён статус',
  COMMENT_ADDED: 'Добавлен комментарий',
};

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Русское склонение: 1 задача / 2 задачи / 5 задач. */
export function pluralTasks(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'Активная задача';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'Активные задачи';
  return 'Активных задач';
}

/** Для <input type="datetime-local"> нужен формат YYYY-MM-DDTHH:mm в локальном времени. */
export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
