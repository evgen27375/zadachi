import crypto from 'crypto';
import { config } from '../config/env';

/**
 * Утилита для ЛОКАЛЬНОЙ разработки: печатает корректно подписанную строку
 * initData, как её прислал бы MAX. Требует MAX_BOT_TOKEN (есть только у вас),
 * поэтому проверка подписи на backend остаётся включённой и настоящей.
 *
 * Использование:
 *   npm run make-initdata -- --id 123456 --first Иван --username ivan
 *
 * Полученную строку вставьте во frontend/.env.local как VITE_DEV_INIT_DATA
 * (только для dev-запуска вне MAX).
 */
function arg(name: string, fallback = ''): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const id = arg('id', '100001');
const first = arg('first', 'Тест');
const last = arg('last', '');
const username = arg('username', '');

const user: Record<string, unknown> = { id: Number(id), first_name: first };
if (last) user.last_name = last;
if (username) user.username = username;

const fields: Record<string, string> = {
  auth_date: String(Math.floor(Date.now() / 1000)),
  query_id: crypto.randomBytes(8).toString('hex'),
  user: JSON.stringify(user),
};

const dataCheckString = Object.keys(fields)
  .sort()
  .map((k) => `${k}=${fields[k]}`)
  .join('\n');

const secretKey = crypto.createHmac('sha256', 'WebAppData').update(config.botToken).digest();
const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

const params = new URLSearchParams({ ...fields, hash });

process.stdout.write(params.toString() + '\n');
