import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { startPolling } from './bot/poller';
import { webhookHandler } from './bot/webhook';
import { startWeeklyReportScheduler } from './scheduler/weeklyReport';
import { subscribeWebhook, getBotInfo } from './max/botClient';

const app = express();

// CSP, совместимый с Mini App: инлайновые стили React, встраивание в клиент MAX.
app.use(
  helmet({
    frameguard: false, // не ставим X-Frame-Options — Mini App встраивается клиентом MAX
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
        fontSrc: ["'self'", 'data:'],
        frameAncestors: ["'self'", 'https://max.ru', 'https://*.max.ru'],
      },
    },
  }),
);
app.use(
  cors({
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Max-Init-Data'],
  }),
);
app.use(express.json({ limit: '256kb' }));

// Webhook (используется только в режиме webhook)
if (config.botUpdatesMode === 'webhook') {
  app.post('/bot/webhook', webhookHandler);
}

app.use('/api', apiRouter);

// Раздача собранного фронтенда (если он скопирован рядом в ./public).
// Это включает режим «один сервис — один URL»: тот же адрес и есть ссылка на Mini App.
const publicDir = process.env.FRONTEND_DIR
  ? path.resolve(process.env.FRONTEND_DIR)
  : path.join(__dirname, 'public');

if (fs.existsSync(path.join(publicDir, 'index.html'))) {
  app.use(express.static(publicDir));
  // SPA-fallback: любые не-API GET-маршруты отдают index.html
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    if (!req.accepts('html')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
  console.log(`[server] фронтенд раздаётся из ${publicDir} (режим single-origin)`);
}

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`[server] backend слушает порт ${config.port} (${config.nodeEnv})`);
  console.log('[server] администраторы (MAX ID):', config.adminMaxUserIds.join(', ') || '—');
  if (!config.botToken) {
    console.warn('[server] MAX_BOT_TOKEN не задан — бот, уведомления и вход в Mini App отключены (сервер работает).');
  }
  if (!config.databaseUrl) {
    console.warn('[server] DATABASE_URL не задан — запросы к БД будут завершаться ошибкой.');
  }

  // Проверим токен бота (не критично при недоступности сети).
  if (config.botToken) {
    getBotInfo()
      .then((info) => console.log('[server] токен бота MAX валиден:', JSON.stringify(info).slice(0, 200)))
      .catch((e) => console.warn('[server] не удалось проверить токен бота:', (e as Error).message));
  }

  // Запуск получения апдейтов
  if (config.botToken && config.botUpdatesMode === 'polling') {
    startPolling();
  } else if (config.botToken && config.botUpdatesMode === 'webhook') {
    if (config.webhookUrl) {
      subscribeWebhook(config.webhookUrl, config.webhookSecret)
        .then(() => console.log('[server] webhook подписка оформлена:', config.webhookUrl))
        .catch((e) => console.error('[server] ошибка подписки webhook:', (e as Error).message));
    } else {
      console.warn('[server] BOT_UPDATES_MODE=webhook, но WEBHOOK_URL не задан');
    }
  }

  // Планировщик еженедельного отчёта
  startWeeklyReportScheduler();
});

function shutdown(signal: string): void {
  console.log(`[server] получен ${signal}, завершение...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
