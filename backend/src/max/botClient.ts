import { config } from '../config/env';

/**
 * Тонкий клиент MAX Bot API.
 * База: https://botapi.max.ru (проверено для этого бота), токен — в заголовке Authorization.
 * Документация: https://dev.max.ru/docs-api
 */

export interface LinkButton {
  type: 'link';
  text: string;
  url: string;
}

interface NewMessageBody {
  text: string;
  format?: 'markdown' | 'html';
  notify?: boolean;
  attachments?: Array<{
    type: 'inline_keyboard';
    payload: { buttons: LinkButton[][] };
  }>;
}

async function apiFetch(
  method: 'GET' | 'POST' | 'DELETE',
  pathname: string,
  opts: { query?: Record<string, string | number | undefined>; body?: unknown } = {},
): Promise<{ status: number; data: unknown }> {
  const url = new URL(config.botApiBase + pathname);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: config.botToken,
      'Content-Type': 'application/json',
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  let data: unknown = null;
  const txt = await res.text();
  if (txt) {
    try {
      data = JSON.parse(txt);
    } catch {
      data = txt;
    }
  }
  return { status: res.status, data };
}

/** Отправить текстовое сообщение пользователю в личный диалог. */
export async function sendMessageToUser(
  maxUserId: string | number,
  text: string,
  buttons?: LinkButton[][],
): Promise<void> {
  const body: NewMessageBody = { text, notify: true };
  if (buttons && buttons.length > 0) {
    body.attachments = [{ type: 'inline_keyboard', payload: { buttons } }];
  }

  const { status, data } = await apiFetch('POST', '/messages', {
    query: { user_id: maxUserId },
    body,
  });

  if (status < 200 || status >= 300) {
    console.error(`[bot] Не удалось отправить сообщение user_id=${maxUserId}: ${status}`, data);
    throw new Error(`MAX API вернул статус ${status} при отправке сообщения`);
  }
}

/** Кнопка "Открыть приложение" — deep link или MINI_APP_URL, если заданы. */
export function buildOpenAppButton(startParam?: string): LinkButton[][] | undefined {
  let url = '';
  if (config.botUsername) {
    url = `https://max.ru/${config.botUsername}`;
    if (startParam) url += `?startapp=${encodeURIComponent(startParam)}`;
  } else if (config.miniAppUrl) {
    url = config.miniAppUrl;
  }
  if (!url) return undefined;
  return [[{ type: 'link', text: 'Открыть приложение', url }]];
}

export interface MaxUpdate {
  update_type?: string;
  timestamp?: number;
  message?: {
    sender?: { user_id?: number; name?: string; username?: string; first_name?: string; last_name?: string };
    recipient?: { user_id?: number; chat_id?: number; chat_type?: string };
    body?: { text?: string };
  };
  // bot_started и прочие события несут user в разных полях
  user?: { user_id?: number; name?: string; username?: string; first_name?: string; last_name?: string };
  user_id?: number;
  chat_id?: number;
  [key: string]: unknown;
}

/** Long-polling: получить порцию обновлений. */
export async function getUpdates(
  marker: number | undefined,
  timeoutSec = 30,
  limit = 100,
): Promise<{ updates: MaxUpdate[]; marker: number | undefined }> {
  const { status, data } = await apiFetch('GET', '/updates', {
    query: { marker, timeout: timeoutSec, limit },
  });
  if (status < 200 || status >= 300) {
    throw new Error(`MAX API /updates статус ${status}`);
  }
  const obj = (data ?? {}) as { updates?: MaxUpdate[]; marker?: number };
  return { updates: obj.updates ?? [], marker: obj.marker };
}

/** Подписаться на webhook. */
export async function subscribeWebhook(url: string, secret?: string): Promise<void> {
  const { status, data } = await apiFetch('POST', '/subscriptions', {
    body: {
      url,
      update_types: ['message_created', 'bot_started'],
      ...(secret ? { secret } : {}),
    },
  });
  if (status < 200 || status >= 300) {
    throw new Error(`MAX API /subscriptions статус ${status}: ${JSON.stringify(data)}`);
  }
}

/** Проверка токена: информация о боте (GET /me). */
export async function getBotInfo(): Promise<unknown> {
  const { status, data } = await apiFetch('GET', '/me');
  if (status < 200 || status >= 300) {
    throw new Error(`MAX API /me статус ${status}`);
  }
  return data;
}
