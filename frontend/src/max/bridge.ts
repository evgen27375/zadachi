/**
 * Доступ к MAX Mini App Bridge (window.WebApp).
 * Внутри MAX объект WebApp внедряется автоматически.
 * Вне MAX (локальная отладка) используем VITE_DEV_INIT_DATA, если задан.
 */

interface MaxUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface MaxWebApp {
  initData?: string;
  initDataUnsafe?: {
    user?: MaxUser;
    auth_date?: number;
    query_id?: string;
    start_param?: string;
  };
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
}

declare global {
  interface Window {
    WebApp?: MaxWebApp;
  }
}

const devInitData = import.meta.env.VITE_DEV_INIT_DATA as string | undefined;

export function getWebApp(): MaxWebApp | undefined {
  return typeof window !== 'undefined' ? window.WebApp : undefined;
}

/** Строка initData для передачи на backend (валидируется там по HMAC). */
export function getInitData(): string | null {
  const wa = getWebApp();
  if (wa?.initData && wa.initData.length > 0) return wa.initData;
  if (devInitData && devInitData.length > 0) return devInitData;
  return null;
}

/** Небезопасные данные пользователя (только для отображения, НЕ для доверия). */
export function getUnsafeUser(): MaxUser | null {
  const wa = getWebApp();
  if (wa?.initDataUnsafe?.user) return wa.initDataUnsafe.user;
  // Попробуем вытащить из dev initData
  const raw = getInitData();
  if (raw) {
    try {
      const u = new URLSearchParams(raw).get('user');
      if (u) return JSON.parse(u) as MaxUser;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** start_param из deep link (?startapp=...), напр. "task_123". */
export function getStartParam(): string | null {
  const wa = getWebApp();
  return wa?.initDataUnsafe?.start_param ?? null;
}

export function isInsideMax(): boolean {
  return !!getWebApp()?.initData;
}

/** Сообщить MAX, что приложение готово (если метод доступен). */
export function notifyReady(): void {
  try {
    getWebApp()?.ready?.();
    getWebApp()?.expand?.();
  } catch {
    /* ignore */
  }
}
