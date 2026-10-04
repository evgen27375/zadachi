import path from 'path';
import dotenv from 'dotenv';

// В Docker переменные приходят из env_file/environment.
// Для локального запуска из папки backend/ читаем .env из корня репозитория,
// а также .env рядом (если есть). dotenv не перезаписывает уже заданные значения.
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

function optional(name: string, fallback = ''): string {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : fallback;
}

function toInt(value: string, fallback: number): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

// Не роняем процесс при отсутствии переменных: сервер должен подняться и отдавать
// фронтенд + /api/health даже с неполной конфигурацией (а не падать в crash-loop).
// Отсутствующее логируем предупреждением, а функции, которым переменная нужна,
// корректно деградируют.
function warnIfEmpty(name: string): void {
  if (!process.env[name] || process.env[name]!.trim() === '') {
    console.warn(`[config] ВНИМАНИЕ: не задана переменная ${name} — часть функций будет отключена.`);
  }
}

warnIfEmpty('DATABASE_URL');
warnIfEmpty('MAX_BOT_TOKEN');
warnIfEmpty('ADMIN_MAX_USER_ID');

const adminRaw = optional('ADMIN_MAX_USER_ID');
if (adminRaw && !/^\d+$/.test(adminRaw)) {
  console.warn('[config] ADMIN_MAX_USER_ID должен быть числом (MAX user ID) — значение проигнорировано.');
}
const adminId = /^\d+$/.test(adminRaw) ? adminRaw : '';

export const config = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: toInt(optional('PORT', '8080'), 8080),

  databaseUrl: optional('DATABASE_URL'),

  // MAX
  botToken: optional('MAX_BOT_TOKEN'),
  botApiBase: optional('MAX_BOT_API_BASE', 'https://botapi.max.ru').replace(/\/+$/, ''),
  botUsername: optional('MAX_BOT_USERNAME'),
  miniAppUrl: optional('MINI_APP_URL'),

  // Роли
  adminMaxUserId: adminId, // храним как строку, сравниваем как строку (bigint-safe)

  // Безопасность авторизации
  initDataMaxAgeSeconds: toInt(optional('INIT_DATA_MAX_AGE_SECONDS', '86400'), 86400),

  // CORS
  corsOrigins: optional('CORS_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Апдейты бота
  botUpdatesMode: optional('BOT_UPDATES_MODE', 'polling') as 'polling' | 'webhook' | 'off',
  webhookUrl: optional('WEBHOOK_URL'),
  webhookSecret: optional('WEBHOOK_SECRET'),

  // Отчёты
  appTimezone: optional('APP_TIMEZONE', 'Europe/Moscow'),
  weeklyReportCron: optional('WEEKLY_REPORT_CRON', '0 9 * * 1'),
} as const;

export type AppConfig = typeof config;
