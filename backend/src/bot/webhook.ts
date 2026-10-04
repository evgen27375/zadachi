import type { Request, Response } from 'express';
import { config } from '../config/env';
import { handleUpdate } from './poller';
import type { MaxUpdate } from '../max/botClient';

/**
 * Обработчик входящих webhook-событий MAX.
 * Отвечаем 200 сразу, обработку делаем асинхронно (требование <30с).
 */
export function webhookHandler(req: Request, res: Response): void {
  if (config.webhookSecret) {
    const got = req.header('X-Max-Bot-Api-Secret');
    if (got !== config.webhookSecret) {
      res.status(401).json({ error: 'bad secret' });
      return;
    }
  }
  res.status(200).json({ ok: true });

  const update = req.body as MaxUpdate;
  handleUpdate(update).catch((e) =>
    console.error('[webhook] ошибка обработки апдейта:', (e as Error).message),
  );
}
