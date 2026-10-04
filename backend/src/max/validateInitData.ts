import crypto from 'crypto';
import type { MaxAuthUser } from '../types';

export type ValidateResult =
  | { ok: true; user: MaxAuthUser; authDate: number | null }
  | { ok: false; error: string };

/**
 * Проверка подлинности initData, переданного MAX Mini App.
 *
 * Алгоритм (официальная документация MAX, раздел "Валидация данных"):
 *   1. Разобрать строку initData (URL-кодирование) в пары key=value.
 *   2. Исключить параметр `hash`, сохранив его отдельно.
 *   3. Отсортировать оставшиеся параметры по ключу (a→z).
 *   4. Объединить пары `key=value` разделителем `\n` (data-check-string).
 *   5. secret_key = HMAC_SHA256(key="WebAppData", message=BOT_TOKEN).
 *   6. computed   = HEX(HMAC_SHA256(key=secret_key, message=data-check-string)).
 *   7. Сравнить computed с полученным `hash` (timing-safe).
 *
 * НИКОГДА не доверяем user.id, пришедшему от фронтенда напрямую — только
 * прошедшему эту проверку.
 */
export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 0,
): ValidateResult {
  if (!initData || typeof initData !== 'string') {
    return { ok: false, error: 'initData отсутствует' };
  }

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { ok: false, error: 'initData имеет неверный формат' };
  }

  const hash = params.get('hash');
  if (!hash) {
    return { ok: false, error: 'В initData отсутствует hash' };
  }
  params.delete('hash');

  // data-check-string: ключи по алфавиту, пары key=value через \n.
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (!timingSafeEqualHex(computed, hash)) {
    return { ok: false, error: 'Подпись initData недействительна' };
  }

  // Проверка возраста данных (защита от повторного использования).
  const authDateRaw = params.get('auth_date');
  let authDate: number | null = null;
  if (authDateRaw && /^\d+$/.test(authDateRaw)) {
    authDate = Number.parseInt(authDateRaw, 10);
    if (maxAgeSeconds > 0) {
      const nowSec = Math.floor(Date.now() / 1000);
      if (nowSec - authDate > maxAgeSeconds) {
        return { ok: false, error: 'Срок действия авторизации MAX истёк' };
      }
    }
  }

  // Разбор пользователя.
  const userRaw = params.get('user');
  if (!userRaw) {
    return { ok: false, error: 'В initData отсутствует объект user' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(userRaw);
  } catch {
    return { ok: false, error: 'Поле user в initData не является корректным JSON' };
  }

  const u = parsed as Record<string, unknown>;
  const id = u.id;
  if (id === undefined || id === null || !/^\d+$/.test(String(id))) {
    return { ok: false, error: 'Некорректный user.id в initData' };
  }

  const user: MaxAuthUser = {
    id: String(id),
    first_name: typeof u.first_name === 'string' ? u.first_name : '',
    last_name: typeof u.last_name === 'string' ? u.last_name : null,
    username: typeof u.username === 'string' ? u.username : null,
  };

  return { ok: true, user, authDate };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
